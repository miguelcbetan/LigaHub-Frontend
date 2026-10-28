"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ApiError, configureHttp } from "@/lib/api/http";
import { decodeJwtPayload } from "@/lib/jwt";

const STORAGE_KEY = "ligahub-session";

/** Claves de versiones anteriores del front: nada las lee, así que se purgan para no dejar tokens huérfanos. */
const LEGACY_KEYS = ["futbol-admin-session"];

/** Cada cuánto se compara el token en memoria con el del storage (detecta ediciones manuales). */
const TAMPER_CHECK_MS = 1000;

/** Lo que persistimos del login. El backend no tiene refresh token. */
interface StoredSession {
  accessToken: string;
  /** ISO-8601 que devuelve el backend en `expiresAt`. */
  expiresAt: string;
  userId: string;
  email: string;
}

/** Permiso efectivo del usuario (viene de GET /api/auth/me). */
export interface SessionPermission {
  method: string;
  url: string;
  model: string;
}

/** Usuario de la sesión. Si /api/auth/me falla, `permissions` queda vacío y no se muestra ningún módulo. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  /** Data-URL de la foto de perfil; vive solo en memoria. */
  photoUrl?: string;
  roleNames: string[];
  permissions: SessionPermission[];
}

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** `true` mientras se rehidrata la sesión desde el storage. */
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  /** Vuelve a consultar /api/auth/me (foto, nombre, roles y permisos). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** El login puede guardarse en localStorage ("mantener sesión") o solo en la pestaña. */
function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.accessToken && parsed?.userId) return parsed;
    } catch {
      // Storage bloqueado o contenido corrupto: se ignora.
    }
  }

  return null;
}

/** Devuelve `false` si no se pudo persistir (la sesión vive solo en memoria hasta recargar). */
function writeStoredSession(session: StoredSession, remember: boolean): boolean {
  try {
    const target = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    other.removeItem(STORAGE_KEY);
    target.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

function clearStoredSession() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Nada que limpiar.
  }
}

/**
 * Instante (ms) en que vence la sesión. Se toma el menor entre `expiresAt`
 * (editable en el storage) y el claim `exp` del propio JWT, para que cambiar
 * una fecha a mano no alargue la sesión.
 */
function expirationTime(session: StoredSession): number {
  const fromField = new Date(session.expiresAt).getTime();
  const exp = decodeJwtPayload(session.accessToken)?.exp;
  const fromToken = typeof exp === "number" ? exp * 1000 : Number.NaN;
  const candidates = [fromField, fromToken].filter(Number.isFinite);
  return candidates.length ? Math.min(...candidates) : Number.POSITIVE_INFINITY;
}

const isExpired = (session: StoredSession) => expirationTime(session) <= Date.now();

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // http.ts lee el token por referencia para no re-configurarse en cada render.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = session?.accessToken ?? null;
  // Solo se compara contra el storage si la sesión llegó a guardarse en él.
  const persistedRef = useRef(false);

  /** Descarta la sesión local sin navegar; RequireAuth se encarga de ir a /login. */
  const dropSession = useCallback(() => {
    clearStoredSession();
    tokenRef.current = null;
    setSession(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    dropSession();
    router.replace("/login");
  }, [dropSession, router]);

  // El token dura 15 minutos y no hay refresh: un 401 cierra la sesión.
  useEffect(() => {
    configureHttp({
      getToken: () => tokenRef.current,
      onUnauthorized: dropSession,
    });
  }, [dropSession]);

  // El storage es editable desde DevTools y desde otras pestañas: si el token
  // guardado deja de coincidir con el de memoria (o desaparece), se cierra la
  // sesión en vez de seguir operando con un token que el backend ya no avalaría.
  useEffect(() => {
    if (!session) return;

    const verify = () => {
      if (!persistedRef.current) return;
      const stored = readStoredSession();
      if (!stored || stored.accessToken !== session.accessToken || isExpired(stored)) dropSession();
    };

    const interval = window.setInterval(verify, TAMPER_CHECK_MS);
    window.addEventListener("storage", verify);
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", verify);

    const remaining = expirationTime(session) - Date.now();
    // setTimeout admite hasta ~24.8 días; el token dura 15 minutos.
    const expiry = Number.isFinite(remaining) ? window.setTimeout(dropSession, Math.max(remaining, 0)) : undefined;

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", verify);
      window.removeEventListener("focus", verify);
      document.removeEventListener("visibilitychange", verify);
      if (expiry !== undefined) window.clearTimeout(expiry);
    };
  }, [session, dropSession]);

  /**
   * El login solo devuelve el token, así que el usuario se completa con
   * GET /api/auth/me, que no depende de ningún permiso del rol. Si falla por
   * otra causa que un 401, la sesión sigue viva con los datos del token.
   */
  const hydrateUser = useCallback(async (stored: StoredSession): Promise<SessionUser> => {
    try {
      const me = await authApi.me();
      return {
        id: String(me.id),
        name: me.name,
        email: me.email,
        photoUrl: me.photoUrl ?? undefined,
        roleNames: me.roles,
        permissions: me.permissions.map(({ method, url, model }) => ({ method, url, model })),
      };
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) throw error;
      return { id: stored.userId, name: stored.email, email: stored.email, roleNames: [], permissions: [] };
    }
  }, []);

  // Rehidratación al montar.
  useEffect(() => {
    let active = true;

    // Purga de claves heredadas de versiones previas.
    try {
      for (const key of LEGACY_KEYS) {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Storage bloqueado.
    }

    const stored = readStoredSession();
    if (!stored || isExpired(stored)) {
      clearStoredSession();
      setLoading(false);
      return;
    }

    tokenRef.current = stored.accessToken;
    persistedRef.current = true;
    setSession(stored);

    hydrateUser(stored)
      .then((hydrated) => {
        if (active) setUser(hydrated);
      })
      .catch(() => {
        if (active) dropSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hydrateUser, dropSession]);

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      const response = await authApi.login({ email, password });
      const claims = decodeJwtPayload(response.accessToken);

      const stored: StoredSession = {
        accessToken: response.accessToken,
        expiresAt: response.expiresAt,
        userId: claims?.sub ?? "",
        email: claims?.email ?? email,
      };

      tokenRef.current = stored.accessToken;
      persistedRef.current = writeStoredSession(stored, remember);
      setSession(stored);
      setUser(await hydrateUser(stored));
      setLoading(false);
    },
    [hydrateUser],
  );

  const refreshUser = useCallback(async () => {
    if (!session) return;
    try {
      setUser(await hydrateUser(session));
    } catch {
      // Un 401 ya cierra la sesión desde http.ts; otro fallo conserva el usuario actual.
    }
  }, [session, hydrateUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, session, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

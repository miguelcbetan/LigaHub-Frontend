"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured, loadFirebase } from "@/lib/firebase";
import {
  OAuthFlowError,
  describeOAuthBackendError,
  requestProviderIdToken,
  type OAuthProviderId,
} from "@/lib/oauth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

const PROVIDERS: { id: OAuthProviderId; label: string; icon: ReactNode }[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "github", label: "GitHub", icon: <GitHubIcon /> },
  { id: "microsoft", label: "Microsoft", icon: <MicrosoftIcon /> },
];

/**
 * Acceso con Google, GitHub o Microsoft vía Firebase Authentication.
 * Obtiene el ID token del proveedor y lo entrega a ms-security, que verifica
 * la identidad y crea la sesión interna. Se usa tanto en login como en registro.
 */
export function OAuthButtons({
  onSuccess,
  onError,
  remember = true,
  disabled = false,
}: {
  /** Sesión creada por el backend. */
  onSuccess: () => void;
  /** Mensaje presentable; cadena vacía cuando no hay error que mostrar. */
  onError: (message: string) => void;
  remember?: boolean;
  disabled?: boolean;
}) {
  const { loginWithIdToken } = useAuth();
  const [loading, setLoading] = useState<OAuthProviderId | null>(null);

  // Precarga el SDK para que la ventana del proveedor se abra dentro del gesto del usuario.
  useEffect(() => {
    if (isFirebaseConfigured()) loadFirebase().catch(() => undefined);
  }, []);

  const handleClick = async (id: OAuthProviderId) => {
    setLoading(id);
    onError("");
    try {
      const idToken = await requestProviderIdToken(id);
      await loginWithIdToken(idToken, remember);
      onSuccess();
    } catch (error) {
      onError(error instanceof OAuthFlowError ? error.message : describeOAuthBackendError(error));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={disabled || loading !== null}
          onClick={() => handleClick(p.id)}
          aria-label={`Continuar con ${p.label}`}
          className={buttonStyles("secondary", "lg", "w-full")}
        >
          {loading === p.id ? <LoaderCircle className="size-4 animate-spin" /> : p.icon}
          <span className="hidden sm:inline">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-6 flex items-center">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      <span className="px-3 text-xs uppercase tracking-wider text-zinc-400">{children}</span>
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function AuthHeader({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      {icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-co-yellow text-zinc-950 shadow-sm [&>svg]:size-6">
          {icon}
        </span>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

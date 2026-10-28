/**
 * Inicio de sesión con proveedores externos mediante Firebase Authentication.
 *
 * El cliente solo obtiene el ID token; la identidad la verifica ms-security
 * (POST /api/auth/oauth). Tras obtener el token se cierra la sesión de
 * Firebase: la única sesión válida es la del backend.
 */
import type { AuthProvider } from "firebase/auth";
import { ApiError } from "./api/http";
import { FirebaseNotConfiguredError, loadFirebase } from "./firebase";

export type OAuthProviderId = "google" | "github" | "microsoft";

export type OAuthErrorKind = "cancelled" | "config" | "network" | "exists" | "provider";

export class OAuthFlowError extends Error {
  constructor(
    readonly kind: OAuthErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "OAuthFlowError";
  }
}

const MESSAGES = {
  cancelled: "Cancelaste la autorización. Puedes intentarlo de nuevo cuando quieras.",
  config:
    "El acceso con este proveedor aún no está configurado en la plataforma. Usa tu correo y contraseña o avisa a un administrador.",
  network: "No se pudo conectar. Revisa tu conexión a internet e inténtalo de nuevo.",
  exists:
    "Ya existe una cuenta con ese correo que usa otro método de acceso. Entra con el método con el que te registraste.",
  popupBlocked: "Tu navegador bloqueó la ventana del proveedor. Permite las ventanas emergentes e inténtalo de nuevo.",
  provider: "El proveedor no pudo completar la autenticación. Inténtalo de nuevo.",
  disabled: "Tu cuenta está deshabilitada. Contacta a un administrador.",
} as const;

/** Traduce los códigos de error de Firebase Auth a mensajes sin detalles internos. */
function fromFirebaseError(error: unknown): OAuthFlowError {
  if (error instanceof FirebaseNotConfiguredError) return new OAuthFlowError("config", MESSAGES.config);

  const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return new OAuthFlowError("cancelled", MESSAGES.cancelled);
    case "auth/popup-blocked":
      return new OAuthFlowError("provider", MESSAGES.popupBlocked);
    case "auth/account-exists-with-different-credential":
    case "auth/email-already-in-use":
      return new OAuthFlowError("exists", MESSAGES.exists);
    case "auth/network-request-failed":
      return new OAuthFlowError("network", MESSAGES.network);
    case "auth/user-disabled":
      return new OAuthFlowError("provider", MESSAGES.disabled);
    case "auth/operation-not-allowed":
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    case "auth/unauthorized-domain":
    case "auth/configuration-not-found":
    case "auth/invalid-app-credential":
    case "auth/internal-error":
      return new OAuthFlowError("config", MESSAGES.config);
    default:
      return new OAuthFlowError("provider", MESSAGES.provider);
  }
}

/** Abre la ventana del proveedor y devuelve el ID token de Firebase. */
export async function requestProviderIdToken(providerId: OAuthProviderId): Promise<string> {
  try {
    const { auth, authModule } = await loadFirebase();

    let provider: AuthProvider;
    if (providerId === "google") {
      provider = new authModule.GoogleAuthProvider();
    } else if (providerId === "github") {
      const github = new authModule.GithubAuthProvider();
      github.addScope("user:email");
      provider = github;
    } else {
      provider = new authModule.OAuthProvider("microsoft.com");
    }

    const result = await authModule.signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    await authModule.signOut(auth).catch(() => undefined);
    return idToken;
  } catch (error) {
    throw fromFirebaseError(error);
  }
}

/** Mensaje presentable para un fallo del backend en POST /api/auth/oauth. */
export function describeOAuthBackendError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return MESSAGES.network;
      case 400:
        return error.message; // p. ej. el proveedor no entregó un correo válido
      case 401:
        return "No pudimos verificar tu identidad con el proveedor. Inténtalo de nuevo.";
      case 403:
        return MESSAGES.disabled;
      case 409:
        return "Este correo ya tiene una cuenta con otro método de acceso. Entra con el método con el que te registraste (por ejemplo, correo y contraseña).";
      case 429:
        return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
      case 503:
        return "El acceso con proveedores externos no está disponible por ahora. Inténtalo más tarde.";
      default:
        return "No se pudo completar el acceso. Inténtalo de nuevo.";
    }
  }
  return "No se pudo completar el acceso. Inténtalo de nuevo.";
}

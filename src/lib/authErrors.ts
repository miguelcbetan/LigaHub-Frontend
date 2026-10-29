import { ApiError } from "./api/http";

const NETWORK = "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const TOO_MANY = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";

/**
 * Mensajes de login. El backend responde igual para correo inexistente y para
 * contraseña incorrecta, y aquí no se distingue tampoco.
 */
export function describeLoginError(error: unknown): string {
  if (!(error instanceof ApiError)) return "No se pudo iniciar sesión. Inténtalo de nuevo.";

  switch (error.status) {
    case 0:
      return NETWORK;
    case 401:
      return "Correo o contraseña incorrectos.";
    case 403:
      return "Tu cuenta está deshabilitada. Contacta a un administrador.";
    case 429:
      return TOO_MANY;
    case 503:
      return "No pudimos enviar el código de verificación. Inténtalo de nuevo en unos minutos.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

/** Mensajes de la verificación del código 2FA. */
export function describeTwoFactorError(error: unknown): string {
  if (!(error instanceof ApiError)) return "No se pudo verificar el código. Inténtalo de nuevo.";

  switch (error.status) {
    case 0:
      return NETWORK;
    case 401:
      return "El código es incorrecto o ha expirado.";
    case 403:
      return "Tu cuenta está deshabilitada. Contacta a un administrador.";
    case 429:
      return TOO_MANY;
    default:
      return "No se pudo verificar el código. Inténtalo de nuevo.";
  }
}

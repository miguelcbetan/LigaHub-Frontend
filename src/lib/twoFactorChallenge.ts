/**
 * Desafío 2FA pendiente entre /login y /verificar-2fa. Vive solo en
 * sessionStorage (pestaña actual) y NO es una sesión: no da acceso a nada.
 * El identificador no viaja en la URL.
 */
const KEY = "ligahub-2fa-challenge";

export interface PendingChallenge {
  challengeId: string;
  /** ISO-8601: vencimiento del código. */
  expiresAt: string;
  email: string;
  remember: boolean;
}

export function savePendingChallenge(challenge: PendingChallenge) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(challenge));
  } catch {
    // Sin storage no se puede continuar el 2FA; la pantalla de verificación redirige a /login.
  }
}

export function readPendingChallenge(): PendingChallenge | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingChallenge;
    return parsed?.challengeId && parsed?.expiresAt ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingChallenge() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar.
  }
}

/** ab***@dominio: suficiente para que el usuario reconozca su bandeja. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "tu correo";
  return `${local.slice(0, 2)}***@${domain}`;
}

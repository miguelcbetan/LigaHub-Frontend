/**
 * Inicialización perezosa de Firebase Authentication.
 *
 * Firebase solo se usa para el inicio de sesión con proveedores externos: el
 * ID token resultante se envía a ms-security, que lo verifica y emite la
 * sesión propia. Estas variables son la configuración PÚBLICA del cliente web
 * (no son secretos); los secretos de cada proveedor se guardan solo en la
 * consola de Firebase.
 */
import type { Auth } from "firebase/auth";

// Next solo sustituye las variables NEXT_PUBLIC_* cuando se referencian de forma literal.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

/** Falta alguna variable NEXT_PUBLIC_FIREBASE_* obligatoria. */
export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase no está configurado: faltan variables NEXT_PUBLIC_FIREBASE_*.");
    this.name = "FirebaseNotConfiguredError";
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export interface FirebaseSdk {
  auth: Auth;
  authModule: typeof import("firebase/auth");
}

let sdkPromise: Promise<FirebaseSdk> | null = null;

/** Carga Firebase bajo demanda (fuera del bundle inicial) y devuelve la instancia de Auth. */
export function loadFirebase(): Promise<FirebaseSdk> {
  if (!isFirebaseConfigured()) return Promise.reject(new FirebaseNotConfiguredError());

  sdkPromise ??= (async () => {
    const [{ getApps, initializeApp }, authModule] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    const app = getApps()[0] ?? initializeApp(config);
    return { auth: authModule.getAuth(app), authModule };
  })().catch((error) => {
    sdkPromise = null; // permite reintentar tras un fallo de red al cargar el SDK
    throw error;
  });

  return sdkPromise;
}

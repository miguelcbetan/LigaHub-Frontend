"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Protege el grupo (dashboard).
 *
 * La comprobación es en cliente porque el token vive en el storage del
 * navegador y el middleware de Next no puede leerlo.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, endReason } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || isAuthenticated) return;
    // El aviso de /login depende de cómo terminó la sesión (vencida/revocada o cierre voluntario).
    router.replace(endReason === "expired" ? "/login?expired=1" : endReason === "logout" ? "/login?logout=1" : "/login");
  }, [loading, isAuthenticated, endReason, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="size-4 animate-spin" />
          Verificando tu sesión…
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

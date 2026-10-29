"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/lib/api/auth";
import { describeError } from "@/lib/api/http";

/**
 * Activa o desactiva el segundo factor por correo del usuario autenticado
 * (PUT /api/auth/2fa-settings). Solo aplica a cuentas de correo y contraseña:
 * las cuentas con Google, GitHub o Microsoft lo gestiona el proveedor.
 */
export function TwoFactorSettings() {
  const { user, refreshUser } = useAuth();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const isLocal = user.authMethod === "LOCAL";
  const enabled = user.twoFactorEnabled;

  const toggle = async () => {
    setSaving(true);
    try {
      await authApi.setTwoFactor(!enabled);
      await refreshUser();
      notify(enabled ? "Verificación en dos pasos desactivada." : "Verificación en dos pasos activada.");
    } catch (error) {
      notify(describeError(error, "No se pudo actualizar la verificación en dos pasos."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        icon={<ShieldCheck />}
        title="Verificación en dos pasos"
        description={
          isLocal
            ? "Al iniciar sesión te enviaremos un código de 6 dígitos a tu correo."
            : "Tu cuenta entra con un proveedor externo; la verificación en dos pasos la gestiona ese proveedor."
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Estado:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {isLocal ? (enabled ? "activada" : "desactivada") : "no aplica"}
          </strong>
        </p>
        {isLocal && (
          <Button variant={enabled ? "secondary" : "primary"} loading={saving} onClick={toggle}>
            {enabled ? "Desactivar" : "Activar"}
          </Button>
        )}
      </div>
    </Card>
  );
}

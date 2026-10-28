"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Mail, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/context/AuthContext";
import { describeLoginError } from "@/lib/authErrors";
import { savePendingChallenge } from "@/lib/twoFactorChallenge";
import { AuthDivider, AuthHeader, OAuthButtons } from "./OAuthButtons";

type Notice = { tone: "info" | "success"; text: string };

/**
 * Inicio de sesión.
 * Correo y contraseña contra POST /api/auth/login (con 2FA pasa por /verificar-2fa) o proveedores
 * externos (Google, GitHub, Microsoft) vía Firebase + POST /api/auth/oauth.
 * 60%: fondo blanco/negro · 30%: inputs, bordes y botones OAuth en grises · 10%: CTA azul, enlaces y acentos tricolor.
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  // Avisos al volver de un cierre de sesión (?logout=1) o de una sesión vencida/revocada (?expired=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired")) {
      setNotice({ tone: "info", text: "Tu sesión expiró o ya no es válida. Inicia sesión de nuevo." });
    } else if (params.get("logout")) {
      setNotice({ tone: "success", text: "Cerraste sesión correctamente." });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(undefined);
    const errs: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Ingresa un correo válido.";
    if (password.length < 6) errs.password = "La contraseña debe tener al menos 6 caracteres.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), password, remember);

      if (result.status === "two_factor") {
        // Credenciales verificadas, sesión pendiente: el código llega por correo.
        savePendingChallenge({
          challengeId: result.challengeId,
          expiresAt: result.expiresAt,
          email: email.trim(),
          remember,
        });
        router.push("/verificar-2fa");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setErrors({ form: describeLoginError(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        title="¡De vuelta al estadio!"
        subtitle="Inicia sesión para gestionar usuarios, roles y permisos de tu club."
      />

      {notice && (
        <div
          role="status"
          className={
            notice.tone === "success"
              ? "mb-4 flex items-center gap-2 rounded-lg border border-co-blue/30 bg-co-blue/10 px-3 py-2.5 text-sm text-co-blue dark:border-co-yellow/30 dark:bg-co-yellow/10 dark:text-co-yellow"
              : "mb-4 flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }
        >
          <CircleCheck className="size-4 shrink-0" />
          {notice.text}
        </div>
      )}

      <OAuthButtons
        remember={remember}
        disabled={loading}
        onSuccess={() => router.push("/dashboard")}
        onError={(message) => setErrors(message ? { form: message } : {})}
      />
      <AuthDivider>o con tu correo y contraseña</AuthDivider>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
            <TriangleAlert className="size-4 shrink-0" />
            {errors.form}
          </div>
        )}
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="capitan@futbolapp.co"
          icon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAction={
            <Link href="/recuperar" className="text-xs font-medium text-co-blue hover:underline dark:text-co-yellow">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />
        <Checkbox size="sm" label="Mantener la sesión iniciada" checked={remember} onChange={() => setRemember((v) => !v)} />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {!loading && <>Saltar a la cancha <ArrowRight className="size-4" /></>}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-co-red hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </>
  );
}

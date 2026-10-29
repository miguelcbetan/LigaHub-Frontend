"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Mail, TriangleAlert, User as UserIcon } from "lucide-react";
import { PASSWORD_HINT, PASSWORD_PATTERN } from "@/lib/constants";
import { authApi } from "@/lib/api/auth";
import { describeError } from "@/lib/api/http";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Button, LinkButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { AuthDivider, AuthHeader, OAuthButtons } from "./OAuthButtons";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "terms" | "form", string>>;

/** Registro con validación visual de seguridad de contraseña. */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (name.trim().length < 3) errs.name = "Ingresa tu nombre completo.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Ingresa un correo válido.";
    // Misma regla que valida el backend (CreateUserDTO).
    if (!PASSWORD_PATTERN.test(password)) errs.password = PASSWORD_HINT;
    if (confirm !== password) errs.confirm = "Las contraseñas no coinciden.";
    if (!terms) errs.terms = "Debes aceptar el reglamento del torneo.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await authApi.register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      setDone(true);
    } catch (error) {
      setErrors({ form: describeError(error, "No se pudo crear la cuenta. Inténtalo de nuevo.") });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-co-yellow text-zinc-950">
          <CircleCheck className="size-8" />
        </span>
        <h1 className="text-2xl font-bold">¡Fichaje completado!</h1>
        {/* Verificación por correo desactivada por ahora (no hay servicio de notificaciones):
        <p className="mt-2 text-sm text-zinc-500">
          Enviamos un correo de confirmación a <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong>.
          Actívalo para entrar a la cancha.
        </p> */}
        <p className="mt-2 text-sm text-zinc-500">
          Tu cuenta <strong className="text-zinc-800 dark:text-zinc-200">{email}</strong> fue creada. Ya puedes
          iniciar sesión.
        </p>
        <LinkButton href="/login" size="lg" className="mt-8 w-full">
          Ir a iniciar sesión
        </LinkButton>
      </div>
    );
  }

  return (
    <>
      <AuthHeader title="Crea tu cuenta" subtitle="Únete al cuerpo técnico digital de tu club en menos de un minuto." />

      <OAuthButtons
        disabled={loading}
        onSuccess={() => router.push("/dashboard")}
        onError={(message) => setErrors(message ? { form: message } : {})}
      />
      <AuthDivider>o regístrate con tu correo</AuthDivider>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
            <TriangleAlert className="size-4 shrink-0" />
            {errors.form}
          </div>
        )}
        <Input
          label="Nombre completo"
          autoComplete="name"
          placeholder="Ej. Linda Caicedo"
          icon={<UserIcon />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@futbolapp.co"
          icon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="new-password"
          placeholder="Crea una contraseña segura"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordStrength password={password} />
        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <div>
          <Checkbox
            size="sm"
            label="Acepto el reglamento (términos y política de privacidad)"
            checked={terms}
            onChange={() => setTerms((v) => !v)}
          />
          {errors.terms && <p className="mt-1 text-xs text-co-red">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-co-blue hover:underline dark:text-co-yellow">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

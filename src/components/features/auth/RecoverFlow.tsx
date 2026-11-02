"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, KeyRound, Mail, MailCheck, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Button, LinkButton } from "@/components/ui/Button";
import { ApiError, describeError } from "@/lib/api/http";
import { authApi } from "@/lib/api/auth";
import { isPasswordValid } from "@/utils/password";
import { cn } from "@/utils/cn";
import { AuthHeader } from "./OAuthButtons";

type Step = "email" | "sent" | "reset" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "email", label: "Correo" },
  { id: "sent", label: "Enlace" },
  { id: "reset", label: "Nueva clave" },
];

function Stepper({ current }: { current: Step }) {
  const idx = current === "done" ? STEPS.length : STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 flex-col gap-1.5">
          <span
            className={cn(
              "h-1.5 rounded-full transition-colors",
              i < idx ? "bg-co-blue dark:bg-co-yellow" : i === idx ? "bg-co-red" : "bg-zinc-200 dark:bg-zinc-800",
            )}
          />
          <span className={cn("text-xs", i <= idx ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function isInvalidRecoveryToken(error: unknown): boolean {
  const detail = error instanceof ApiError
    ? `${error.errorCase ?? ""} ${error.message}`
    : error instanceof Error
      ? error.message
      : "";
  return /token|expir|enlace|link/i.test(detail)
    || (error instanceof ApiError && [401, 410].includes(error.status));
}

/** Recuperación de contraseña mediante los endpoints públicos de ms-security. */
export function RecoverFlow() {
  const [step, setStep] = useState<Step>("email");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [resetError, setResetError] = useState<string>();
  const [linkExpired, setLinkExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token")?.trim();
    if (urlToken) {
      setToken(urlToken);
      setStep("reset");
    }
  }, []);

  const requestRecovery = async () => {
    setEmailError(undefined);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError("Ingresa un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.requestPasswordRecovery(email.trim());
      if (!response.message?.trim()) {
        throw new Error("El servidor no devolvió el mensaje de recuperación.");
      }
      setSentMessage(response.message);
      setStep("sent");
    } catch (error) {
      setEmailError(describeError(error, "No se pudo solicitar la recuperación. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void requestRecovery();
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    setResetError(undefined);
    setLinkExpired(false);

    if (!isPasswordValid(password)) {
      setResetError("La contraseña debe tener entre 8 y 72 caracteres, incluir mayúscula, minúscula, número y uno de estos símbolos: @$!%*?&, sin espacios.");
      return;
    }
    if (password !== confirm) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setStep("done");
    } catch (error) {
      if (isInvalidRecoveryToken(error)) {
        setLinkExpired(true);
      } else {
        setResetError(describeError(error, "No se pudo restablecer la contraseña. Inténtalo de nuevo."));
      }
    } finally {
      setLoading(false);
    }
  };

  const requestAnotherLink = () => {
    setToken("");
    setPassword("");
    setConfirm("");
    setResetError(undefined);
    setLinkExpired(false);
    setEmailError(undefined);
    setStep("email");
  };

  return (
    <>
      <Stepper current={step} />

      {step === "email" && (
        <>
          <AuthHeader
            icon={<KeyRound />}
            title="¿Perdiste la contraseña?"
            subtitle="Calma: hasta los mejores fallan un penal. Te enviaremos un enlace para restablecerla."
          />
          <form onSubmit={submitEmail} className="space-y-4" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="capitan@futbolapp.co"
              icon={<Mail />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
              autoFocus
            />
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Enviar enlace de recuperación
            </Button>
          </form>
        </>
      )}

      {step === "sent" && (
        <>
          <AuthHeader
            icon={<MailCheck />}
            title="Revisa tu bandeja"
            subtitle={sentMessage}
          />
          <div className="space-y-3">
            {emailError && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
                <TriangleAlert className="size-4 shrink-0" />
                {emailError}
              </div>
            )}
            <Button size="lg" className="w-full" onClick={() => void requestRecovery()} loading={loading}>
              Reenviar correo
            </Button>
          </div>
        </>
      )}

      {step === "reset" && (
        <>
          <AuthHeader
            icon={<KeyRound />}
            title={linkExpired ? "El enlace ya no es válido" : "Ingresa tu nueva contraseña"}
            subtitle={
              linkExpired
                ? "El enlace de recuperación es inválido o expiró. Solicita uno nuevo para continuar."
                : "Elige una contraseña fuerte que no hayas usado antes."
            }
          />
          {linkExpired ? (
            <Button size="lg" className="w-full" onClick={requestAnotherLink}>
              Solicitar otro enlace
            </Button>
          ) : (
            <form onSubmit={submitReset} className="space-y-4" noValidate>
              {resetError && (
                <div role="alert" className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
                  <TriangleAlert className="size-4 shrink-0" />
                  {resetError}
                </div>
              )}
              <PasswordInput
                label="Nueva contraseña"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
              <PasswordStrength password={password} />
              <PasswordInput
                label="Confirmar nueva contraseña"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Restablecer contraseña
              </Button>
            </form>
          )}
        </>
      )}

      {step === "done" && (
        <div className="text-center">
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-co-yellow text-zinc-950">
            <CircleCheck className="size-8" />
          </span>
          <h1 className="text-2xl font-bold">¡Contraseña actualizada!</h1>
          <p className="mt-2 text-sm text-zinc-500">Ya puedes volver a la cancha con tu nueva contraseña.</p>
          <LinkButton href="/login" size="lg" className="mt-8 w-full">
            Iniciar sesión
          </LinkButton>
        </div>
      )}

      {step !== "done" && (
        <Link
          href="/login"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" /> Volver al inicio de sesión
        </Link>
      )}
    </>
  );
}

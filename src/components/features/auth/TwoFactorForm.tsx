"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { OtpInput } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { describeTwoFactorError } from "@/lib/authErrors";
import { ApiError } from "@/lib/api/http";
import {
  clearPendingChallenge,
  maskEmail,
  readPendingChallenge,
  type PendingChallenge,
} from "@/lib/twoFactorChallenge";
import { AuthHeader } from "./OAuthButtons";

/** Intentos fallidos a partir de los cuales se sugiere pedir un código nuevo (el backend permite pocos). */
const HINT_AFTER_FAILURES = 3;

const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Segundo factor: código de 6 dígitos enviado por correo.
 * El código lo valida ms-security (POST /api/auth/2fa/verify); hasta que sea correcto no existe sesión.
 */
export function TwoFactorForm() {
  const router = useRouter();
  const { completeTwoFactor } = useAuth();
  const [challenge, setChallenge] = useState<PendingChallenge | null>(null);
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [failures, setFailures] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const submitting = useRef(false);

  // Sin desafío pendiente no hay nada que verificar: se vuelve al login.
  useEffect(() => {
    const pending = readPendingChallenge();
    if (!pending) {
      router.replace("/login");
      return;
    }
    setChallenge(pending);
    setReady(true);
  }, [router]);

  // Cuenta regresiva hasta el vencimiento del código.
  useEffect(() => {
    if (!challenge) return;
    const update = () =>
      setSecondsLeft(Math.max(0, Math.floor((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  const expired = ready && secondsLeft <= 0;

  const verify = async (value: string) => {
    if (!challenge || submitting.current || expired) return;
    submitting.current = true;
    setLoading(true);
    setError(undefined);
    try {
      await completeTwoFactor(challenge.challengeId, value, challenge.remember);
      setVerified(true);
      window.setTimeout(() => router.push("/dashboard"), 700);
    } catch (e) {
      setError(describeTwoFactorError(e));
      setCode("");
      if (e instanceof ApiError && e.status === 401) setFailures((n) => n + 1);
      // Cuenta deshabilitada: el desafío ya no sirve.
      if (e instanceof ApiError && e.status === 403) clearPendingChallenge();
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    setError(undefined);
    if (value.length === 6) void verify(value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length === 6) void verify(code);
  };

  if (!ready) return null;

  return (
    <>
      <AuthHeader
        icon={verified ? <ShieldCheck /> : <MailCheck />}
        title={verified ? "¡Gol! Identidad verificada" : "Verificación en dos pasos"}
        subtitle={
          verified
            ? "Redirigiendo al camerino…"
            : `Ingresa el código de 6 dígitos que enviamos a ${maskEmail(challenge?.email ?? "")}.`
        }
      />

      {expired && !verified ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          El código expiró. Vuelve a iniciar sesión para recibir uno nuevo.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <OtpInput value={code} onChange={handleChange} error={Boolean(error)} />

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                {error}
                {failures >= HINT_AFTER_FAILURES && " Si sigues sin acertar, vuelve a iniciar sesión para recibir un código nuevo."}
              </span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={code.length < 6 || verified}>
            {verified ? "Verificado" : "Verificar código"}
          </Button>

          {!verified && (
            <p className="text-center text-sm text-zinc-500">
              El código vence en <span className="tabular-nums font-medium">{formatClock(secondsLeft)}</span>. ¿No lo
              recibiste? Revisa el spam o{" "}
              <Link href="/login" className="font-semibold text-co-blue hover:underline dark:text-co-yellow">
                inicia sesión otra vez
              </Link>{" "}
              para pedir uno nuevo.
            </p>
          )}
        </form>
      )}

      <Link
        href="/login"
        onClick={clearPendingChallenge}
        className="mt-8 flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" /> Usar otra cuenta
      </Link>
    </>
  );
}

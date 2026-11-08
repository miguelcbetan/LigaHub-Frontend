import Link from "next/link";
import { Goal, ShieldCheck, Trophy } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { TricolorBar } from "@/components/ui/TricolorBar";

/** Dibujo de líneas de cancha para el panel decorativo. */
function PitchLines() {
  return (
    <svg viewBox="0 0 400 600" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300 dark:text-zinc-800">
        <rect x="20" y="20" width="360" height="560" rx="4" />
        <line x1="20" y1="300" x2="380" y2="300" />
        <circle cx="200" cy="300" r="60" />
        <rect x="100" y="20" width="200" height="90" />
        <rect x="150" y="20" width="100" height="36" />
        <rect x="100" y="490" width="200" height="90" />
        <rect x="150" y="544" width="100" height="36" />
        <path d="M150 110 A 60 60 0 0 0 250 110" />
        <path d="M150 490 A 60 60 0 0 1 250 490" />
      </g>
      <circle cx="200" cy="300" r="5" className="fill-co-yellow" />
    </svg>
  );
}

const features = [
  { icon: ShieldCheck, text: "Roles y permisos granulares por módulo" },
  // 2FA desactivado por ahora:
  // { icon: Goal, text: "Autenticación en dos pasos para el cuerpo técnico" },
  { icon: Trophy, text: "Auditoría lista para torneos oficiales" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* 30%: panel neutro decorativo */}
      <aside className="relative hidden overflow-hidden border-r border-zinc-200 bg-zinc-50 lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950">
        <PitchLines />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
              La gestión de tu club,{" "}
              <span className="relative whitespace-nowrap">
                de local
                <span className="absolute -bottom-1 left-0 h-1.5 w-full">
                  <TricolorBar className="h-1.5 rounded-full" />
                </span>
              </span>{" "}
              y segura.
            </h2>
            <ul className="mt-8 space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white text-co-blue ring-1 ring-zinc-200 dark:bg-black dark:text-co-yellow dark:ring-zinc-800">
                    <Icon className="size-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          {/* Espaciador: mantiene el titular centrado entre el logo y el borde inferior. */}
          <div aria-hidden />
        </div>
      </aside>

      {/* 60%: fondo dominante blanco/negro con el formulario */}
      <main className="relative flex flex-col bg-white dark:bg-black">
        <TricolorBar className="lg:hidden" />
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/dashboard" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, Goal, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  ESTADO_LABEL,
  formatFechaHora,
} from "@/components/features/partidos/partido-utils";
import type { PartidoDesarrolloDTO } from "@/lib/api/business-torneos";
import { cn } from "@/utils/cn";

interface PartidoDesarrolloItemProps {
  partido: PartidoDesarrolloDTO;
  nombreJugador: (userId: number | null) => string;
}

/** Partido con su estado de resultado y sus anotaciones desplegables. */
export function PartidoDesarrolloItem({
  partido,
  nombreJugador,
}: PartidoDesarrolloItemProps) {
  const [abierto, setAbierto] = useState(false);
  const { equipo_local: local, equipo_visitante: visitante } = partido;
  const nombreEquipo = (equipoId: string) =>
    equipoId === local.id ? local.nombre : visitante.nombre;
  const muestraMarcador = partido.con_resultado || partido.estado === "EN_JUEGO";

  return (
    <li className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <span className="truncate">{local.nombre}</span>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                muestraMarcador
                  ? "bg-co-blue/10 text-co-blue dark:bg-co-yellow/15 dark:text-co-yellow"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
              )}
            >
              {muestraMarcador
                ? `${partido.goles_local} - ${partido.goles_visitante}`
                : "vs"}
            </span>
            <span className="truncate">{visitante.nombre}</span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-zinc-500">
            <span>{formatFechaHora(partido.fecha_hora)}</span>
            {partido.escenario_nombre && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {partido.escenario_nombre}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {partido.con_resultado ? (
            <Badge tone="success">Con resultado</Badge>
          ) : (
            <Badge tone={partido.estado === "CANCELADO" ? "red" : "yellow"}>
              {partido.estado === "CANCELADO"
                ? ESTADO_LABEL.CANCELADO
                : `Pendiente · ${ESTADO_LABEL[partido.estado]}`}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => setAbierto((value) => !value)}
            aria-expanded={abierto}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Goal className="size-3.5" />
            Anotaciones ({partido.anotaciones.length})
            <ChevronDown
              className={cn("size-3.5 transition-transform", abierto && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {partido.anotaciones.length === 0 ? (
            <p className="text-xs text-zinc-500">Sin anotaciones registradas.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {partido.anotaciones.map((anotacion) => (
                <li key={anotacion.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="w-10 shrink-0 font-semibold tabular-nums text-co-blue dark:text-co-yellow">
                    {anotacion.minuto}&apos;
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {nombreJugador(anotacion.jugador_user_id)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    · {nombreEquipo(anotacion.equipo_id)}
                  </span>
                  {anotacion.descripcion && (
                    <span className="text-xs italic text-zinc-500">
                      — {anotacion.descripcion}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

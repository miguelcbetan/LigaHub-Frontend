"use client";

import { useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type {
  EquipoResumenDTO,
  EtapaDesarrolloDTO,
  LlaveDTO,
} from "@/lib/api/business-torneos";
import { cn } from "@/utils/cn";
import { PartidoDesarrolloItem } from "./PartidoDesarrolloItem";

const NOMBRE_RONDA: Record<number, string> = {
  1: "Final",
  2: "Semifinales",
  4: "Cuartos de final",
  8: "Octavos de final",
};

const MODALIDAD_LABEL = {
  PARTIDO_UNICO: "Partido único",
  IDA_Y_VUELTA: "Ida y vuelta",
} as const;

interface LlavesFinalesProps {
  etapas: EtapaDesarrolloDTO[];
  nombreJugador: (userId: number | null) => string;
}

/** Fases finales a manera de llaves: una columna por ronda (etapa). */
export function LlavesFinales({ etapas, nombreJugador }: LlavesFinalesProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {etapas.map((etapa) => {
          const llaves = etapa.finales.flatMap((final) => final.llaves);
          const modalidades = [
            ...new Set(etapa.finales.map((final) => final.modalidad).filter(Boolean)),
          ] as (keyof typeof MODALIDAD_LABEL)[];
          return (
            <section
              key={etapa.numero_orden}
              aria-label={`Etapa ${etapa.numero_orden}`}
              className="flex w-80 flex-col gap-3"
            >
              <header>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {NOMBRE_RONDA[llaves.length] ?? `Etapa ${etapa.numero_orden}`}
                </h3>
                <p className="text-xs text-zinc-500">
                  Etapa {etapa.numero_orden}
                  {modalidades.length > 0 &&
                    ` · ${modalidades.map((m) => MODALIDAD_LABEL[m]).join(", ")}`}
                </p>
              </header>
              {llaves.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                  Aún no hay partidos programados.
                </p>
              ) : (
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {llaves.map((llave) => (
                    <LlaveCard
                      key={`${llave.equipo_a.id}-${llave.equipo_b.id}`}
                      llave={llave}
                      nombreJugador={nombreJugador}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LlaveCard({
  llave,
  nombreJugador,
}: {
  llave: LlaveDTO;
  nombreJugador: (userId: number | null) => string;
}) {
  const [abierta, setAbierta] = useState(false);
  const jugada = llave.partidos.some((partido) => partido.con_resultado);

  const fila = (equipo: EquipoResumenDTO, goles: number) => {
    const gana = llave.ganador_id === equipo.id;
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 text-sm",
          gana
            ? "font-semibold text-zinc-900 dark:text-zinc-50"
            : llave.ganador_id
              ? "text-zinc-400"
              : "text-zinc-800 dark:text-zinc-200",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {gana && (
            <Trophy
              aria-label="Ganador de la llave"
              className="size-3.5 shrink-0 text-co-yellow"
            />
          )}
          <span className="truncate">{equipo.nombre}</span>
        </span>
        <span className="tabular-nums">{jugada ? goles : "–"}</span>
      </div>
    );
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {fila(llave.equipo_a, llave.goles_a)}
        {fila(llave.equipo_b, llave.goles_b)}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <Badge tone={llave.ganador_id ? "success" : "yellow"}>
          {llave.ganador_id ? "Definida" : "Pendiente"}
        </Badge>
        <button
          type="button"
          onClick={() => setAbierta((value) => !value)}
          aria-expanded={abierta}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Partidos ({llave.partidos.length})
          <ChevronDown
            className={cn("size-3.5 transition-transform", abierta && "rotate-180")}
          />
        </button>
      </div>
      {abierta && (
        <ul className="space-y-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
          {llave.partidos.map((partido) => (
            <PartidoDesarrolloItem
              key={partido.id}
              partido={partido}
              nombreJugador={nombreJugador}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

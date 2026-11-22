"use client";

import { useEffect, useState } from "react";
import { Swords, TriangleAlert } from "lucide-react";
import { businessEquiposApi } from "@/lib/api/business-equipos";
import {
  businessFasesApi,
  type EstadoPartido,
  type FaseDTO,
  type PartidoFaseDTO,
} from "@/lib/api/business-fases";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface FasePartidosModalProps {
  open: boolean;
  onClose: () => void;
  fase?: FaseDTO;
  torneoNombre?: string;
  /** Con permiso para listar equipos se muestran sus nombres en vez del id. */
  canListEquipos: boolean;
}

const ESTADO_LABEL: Record<EstadoPartido, string> = {
  PROGRAMADO: "Programado",
  EN_JUEGO: "En juego",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ESTADO_TONE: Record<
  EstadoPartido,
  "yellow" | "blue" | "success" | "red"
> = {
  PROGRAMADO: "yellow",
  EN_JUEGO: "blue",
  FINALIZADO: "success",
  CANCELADO: "red",
};

const formatFecha = (value: string) =>
  new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function FasePartidosModal({
  open,
  onClose,
  fase,
  torneoNombre,
  canListEquipos,
}: FasePartidosModalProps) {
  const [partidos, setPartidos] = useState<PartidoFaseDTO[]>([]);
  const [equipos, setEquipos] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !fase) return;
    let active = true;
    setLoading(true);
    setError("");
    setPartidos([]);
    void Promise.all([
      businessFasesApi.findPartidos(fase.id),
      canListEquipos
        ? businessEquiposApi.findAll().catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([result, listaEquipos]) => {
        if (!active) return;
        setPartidos(result);
        setEquipos(new Map(listaEquipos.map(({ id, nombre }) => [id, nombre])));
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los partidos de la fase.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, fase, canListEquipos]);

  const nombreEquipo = (id: string) => equipos.get(id) ?? id;
  const limite = fase?.numero_partidos;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Swords />}
      title={fase ? `Partidos de la fase final ${fase.numero_orden}` : "Partidos"}
      description={
        torneoNombre
          ? `Torneo ${torneoNombre}${limite ? ` · ${partidos.length} de ${limite} partidos registrados` : ""}`
          : undefined
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-zinc-500">Cargando partidos…</p>}
      {!loading && !error && partidos.length === 0 && (
        <p className="text-sm text-zinc-500">
          Esta fase final aún no tiene partidos registrados.
        </p>
      )}
      {!loading && partidos.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {partidos.map((partido) => (
            <li
              key={partido.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {nombreEquipo(partido.equipo_local_id)} {partido.goles_local}{" "}
                  - {partido.goles_visitante}{" "}
                  {nombreEquipo(partido.equipo_visitante_id)}
                </p>
                <p className="text-xs text-zinc-500">
                  <time dateTime={partido.fecha_hora}>
                    {formatFecha(partido.fecha_hora)}
                  </time>
                </p>
              </div>
              <div className="flex gap-1.5">
                {partido.fase_tipo === "FINAL" && (
                  <Badge tone="blue">Fase final</Badge>
                )}
                <Badge tone={ESTADO_TONE[partido.estado]}>
                  {ESTADO_LABEL[partido.estado]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

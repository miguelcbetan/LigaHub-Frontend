"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  businessTorneosApi,
  type TorneoDTO,
  type TorneoFaseDTO,
} from "@/lib/api/business-torneos";
import { describeError } from "@/lib/api/http";

interface TorneoDetailModalProps {
  open: boolean;
  onClose: () => void;
  torneo?: TorneoDTO;
  deporteNombre: string;
  canViewFases: boolean;
}

const ESTADO_LABEL: Record<TorneoDTO["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
};

const FASE_LABEL: Record<string, string> = {
  GRUPOS: "Fase de grupos",
  FINAL: "Fase final",
};

export function TorneoDetailModal({
  open,
  onClose,
  torneo,
  deporteNombre,
  canViewFases,
}: TorneoDetailModalProps) {
  const [fases, setFases] = useState<TorneoFaseDTO[]>([]);
  const [loadingFases, setLoadingFases] = useState(false);
  const [fasesError, setFasesError] = useState("");

  useEffect(() => {
    if (!open || !torneo || !canViewFases) return;
    let active = true;
    setFases([]);
    setFasesError("");
    setLoadingFases(true);

    businessTorneosApi
      .findFases(torneo.id)
      .then((result) => {
        if (active) setFases(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setFasesError(
            describeError(caught, "No se pudieron cargar las fases del torneo."),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingFases(false);
      });

    return () => {
      active = false;
    };
  }, [open, torneo, canViewFases]);

  if (!torneo) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Eye />}
      title={`Detalle del torneo: ${torneo.nombre}`}
      description="Información general y fases asociadas al torneo."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="torneo-info">
          <h3
            id="torneo-info"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Información general
          </h3>
          <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <div className="flex items-start gap-3 py-2.5">
              <dt className="w-40 shrink-0 text-zinc-500">Descripción</dt>
              <dd className="min-w-0 flex-1 font-medium">{torneo.descripcion}</dd>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <dt className="w-40 shrink-0 text-zinc-500">Deporte</dt>
              <dd className="min-w-0 flex-1 font-medium">{deporteNombre}</dd>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <dt className="w-40 shrink-0 text-zinc-500">Estado</dt>
              <dd className="min-w-0 flex-1">
                <Badge
                  tone={
                    torneo.estado === "PENDIENTE"
                      ? "yellow"
                      : torneo.estado === "EN_CURSO"
                        ? "blue"
                        : "neutral"
                  }
                >
                  {ESTADO_LABEL[torneo.estado]}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <dt className="w-40 shrink-0 text-zinc-500">Máximo de equipos</dt>
              <dd className="min-w-0 flex-1 font-medium">{torneo.max_equipos}</dd>
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <dt className="w-40 shrink-0 text-zinc-500">Disponibilidad</dt>
              <dd className="min-w-0 flex-1">
                <Badge tone={torneo.activo ? "success" : "neutral"}>
                  {torneo.activo ? "Activo" : "Inactivo"}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="torneo-fases">
          <h3
            id="torneo-fases"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Fases
          </h3>
          {!canViewFases ? (
            <p className="text-sm text-zinc-500">
              No tienes permiso para consultar las fases de este torneo.
            </p>
          ) : loadingFases ? (
            <p className="text-sm text-zinc-500">Cargando fases…</p>
          ) : fasesError ? (
            <p role="alert" className="text-sm text-co-red">
              {fasesError}
            </p>
          ) : fases.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Este torneo aún no tiene fases registradas.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              {fases.map((fase) => (
                <li key={fase.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {FASE_LABEL[fase.tipo ?? ""] ?? fase.tipo ?? "Fase"}{" "}
                      {fase.numero_orden ?? ""}
                    </p>
                    {(fase.fecha_inicio || fase.fecha_fin) && (
                      <p className="text-xs text-zinc-500">
                        {fase.fecha_inicio ?? "Fecha pendiente"}
                        {fase.fecha_fin ? ` – ${fase.fecha_fin}` : ""}
                      </p>
                    )}
                  </div>
                  {fase.estado && (
                    <Badge tone="neutral">{fase.estado.replaceAll("_", " ")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

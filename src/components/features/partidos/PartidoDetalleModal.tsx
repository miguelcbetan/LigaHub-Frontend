"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  businessPartidosApi,
  type PartidoDTO,
} from "@/lib/api/business-partidos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ESTADO_LABEL,
  ESTADO_TONE,
  faseLabel,
  formatFechaHora,
  type PartidoCatalogos,
} from "./partido-utils";

interface PartidoDetalleModalProps {
  open: boolean;
  onClose: () => void;
  partido?: PartidoDTO;
  catalogos: PartidoCatalogos;
}

/** Información detallada del partido (GET /partidos/:id). */
export function PartidoDetalleModal({
  open,
  onClose,
  partido,
  catalogos,
}: PartidoDetalleModalProps) {
  const [detalle, setDetalle] = useState<PartidoDTO | undefined>(partido);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !partido) return;
    let active = true;
    setDetalle(partido);
    setError("");
    void businessPartidosApi
      .findOne(partido.id)
      .then((result) => {
        if (active) setDetalle(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "No se pudo cargar el detalle.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [open, partido]);

  const item = detalle ?? partido;
  if (!item) return null;
  const escenario = catalogos.escenarios.find(({ id }) => id === item.escenario_id);
  const filas: [string, React.ReactNode][] = [
    ["Torneo", catalogos.torneos.find(({ id }) => id === item.torneo_id)?.nombre ?? "—"],
    ["Fase", faseLabel(catalogos.fases.find(({ id }) => id === item.fase_id))],
    ["Fecha y hora", formatFechaHora(item.fecha_hora)],
    [
      "Escenario",
      item.escenario_nombre
        ? `${item.escenario_nombre}${escenario ? ` · ${escenario.direccion}` : ""}`
        : "Por definir",
    ],
    ["Marcador", `${item.goles_local} - ${item.goles_visitante}`],
    ["Estado", <Badge key="estado" tone={ESTADO_TONE[item.estado]}>{ESTADO_LABEL[item.estado]}</Badge>],
    ["Boletas vendidas", item.boletas?.length ?? 0],
    ["Apuestas", item.apuestas?.length ?? 0],
    ["Anotaciones", item.anotaciones?.length ?? 0],
    ["Pelota", item.pelota ? `${item.pelota.marca} ${item.pelota.modelo}` : "Sin asignar"],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Eye />}
      title={`${item.equipo_local_nombre ?? "Local"} vs ${item.equipo_visitante_nombre ?? "Visitante"}`}
      description="Información detallada del partido."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {error && (
        <p role="alert" className="mb-3 text-sm text-co-red">
          {error}
        </p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {filas.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

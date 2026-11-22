"use client";

import { Eye, Pencil, Swords, Trash2 } from "lucide-react";
import {
  ESTADOS_CERRADOS,
  type PartidoDTO,
} from "@/lib/api/business-partidos";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";
import {
  ESTADO_LABEL,
  ESTADO_TONE,
  faseLabel,
  formatFechaHora,
  type PartidoCatalogos,
} from "./partido-utils";

interface PartidosTableProps {
  partidos: PartidoDTO[];
  catalogos: PartidoCatalogos;
  canEdit: boolean;
  canDelete: boolean;
  onView: (partido: PartidoDTO) => void;
  onEdit: (partido: PartidoDTO) => void;
  onDelete: (partido: PartidoDTO) => void;
}

export function PartidosTable({
  partidos,
  catalogos,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: PartidosTableProps) {
  const torneoDe = (partido: PartidoDTO) =>
    catalogos.torneos.find(({ id }) => id === partido.torneo_id)?.nombre ?? "—";
  const faseDe = (partido: PartidoDTO) =>
    faseLabel(catalogos.fases.find(({ id }) => id === partido.fase_id));

  const columns: Column<PartidoDTO>[] = [
    {
      key: "equipos",
      header: "Partido",
      cell: (partido) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-blue-light/15 dark:text-co-blue-light">
            <Swords className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {partido.equipo_local_nombre ?? partido.equipo_local_id} vs{" "}
            {partido.equipo_visitante_nombre ?? partido.equipo_visitante_id}
          </span>
        </div>
      ),
    },
    {
      key: "fase",
      header: "Torneo / fase",
      hideOnMobile: true,
      cell: (partido) => (
        <div className="text-sm">
          <div className="text-zinc-900 dark:text-zinc-100">{torneoDe(partido)}</div>
          <div className="text-zinc-500">{faseDe(partido)}</div>
        </div>
      ),
    },
    {
      key: "fecha_hora",
      header: "Fecha",
      cell: (partido) => (
        <time dateTime={partido.fecha_hora}>{formatFechaHora(partido.fecha_hora)}</time>
      ),
    },
    {
      key: "escenario",
      header: "Escenario",
      hideOnMobile: true,
      cell: (partido) =>
        partido.escenario_nombre ?? <span className="text-zinc-500">Por definir</span>,
    },
    {
      key: "marcador",
      header: "Marcador",
      cell: (partido) => (
        <span className="font-semibold tabular-nums">
          {partido.goles_local} - {partido.goles_visitante}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (partido) => (
        <Badge tone={ESTADO_TONE[partido.estado]}>{ESTADO_LABEL[partido.estado]}</Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "text-right",
      cell: (partido) => (
        <div className="flex justify-end gap-0.5">
          <IconButton label="Ver detalle del partido" tone="blue" onClick={() => onView(partido)}>
            <Eye />
          </IconButton>
          {canEdit && !ESTADOS_CERRADOS.includes(partido.estado) && (
            <IconButton label="Editar partido" tone="blue" onClick={() => onEdit(partido)}>
              <Pencil />
            </IconButton>
          )}
          {canDelete && (
            <IconButton label="Eliminar partido" tone="red" onClick={() => onDelete(partido)}>
              <Trash2 />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={partidos}
      rowKey={(partido) => partido.id}
      emptyTitle="Aún no hay partidos registrados"
      emptyDescription="Registra un partido en una fase del torneo para empezar."
    />
  );
}

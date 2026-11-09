"use client";

import { Pencil, Trash2, Trophy } from "lucide-react";
import type { TorneoDTO } from "@/lib/api/business-torneos";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface TorneosTableProps {
  torneos: TorneoDTO[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (torneo: TorneoDTO) => void;
  onDelete: (torneo: TorneoDTO) => void;
}

const STATE_LABEL: Record<TorneoDTO["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
};

const STATE_TONE: Record<TorneoDTO["estado"], "yellow" | "blue" | "neutral"> = {
  PENDIENTE: "yellow",
  EN_CURSO: "blue",
  FINALIZADO: "neutral",
};

export function TorneosTable({
  torneos,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TorneosTableProps) {
  const columns: Column<TorneoDTO>[] = [
    {
      key: "nombre",
      header: "Torneo",
      cell: (torneo) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-yellow/20 text-zinc-900 dark:bg-co-yellow/15 dark:text-co-yellow">
            <Trophy className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {torneo.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-sm",
      cell: (torneo) => (
        <p className="line-clamp-2 text-zinc-600 dark:text-zinc-400">
          {torneo.descripcion}
        </p>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (torneo) => (
        <Badge tone={STATE_TONE[torneo.estado]}>
          {STATE_LABEL[torneo.estado]}
        </Badge>
      ),
    },
    {
      key: "max_equipos",
      header: "Equipos",
      hideOnMobile: true,
      cell: (torneo) => <span>{torneo.max_equipos}</span>,
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (torneo) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar torneo"
                    tone="blue"
                    onClick={() => onEdit(torneo)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar torneo"
                    tone="red"
                    onClick={() => onDelete(torneo)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<TorneoDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={torneos}
      rowKey={(torneo) => torneo.id}
      emptyTitle="Aún no hay torneos"
      emptyDescription="Crea un torneo para empezar a gestionar la competencia."
    />
  );
}

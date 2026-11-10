"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { EscenarioTorneoDTO } from "@/lib/api/business-escenarios-torneo";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface EscenariosTorneoTableProps {
  escenariosTorneo: EscenarioTorneoDTO[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (escenarioTorneo: EscenarioTorneoDTO) => void;
  onDelete: (escenarioTorneo: EscenarioTorneoDTO) => void;
}

const STATE_LABEL: Record<EscenarioTorneoDTO["estado"], string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

const STATE_TONE: Record<EscenarioTorneoDTO["estado"], "success" | "neutral"> =
  {
    ACTIVO: "success",
    INACTIVO: "neutral",
  };

export function EscenariosTorneoTable({
  escenariosTorneo,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: EscenariosTorneoTableProps) {
  const columns: Column<EscenarioTorneoDTO>[] = [
    {
      key: "escenario_id",
      header: "Escenario",
      cell: (escenarioTorneo) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-blue-light/15 dark:text-co-blue-light">
            <MapPin className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {escenarioTorneo.escenario_id}
          </span>
        </div>
      ),
    },
    {
      key: "torneo_id",
      header: "Torneo (UUID)",
      hideOnMobile: true,
      cell: (escenarioTorneo) => (
        <span className="text-zinc-600 dark:text-zinc-400">
          {escenarioTorneo.torneo_id}
        </span>
      ),
    },
    {
      key: "fecha_asignacion",
      header: "Fecha",
      cell: (escenarioTorneo) => (
        <time dateTime={escenarioTorneo.fecha_asignacion}>
          {escenarioTorneo.fecha_asignacion}
        </time>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (escenarioTorneo) => (
        <Badge tone={STATE_TONE[escenarioTorneo.estado]}>
          {STATE_LABEL[escenarioTorneo.estado]}
        </Badge>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (escenarioTorneo) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar escenario de torneo"
                    tone="blue"
                    onClick={() => onEdit(escenarioTorneo)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar escenario de torneo"
                    tone="red"
                    onClick={() => onDelete(escenarioTorneo)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<EscenarioTorneoDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={escenariosTorneo}
      rowKey={(escenarioTorneo) => escenarioTorneo.id}
      emptyTitle="Aún no hay escenarios asignados"
      emptyDescription="Asigna un escenario a un torneo para empezar."
    />
  );
}

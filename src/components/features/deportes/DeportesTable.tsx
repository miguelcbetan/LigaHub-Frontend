"use client";

import { Dumbbell, Pencil, Trash2 } from "lucide-react";
import type { DeporteDTO } from "@/lib/api/business-deportes";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface DeportesTableProps {
  deportes: DeporteDTO[];
  nombres: Map<string, string>;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (deporte: DeporteDTO) => void;
  onDelete: (deporte: DeporteDTO) => void;
}

export function DeportesTable({
  deportes,
  nombres,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: DeportesTableProps) {
  const columns: Column<DeporteDTO>[] = [
    {
      key: "nombre",
      header: "Deporte",
      cell: (deporte) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-yellow/20 text-zinc-900 dark:bg-co-yellow/15 dark:text-co-yellow">
            <Dumbbell className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {deporte.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-sm",
      cell: (deporte) => (
        <p className="line-clamp-2 text-zinc-600 dark:text-zinc-400">
          {deporte.descripcion}
        </p>
      ),
    },
    {
      key: "deporte_padre",
      header: "Deporte padre",
      hideOnMobile: true,
      cell: (deporte) => (
        <span>
          {deporte.deporte_padre_id
            ? (nombres.get(deporte.deporte_padre_id) ?? deporte.deporte_padre_id)
            : "—"}
        </span>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (deporte) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar deporte"
                    tone="blue"
                    onClick={() => onEdit(deporte)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar deporte"
                    tone="red"
                    onClick={() => onDelete(deporte)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<DeporteDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={deportes}
      rowKey={(deporte) => deporte.id}
      emptyTitle="Aún no hay deportes"
      emptyDescription="Registra un deporte para poder asociarlo a los torneos."
    />
  );
}

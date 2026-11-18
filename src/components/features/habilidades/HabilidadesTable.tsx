"use client";

import { Eye, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { HabilidadDTO } from "@/lib/api/business-habilidades";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface HabilidadesTableProps {
  habilidades: HabilidadDTO[];
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (habilidad: HabilidadDTO) => void;
  onEdit: (habilidad: HabilidadDTO) => void;
  onDelete: (habilidad: HabilidadDTO) => void;
}

export function HabilidadesTable({
  habilidades,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: HabilidadesTableProps) {
  const columns: Column<HabilidadDTO>[] = [
    {
      key: "nombre",
      header: "Habilidad",
      cell: (habilidad) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-yellow/20 text-zinc-900 dark:bg-co-yellow/15 dark:text-co-yellow">
            <Sparkles className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {habilidad.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-sm",
      cell: (habilidad) => (
        <p className="line-clamp-2 text-zinc-600 dark:text-zinc-400">
          {habilidad.descripcion}
        </p>
      ),
    },
    ...(canView || canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (habilidad) => (
              <div className="flex justify-end gap-0.5">
                {canView && (
                  <IconButton label="Ver detalle de la habilidad" onClick={() => onView(habilidad)}>
                    <Eye />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton label="Editar habilidad" tone="blue" onClick={() => onEdit(habilidad)}>
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton label="Eliminar habilidad" tone="red" onClick={() => onDelete(habilidad)}>
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<HabilidadDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={habilidades}
      rowKey={(habilidad) => habilidad.id}
      emptyTitle="Aún no hay habilidades"
      emptyDescription="Registra una habilidad para poder asignarla a los jugadores."
    />
  );
}

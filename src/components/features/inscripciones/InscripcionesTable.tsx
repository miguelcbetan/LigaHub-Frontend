"use client";

import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import type { InscripcionDTO } from "@/lib/api/business-inscripciones";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface InscripcionesTableProps {
  inscripciones: InscripcionDTO[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (inscripcion: InscripcionDTO) => void;
  onDelete: (inscripcion: InscripcionDTO) => void;
}

const STATE_LABEL: Record<InscripcionDTO["estado"], string> = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

const STATE_TONE: Record<
  InscripcionDTO["estado"],
  "yellow" | "success" | "red"
> = {
  PENDIENTE: "yellow",
  ACEPTADA: "success",
  RECHAZADA: "red",
};

export function InscripcionesTable({
  inscripciones,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: InscripcionesTableProps) {
  const columns: Column<InscripcionDTO>[] = [
    {
      key: "equipo_id",
      header: "Equipo",
      cell: (inscripcion) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-blue-light/15 dark:text-co-blue-light">
            <ClipboardList className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {inscripcion.equipo_id}
          </span>
        </div>
      ),
    },
    {
      key: "torneo_id",
      header: "Torneo (UUID)",
      hideOnMobile: true,
      cell: (inscripcion) => (
        <span className="text-zinc-600 dark:text-zinc-400">
          {inscripcion.torneo_id}
        </span>
      ),
    },
    {
      key: "fecha_inscripcion",
      header: "Fecha",
      cell: (inscripcion) => (
        <time dateTime={inscripcion.fecha_inscripcion}>
          {inscripcion.fecha_inscripcion}
        </time>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (inscripcion) => (
        <Badge tone={STATE_TONE[inscripcion.estado]}>
          {STATE_LABEL[inscripcion.estado]}
        </Badge>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (inscripcion) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar inscripción"
                    tone="blue"
                    onClick={() => onEdit(inscripcion)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar inscripción"
                    tone="red"
                    onClick={() => onDelete(inscripcion)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<InscripcionDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={inscripciones}
      rowKey={(inscripcion) => inscripcion.id}
      emptyTitle="Aún no hay inscripciones"
      emptyDescription="Crea una inscripción para empezar a gestionar los equipos participantes."
    />
  );
}

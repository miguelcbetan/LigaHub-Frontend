"use client";

import { Medal, Pencil, Trash2 } from "lucide-react";
import type { FaseFinalDTO } from "@/lib/api/business-fases-finales";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface FasesFinalesTableProps {
  fasesFinales: FaseFinalDTO[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (faseFinal: FaseFinalDTO) => void;
  onDelete: (faseFinal: FaseFinalDTO) => void;
}

const STATE_LABEL: Record<FaseFinalDTO["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
};

const STATE_TONE: Record<
  FaseFinalDTO["estado"],
  "yellow" | "blue" | "success"
> = {
  PENDIENTE: "yellow",
  EN_CURSO: "blue",
  FINALIZADA: "success",
};

const MODALIDAD_LABEL: Record<FaseFinalDTO["modalidad"], string> = {
  PARTIDO_UNICO: "Partido único",
  IDA_Y_VUELTA: "Ida y vuelta",
};

export function FasesFinalesTable({
  fasesFinales,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: FasesFinalesTableProps) {
  const columns: Column<FaseFinalDTO>[] = [
    {
      key: "numero_orden",
      header: "Orden",
      cell: (faseFinal) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-blue-light/15 dark:text-co-blue-light">
            <Medal className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Fase {faseFinal.numero_orden}
          </span>
        </div>
      ),
    },
    {
      key: "torneo_id",
      header: "Torneo (UUID)",
      hideOnMobile: true,
      cell: (faseFinal) => (
        <span className="text-zinc-600 dark:text-zinc-400">
          {faseFinal.torneo_id}
        </span>
      ),
    },
    {
      key: "fechas",
      header: "Fechas",
      cell: (faseFinal) => (
        <span>
          <time dateTime={faseFinal.fecha_inicio}>{faseFinal.fecha_inicio}</time>
          {" → "}
          <time dateTime={faseFinal.fecha_fin}>{faseFinal.fecha_fin}</time>
        </span>
      ),
    },
    {
      key: "modalidad",
      header: "Modalidad",
      hideOnMobile: true,
      cell: (faseFinal) => (
        <span>
          {MODALIDAD_LABEL[faseFinal.modalidad]} · {faseFinal.numero_partidos}{" "}
          {faseFinal.numero_partidos === 1 ? "partido" : "partidos"}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (faseFinal) => (
        <Badge tone={STATE_TONE[faseFinal.estado]}>
          {STATE_LABEL[faseFinal.estado]}
        </Badge>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (faseFinal) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar fase final"
                    tone="blue"
                    onClick={() => onEdit(faseFinal)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar fase final"
                    tone="red"
                    onClick={() => onDelete(faseFinal)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<FaseFinalDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={fasesFinales}
      rowKey={(faseFinal) => faseFinal.id}
      emptyTitle="Aún no hay fases finales"
      emptyDescription="Crea una fase final para un torneo para empezar."
    />
  );
}

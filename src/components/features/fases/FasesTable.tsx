"use client";

import { Medal, Pencil, Trash2 } from "lucide-react";
import type { FaseDTO } from "@/lib/api/business-fases";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface FasesTableProps {
  fases: FaseDTO[];
  torneos: Map<string, string>;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (fase: FaseDTO) => void;
  onDelete: (fase: FaseDTO) => void;
}

const TIPO_LABEL: Record<FaseDTO["tipo"], string> = {
  GRUPOS: "Grupo",
  FINAL: "Fase final",
};

const ESTADO_LABEL: Record<FaseDTO["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
};

const ESTADO_TONE: Record<FaseDTO["estado"], "yellow" | "blue" | "success"> = {
  PENDIENTE: "yellow",
  EN_CURSO: "blue",
  FINALIZADA: "success",
};

const MODALIDAD_LABEL = {
  PARTIDO_UNICO: "Partido único",
  IDA_Y_VUELTA: "Ida y vuelta",
} as const;

export function FasesTable({
  fases,
  torneos,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: FasesTableProps) {
  const columns: Column<FaseDTO>[] = [
    {
      key: "tipo",
      header: "Tipo",
      cell: (fase) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-blue-light/15 dark:text-co-blue-light">
            <Medal className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {fase.tipo === "GRUPOS" && fase.nombre
              ? fase.nombre
              : TIPO_LABEL[fase.tipo]}
          </span>
        </div>
      ),
    },
    {
      key: "numero_orden",
      header: "Orden",
      cell: (fase) => <span>Fase {fase.numero_orden}</span>,
    },
    {
      key: "torneo_id",
      header: "Torneo",
      hideOnMobile: true,
      cell: (fase) => (
        <span>{torneos.get(fase.torneo_id) ?? fase.torneo_id}</span>
      ),
    },
    {
      key: "fechas",
      header: "Fechas",
      cell: (fase) => (
        <span className="whitespace-nowrap">
          <time dateTime={fase.fecha_inicio}>{fase.fecha_inicio}</time>
          {" → "}
          <time dateTime={fase.fecha_fin}>{fase.fecha_fin}</time>
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (fase) => (
        <Badge tone={ESTADO_TONE[fase.estado]}>{ESTADO_LABEL[fase.estado]}</Badge>
      ),
    },
    {
      key: "configuracion",
      header: "Configuración",
      hideOnMobile: true,
      cell: (fase) =>
        fase.tipo === "FINAL" && fase.modalidad ? (
          <span>
            {MODALIDAD_LABEL[fase.modalidad]}
            {fase.numero_partidos
              ? ` · ${fase.numero_partidos} ${fase.numero_partidos === 1 ? "partido" : "partidos"}`
              : ""}
          </span>
        ) : fase.tipo === "GRUPOS" && fase.cupo_equipos ? (
          <span>Cupo: {fase.cupo_equipos} equipos</span>
        ) : (
          <span className="text-zinc-500">—</span>
        ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (fase) => (
              <div className="flex justify-end gap-0.5">
                {canEdit && (
                  <IconButton
                    label="Editar fase"
                    tone="blue"
                    onClick={() => onEdit(fase)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar fase"
                    tone="red"
                    onClick={() => onDelete(fase)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<FaseDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={fases}
      rowKey={(fase) => fase.id}
      emptyTitle="Aún no hay fases"
      emptyDescription="Crea una fase para organizar las etapas del torneo."
    />
  );
}

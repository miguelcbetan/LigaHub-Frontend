"use client";

import { Building2, Eye, Pencil, Trash2 } from "lucide-react";
import type { EscenarioDTO } from "@/lib/api/business-escenarios";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";
import { nombreDelPadre } from "./escenario-utils";

interface EscenariosTableProps {
  escenarios: EscenarioDTO[];
  /** Catálogo completo, para mostrar el nombre del escenario padre aunque esté filtrado. */
  todos: EscenarioDTO[];
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (escenario: EscenarioDTO) => void;
  onEdit: (escenario: EscenarioDTO) => void;
  onDelete: (escenario: EscenarioDTO) => void;
}

export function EscenariosTable({
  escenarios,
  todos,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: EscenariosTableProps) {
  const columns: Column<EscenarioDTO>[] = [
    {
      key: "nombre",
      header: "Escenario",
      cell: (escenario) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-blue/10 text-co-blue dark:bg-co-yellow/15 dark:text-co-yellow">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{escenario.nombre}</div>
            <div className="truncate text-xs text-zinc-500">{escenario.direccion}</div>
          </div>
        </div>
      ),
    },
    {
      key: "capacidad",
      header: "Capacidad",
      cell: (escenario) => (
        <span className="tabular-nums">{escenario.capacidad.toLocaleString("es-CO")}</span>
      ),
    },
    {
      key: "padre",
      header: "Escenario padre",
      cell: (escenario) =>
        nombreDelPadre(todos, escenario.escenario_padre_id) ?? (
          <span className="text-zinc-400">—</span>
        ),
    },
    {
      key: "localidades",
      header: "Localidades",
      cell: (escenario) => (
        <span className="tabular-nums">{escenario.localidades?.length ?? 0}</span>
      ),
    },
    ...(canView || canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (escenario) => (
              <div className="flex justify-end gap-0.5">
                {canView && (
                  <IconButton label="Ver detalle del escenario" onClick={() => onView(escenario)}>
                    <Eye />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton label="Editar escenario" tone="blue" onClick={() => onEdit(escenario)}>
                    <Pencil />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton label="Eliminar escenario" tone="red" onClick={() => onDelete(escenario)}>
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<EscenarioDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={escenarios}
      rowKey={(escenario) => escenario.id}
      emptyTitle="Aún no hay escenarios"
      emptyDescription="Registra un escenario para asociarlo a partidos y definir sus localidades."
    />
  );
}

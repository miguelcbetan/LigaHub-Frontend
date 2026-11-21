"use client";

import {
  Eye,
  LayoutGrid,
  Pencil,
  Power,
  PowerOff,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import type { EquipoDTO } from "@/lib/api/business-equipos";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface EquiposTableProps {
  equipos: EquipoDTO[];
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewPlantilla: boolean;
  onView: (equipo: EquipoDTO) => void;
  onViewPlantilla: (equipo: EquipoDTO) => void;
  onEdit: (equipo: EquipoDTO) => void;
  onAsignarGrupo: (equipo: EquipoDTO) => void;
  onToggleActivo: (equipo: EquipoDTO) => void;
  onDelete: (equipo: EquipoDTO) => void;
}

export function EquiposTable({
  equipos,
  canView,
  canEdit,
  canDelete,
  canViewPlantilla,
  onView,
  onViewPlantilla,
  onEdit,
  onAsignarGrupo,
  onToggleActivo,
  onDelete,
}: EquiposTableProps) {
  const columns: Column<EquipoDTO>[] = [
    {
      key: "nombre",
      header: "Equipo",
      cell: (equipo) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-yellow/20 text-zinc-900 dark:bg-co-yellow/15 dark:text-co-yellow">
            <Shield className="size-4" />
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {equipo.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      cell: (equipo) => (
        <Badge tone={equipo.activo ? "success" : "neutral"}>
          {equipo.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    ...(canView || canViewPlantilla || canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (equipo) => (
              <div className="flex justify-end gap-0.5">
                {canView && (
                  <IconButton label="Ver detalle del equipo" onClick={() => onView(equipo)}>
                    <Eye />
                  </IconButton>
                )}
                {canViewPlantilla && (
                  <IconButton
                    label="Plantilla del equipo"
                    tone="blue"
                    onClick={() => onViewPlantilla(equipo)}
                  >
                    <Users />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton
                    label="Editar equipo"
                    tone="blue"
                    onClick={() => onEdit(equipo)}
                  >
                    <Pencil />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton
                    label="Asignar grupo"
                    tone="blue"
                    onClick={() => onAsignarGrupo(equipo)}
                  >
                    <LayoutGrid />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton
                    label={equipo.activo ? "Desactivar equipo" : "Activar equipo"}
                    onClick={() => onToggleActivo(equipo)}
                  >
                    {equipo.activo ? <PowerOff /> : <Power />}
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton
                    label="Eliminar equipo"
                    tone="red"
                    onClick={() => onDelete(equipo)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<EquipoDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={equipos}
      rowKey={(equipo) => equipo.id}
      emptyTitle="Aún no hay equipos"
      emptyDescription="Registra un equipo para que pueda participar en las competencias."
    />
  );
}

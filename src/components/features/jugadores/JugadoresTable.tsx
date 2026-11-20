"use client";

import { ContactRound, Eye, Pencil, Power, PowerOff, Trash2, UserRound } from "lucide-react";
import type { UserResponseDTO } from "@/lib/api/types";
import { edadDesde, type JugadorDTO } from "@/lib/api/business-jugadores";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";

interface JugadoresTableProps {
  jugadores: JugadorDTO[];
  usuarios: Map<number, UserResponseDTO>;
  canView: boolean;
  canViewProfile: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (jugador: JugadorDTO) => void;
  onViewProfile: (jugador: JugadorDTO) => void;
  onEdit: (jugador: JugadorDTO) => void;
  onToggleActivo: (jugador: JugadorDTO) => void;
  onDelete: (jugador: JugadorDTO) => void;
}

export function JugadoresTable({
  jugadores,
  usuarios,
  canView,
  canViewProfile,
  canEdit,
  canDelete,
  onView,
  onViewProfile,
  onEdit,
  onToggleActivo,
  onDelete,
}: JugadoresTableProps) {
  const columns: Column<JugadorDTO>[] = [
    {
      key: "usuario",
      header: "Jugador",
      cell: (jugador) => {
        const usuario = usuarios.get(jugador.user_id);
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-co-yellow/20 text-zinc-900 dark:bg-co-yellow/15 dark:text-co-yellow">
              <UserRound className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {usuario?.name ?? `Usuario #${jugador.user_id}`}
              </p>
              <p className="max-w-[12rem] truncate text-xs text-zinc-500">
                {usuario?.email ?? "Usuario no encontrado"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "nacionalidad",
      header: "Nacionalidad",
      className: "hidden xl:table-cell",
      cell: (jugador) => <span>{jugador.nacionalidad}</span>,
    },
    {
      key: "fecha_nacimiento",
      header: "Nacimiento",
      hideOnMobile: true,
      cell: (jugador) => (
        <span className="whitespace-nowrap">
          {jugador.fecha_nacimiento}
          <span className="block text-xs text-zinc-500">
            {edadDesde(jugador.fecha_nacimiento)} años
          </span>
        </span>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      cell: (jugador) => (
        <Badge tone={jugador.activo ? "success" : "neutral"}>
          {jugador.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    ...(canView || canViewProfile || canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Acciones</span>,
            className: "text-right",
            cell: (jugador) => (
              <div className="flex justify-end gap-0.5">
                {canView && (
                  <IconButton label="Ver detalle del jugador" onClick={() => onView(jugador)}>
                    <Eye />
                  </IconButton>
                )}
                {canViewProfile && (
                  <IconButton
                    label="Consultar perfil deportivo"
                    onClick={() => onViewProfile(jugador)}
                  >
                    <ContactRound />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton label="Editar jugador" tone="blue" onClick={() => onEdit(jugador)}>
                    <Pencil />
                  </IconButton>
                )}
                {canEdit && (
                  <IconButton
                    label={jugador.activo ? "Desactivar jugador" : "Activar jugador"}
                    onClick={() => onToggleActivo(jugador)}
                  >
                    {jugador.activo ? <PowerOff /> : <Power />}
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton label="Eliminar jugador" tone="red" onClick={() => onDelete(jugador)}>
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            ),
          } satisfies Column<JugadorDTO>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={jugadores}
      rowKey={(jugador) => jugador.id}
      emptyTitle="Aún no hay jugadores"
      emptyDescription="Registra un jugador a partir de un usuario de la plataforma."
    />
  );
}

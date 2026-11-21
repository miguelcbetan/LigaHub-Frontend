"use client";

import { Eye, Pencil, Power, Trash, UserCog } from "lucide-react";
import type { Role, User } from "@/types";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { formatDate } from "@/utils/format";

interface UsersTableProps {
  users: User[];
  roles: Role[];
  actions: {
    view: boolean;
    manage: boolean;
    edit: boolean;
    toggleStatus: boolean;
    delete: boolean;
  };
  onView: (user: User) => void;
  /** Lleva a la gestión del perfil y los roles del usuario. */
  onManage: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({
  users,
  roles,
  actions,
  onView,
  onManage,
  onEdit,
  onToggleStatus,
  onDelete,
}: UsersTableProps) {
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const hasActions = Object.values(actions).some(Boolean);
  const actionColumn: Column<User> = {
    key: "actions",
    header: <span className="sr-only">Acciones</span>,
    className: "text-right",
    cell: (u) => (
      <div className="flex justify-end gap-0.5">
        {actions.view && (
          <IconButton label="Ver detalle" onClick={() => onView(u)}>
            <Eye />
          </IconButton>
        )}
        {actions.manage && (
          <IconButton label="Perfil y roles" onClick={() => onManage(u)}>
            <UserCog />
          </IconButton>
        )}
        {actions.edit && (
          <IconButton label="Editar" tone="blue" onClick={() => onEdit(u)}>
            <Pencil />
          </IconButton>
        )}
        {actions.toggleStatus && (
          <IconButton
            label={u.status === "activo" ? "Desactivar" : "Activar"}
            tone={u.status === "activo" ? "red" : "blue"}
            onClick={() => onToggleStatus(u)}
          >
            <Power />
          </IconButton>
        )}
        {actions.delete && (
          <IconButton label="Eliminar" tone="red" onClick={() => onDelete(u)}>
            <Trash />
          </IconButton>
        )}
      </div>
    ),
  };

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
            <p className="truncate text-xs text-zinc-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (u) =>
        u.roleIds.length ? (
          <div className="flex flex-wrap gap-1">
            {u.roleIds.map((id) => (
              <Badge key={id} tone="blue">
                {roleName(id)}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge tone="neutral">Sin rol · banca</Badge>
        ),
    },
    { key: "phone", header: "Teléfono", hideOnMobile: true, cell: (u) => <span className="text-zinc-600 dark:text-zinc-400">{u.phone}</span> },
    {
      key: "status",
      header: "Estado",
      cell: (u) =>
        u.status === "activo" ? <Badge tone="success">En cancha</Badge> : <Badge tone="red">Inactivo</Badge>,
    },
    {
      key: "created",
      header: "Fichaje",
      hideOnMobile: true,
      cell: (u) => <span className="text-zinc-500">{formatDate(u.createdAt)}</span>,
    },
    ...(hasActions ? [actionColumn] : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey={(u) => u.id}
      emptyTitle="Ningún jugador en la convocatoria"
      emptyDescription="Prueba con otra búsqueda o cambia el filtro."
    />
  );
}

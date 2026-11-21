"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, KeyRound, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { OPERATION_LABEL } from "@/lib/constants";
import { useAccess } from "@/lib/access";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserDetailCard } from "@/components/features/users/UserDetailCard";
import { UserFormModal } from "@/components/features/users/UserFormModal";

export default function UsuarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { users, roles, modules, permissions, rolePermissions, updateUser, loading } = useData();
  const { notify } = useToast();
  const access = useAccess();
  const canView =
    access.hasPermission("/api/users/{id}", "GET") ||
    access.hasPermission("/api/users/{id}/profile", "GET") ||
    access.hasPermission("/api/users/{id}/detail-with-roles", "GET");
  const canEdit = access.hasPermission("/api/users/{id}", "PUT");
  const form = useDisclosure();

  const user = users.find((u) => u.id === id);

  // Permisos efectivos = unión de los permisos de todos sus roles, agrupados por módulo.
  const effective = useMemo(() => {
    if (!user) return [];
    const ids = new Set(user.roleIds.flatMap((r) => rolePermissions[r] ?? []));
    return modules
      .map((m) => ({
        module: m,
        ops: [...new Set(permissions.filter((p) => p.moduleId === m.id && ids.has(p.id)).map((p) => p.operation))],
      }))
      .filter((x) => x.ops.length > 0);
  }, [user, modules, permissions, rolePermissions]);

  if (!canView) {
    return (
      <EmptyState
        title="Acceso no disponible"
        description="Tu rol solo puede consultar el listado de usuarios."
        action={
          <LinkButton href="/usuarios" variant="secondary">
            Volver al listado
          </LinkButton>
        }
      />
    );
  }

  if (!user) {
    return loading ? (
      <EmptyState title="Cargando usuario…" description="Consultando los datos en el servidor." />
    ) : (
      <EmptyState
        title="Usuario no encontrado"
        description="Puede que haya sido eliminado de la plantilla."
        action={
          <LinkButton href="/usuarios" variant="secondary">
            Volver al listado
          </LinkButton>
        }
      />
    );
  }

  return (
    <>
      <Link
        href="/usuarios"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" /> Volver a usuarios
      </Link>
      <PageHeader
        title="Detalle de usuario"
        description="Ficha técnica completa del integrante."
        actions={canEdit ? (
          <Button leftIcon={<Pencil className="size-4" />} onClick={() => form.open()}>
            Editar perfil y roles
          </Button>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <UserDetailCard user={user} roles={roles} />
        </div>
        <Card className="lg:col-span-3">
          <CardHeader
            icon={<KeyRound />}
            title="Permisos efectivos"
            description="Heredados de los roles asignados."
          />
          {effective.length === 0 ? (
            <EmptyState title="Sin permisos" description="Asigna un rol para habilitar módulos." />
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {effective.map(({ module, ops }) => (
                <li key={module.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium">{module.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {ops.map((op) => (
                      <Badge key={op} tone={op === "eliminar" ? "red" : "blue"}>
                        {OPERATION_LABEL[op]}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {canEdit && (
        <UserFormModal
          open={form.isOpen}
          onClose={form.close}
          user={user}
          roles={roles}
          onSubmit={async (input) => {
            await updateUser(user.id, input);
            notify("Ficha actualizada.");
          }}
        />
      )}
    </>
  );
}

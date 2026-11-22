"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EquipoDetailModal } from "@/components/features/equipos/EquipoDetailModal";
import { EquipoFormModal } from "@/components/features/equipos/EquipoFormModal";
import { EquipoGrupoModal } from "@/components/features/equipos/EquipoGrupoModal";
import { EquipoPlantillaModal } from "@/components/features/equipos/EquipoPlantillaModal";
import { EquiposTable } from "@/components/features/equipos/EquiposTable";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { useAccess } from "@/lib/access";

export default function EquiposPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/equipos", "POST");
  const canView = access.hasPermission("/equipos/{id}", "GET");
  const canEdit = access.hasPermission("/equipos/{id}", "PATCH");
  const canDelete = access.hasPermission("/equipos/{id}", "DELETE");
  const canAddDeporte = access.hasPermission("/equipos-deportes", "POST");
  const canRemoveDeporte = access.hasPermission("/equipos-deportes/{id}", "DELETE");
  const canViewPlantilla = access.hasPermission("/equipo-jugador", "GET");
  const canAsignarJugador = access.hasPermission("/equipo-jugador", "POST");
  const canRetirarJugador = access.hasPermission("/equipo-jugador/{id}/retiro", "PATCH");
  const canViewAficionados = access.hasPermission("/equipos/{id}/aficionados", "GET");
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<EquipoDTO>();
  const detail = useDisclosure<EquipoDTO>();
  const plantilla = useDisclosure<EquipoDTO>();
  const grupo = useDisclosure<EquipoDTO>();
  const confirmDelete = useDisclosure<EquipoDTO>();
  const { notify } = useToast();

  const loadEquipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEquipos(await businessEquiposApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudieron cargar los equipos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEquipos();
  }, [loadEquipos]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return equipos.filter(
      (equipo) =>
        !normalizedQuery || equipo.nombre.toLowerCase().includes(normalizedQuery),
    );
  }, [equipos, query]);

  const replaceEquipo = (updated: EquipoDTO) =>
    setEquipos((current) =>
      current.map((equipo) => (equipo.id === updated.id ? updated : equipo)),
    );

  const toggleActivo = async (equipo: EquipoDTO) => {
    try {
      const updated = await businessEquiposApi.update(equipo.id, {
        activo: !equipo.activo,
      });
      replaceEquipo(updated);
      notify(
        `Equipo “${updated.nombre}” ${updated.activo ? "activado" : "desactivado"}.`,
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "No se pudo cambiar el estado del equipo.",
        "error",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de equipos"
        description="Registra, consulta, actualiza, desactiva y elimina los equipos de la plataforma."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadEquipos()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => form.open()}>
                Nuevo equipo
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-co-red/30 bg-co-red/10 px-4 py-3 text-sm text-co-red"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader
          icon={<Shield />}
          title="Equipos registrados"
          description={
            loading
              ? "Cargando equipos…"
              : `${filtered.length} de ${equipos.length} equipos`
          }
          action={
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar equipo" />
          }
        />
        <EquiposTable
          equipos={filtered}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewPlantilla={canViewPlantilla}
          onView={(equipo) => detail.open(equipo)}
          onViewPlantilla={(equipo) => plantilla.open(equipo)}
          onEdit={(equipo) => form.open(equipo)}
          onAsignarGrupo={(equipo) => grupo.open(equipo)}
          onToggleActivo={(equipo) => void toggleActivo(equipo)}
          onDelete={(equipo) => confirmDelete.open(equipo)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <EquipoFormModal
          open={form.isOpen}
          onClose={form.close}
          equipo={form.payload}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessEquiposApi.update(form.payload.id, input);
              replaceEquipo(updated);
              notify(`Equipo “${updated.nombre}” actualizado.`);
            } else {
              const created = await businessEquiposApi.create(input);
              setEquipos((current) => [created, ...current]);
              notify(`Equipo “${created.nombre}” registrado.`);
            }
          }}
        />
      )}

      {canEdit && (
        <EquipoGrupoModal
          open={grupo.isOpen}
          onClose={grupo.close}
          equipo={grupo.payload}
          onSubmit={async (faseGruposId) => {
            if (!grupo.payload) return;
            const updated = await businessEquiposApi.update(grupo.payload.id, {
              fase_grupos_id: faseGruposId,
            });
            replaceEquipo(updated);
            notify(
              faseGruposId
                ? `Equipo “${updated.nombre}” asignado al grupo.`
                : `Equipo “${updated.nombre}” quedó sin grupo.`,
            );
          }}
        />
      )}

      {canView && (
        <EquipoDetailModal
          open={detail.isOpen}
          onClose={detail.close}
          equipo={detail.payload}
          canAddDeporte={canAddDeporte}
          canRemoveDeporte={canRemoveDeporte}
          canViewAficionados={canViewAficionados}
        />
      )}

      {canViewPlantilla && (
        <EquipoPlantillaModal
          open={plantilla.isOpen}
          onClose={plantilla.close}
          equipo={plantilla.payload}
          canAsignar={canAsignarJugador}
          canRetirar={canRetirarJugador}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar equipo"
          confirmLabel="Eliminar equipo"
          message={
            <>
              ¿Seguro que deseas eliminar <strong>{confirmDelete.payload?.nombre}</strong>?
              Esta acción no se puede deshacer. Si el equipo tiene jugadores,
              inscripciones, partidos, aficionados o deportes asociados no se
              eliminará; desactívalo en su lugar.
            </>
          }
          onConfirm={async () => {
            const equipo = confirmDelete.payload;
            if (!equipo) return;
            try {
              await businessEquiposApi.remove(equipo.id);
              setEquipos((current) => current.filter((item) => item.id !== equipo.id));
              notify(`Equipo “${equipo.nombre}” eliminado.`, "error");
            } catch (caught) {
              notify(
                caught instanceof Error ? caught.message : "No se pudo eliminar el equipo.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

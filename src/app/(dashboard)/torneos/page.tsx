"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { TorneoDetailModal } from "@/components/features/torneos/TorneoDetailModal";
import { TorneoFormModal } from "@/components/features/torneos/TorneoFormModal";
import { TorneosTable } from "@/components/features/torneos/TorneosTable";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessDeportesApi, type DeporteDTO } from "@/lib/api/business-deportes";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

export default function TorneosPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/torneos", "POST");
  const canView = access.hasPermission("/torneos/{id}", "GET");
  const canViewFases = access.hasPermission("/torneos/{id}/fases", "GET");
  const canEdit = access.hasPermission("/torneos/{id}", "PATCH");
  const canDelete = access.hasPermission("/torneos/{id}", "DELETE");
  const canListDeportes = access.hasPermission("/deportes", "GET");
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [deportes, setDeportes] = useState<DeporteDTO[]>([]);
  const [loadingDeportes, setLoadingDeportes] = useState(false);
  const [deportesError, setDeportesError] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<TorneoDTO>();
  const detail = useDisclosure<TorneoDTO>();
  const confirmDelete = useDisclosure<TorneoDTO>();
  const { notify } = useToast();

  const loadTorneos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTorneos(await businessTorneosApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar los torneos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTorneos();
  }, [loadTorneos]);

  useEffect(() => {
    if (!canListDeportes) {
      setDeportesError("No tienes permiso para consultar los deportes.");
      return;
    }
    let active = true;
    setLoadingDeportes(true);
    setDeportesError("");
    businessDeportesApi
      .findAll()
      .then((result) => {
        if (active) setDeportes(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setDeportesError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los deportes.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingDeportes(false);
      });
    return () => {
      active = false;
    };
  }, [canListDeportes]);

  const deporteNombres = useMemo(
    () => new Map(deportes.map(({ id, nombre }) => [id, nombre])),
    [deportes],
  );

  const replaceTorneo = (updated: TorneoDTO) =>
    setTorneos((current) =>
      current.map((torneo) => (torneo.id === updated.id ? updated : torneo)),
    );

  const toggleActivo = async (torneo: TorneoDTO) => {
    try {
      const updated = await businessTorneosApi.update(torneo.id, {
        activo: !torneo.activo,
      });
      replaceTorneo(updated);
      notify(
        `Torneo “${updated.nombre}” ${updated.activo ? "activado" : "desactivado"}.`,
      );
    } catch (caught) {
      notify(
        caught instanceof Error
          ? caught.message
          : "No se pudo cambiar el estado del torneo.",
        "error",
      );
    }
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return torneos.filter(
      (torneo) =>
        !normalizedQuery ||
        torneo.nombre.toLowerCase().includes(normalizedQuery) ||
        torneo.descripcion.toLowerCase().includes(normalizedQuery),
    );
  }, [torneos, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de torneos"
        description="Crea, consulta, actualiza, desactiva y elimina torneos de la plataforma."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadTorneos()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Nuevo torneo
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
          icon={<Trophy />}
          title="Torneos registrados"
          description={
            loading
              ? "Cargando torneos…"
              : `${filtered.length} de ${torneos.length} torneos`
          }
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar torneo"
            />
          }
        />
        <TorneosTable
          torneos={filtered}
          deportes={deporteNombres}
          canView={canView || canViewFases}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={(torneo) => detail.open(torneo)}
          onEdit={(torneo) => form.open(torneo)}
          onToggleActivo={(torneo) => void toggleActivo(torneo)}
          onDelete={(torneo) => confirmDelete.open(torneo)}
        />
      </Card>

      {(canView || canViewFases) && (
        <TorneoDetailModal
          open={detail.isOpen}
          onClose={detail.close}
          torneo={detail.payload}
          deporteNombre={
            detail.payload
              ? deporteNombres.get(detail.payload.deporte_id) ??
                detail.payload.deporte_id
              : ""
          }
          canViewFases={canViewFases}
        />
      )}

      {(canCreate || canEdit) && (
        <TorneoFormModal
          open={form.isOpen}
          onClose={form.close}
          torneo={form.payload}
          deportes={deportes}
          loadingDeportes={loadingDeportes}
          deportesError={deportesError}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessTorneosApi.update(
                form.payload.id,
                input,
              );
              replaceTorneo(updated);
              notify(`Torneo “${updated.nombre}” actualizado.`);
            } else {
              const created = await businessTorneosApi.create(input);
              setTorneos((current) => [created, ...current]);
              notify(`Torneo “${created.nombre}” creado.`);
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar torneo"
          confirmLabel="Eliminar torneo"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>{confirmDelete.payload?.nombre}</strong>? Esta acción no
              se puede deshacer. Si el torneo tiene fases, partidos,
              inscripciones o escenarios asignados no se eliminará; desactívalo
              en su lugar.
            </>
          }
          onConfirm={async () => {
            const torneo = confirmDelete.payload;
            if (!torneo) return;
            try {
              await businessTorneosApi.remove(torneo.id);
              setTorneos((current) =>
                current.filter((item) => item.id !== torneo.id),
              );
              notify(`Torneo “${torneo.nombre}” eliminado.`, "error");
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar el torneo.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

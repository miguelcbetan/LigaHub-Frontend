"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DeporteEquiposModal } from "@/components/features/deportes/DeporteEquiposModal";
import { DeporteFormModal } from "@/components/features/deportes/DeporteFormModal";
import { DeportesTable } from "@/components/features/deportes/DeportesTable";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessDeportesApi, type DeporteDTO } from "@/lib/api/business-deportes";
import { useAccess } from "@/lib/access";

export default function DeportesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/deportes", "POST");
  const canEdit = access.hasPermission("/deportes/{id}", "PATCH");
  const canDelete = access.hasPermission("/deportes/{id}", "DELETE");
  const canViewEquipos =
    access.hasPermission("/equipos-deportes", "GET") &&
    access.hasPermission("/equipos", "GET");
  const [deportes, setDeportes] = useState<DeporteDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<DeporteDTO>();
  const equiposDelDeporte = useDisclosure<DeporteDTO>();
  const confirmDelete = useDisclosure<DeporteDTO>();
  const { notify } = useToast();

  const loadDeportes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDeportes(await businessDeportesApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar los deportes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeportes();
  }, [loadDeportes]);

  const nombres = useMemo(
    () => new Map(deportes.map(({ id, nombre }) => [id, nombre])),
    [deportes],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return deportes.filter(
      (deporte) =>
        !normalizedQuery ||
        deporte.nombre.toLowerCase().includes(normalizedQuery) ||
        deporte.descripcion.toLowerCase().includes(normalizedQuery),
    );
  }, [deportes, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de deportes"
        description="Registra y administra los deportes que se asocian a los torneos."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadDeportes()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Nuevo deporte
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
          icon={<Dumbbell />}
          title="Deportes registrados"
          description={
            loading
              ? "Cargando deportes…"
              : `${filtered.length} de ${deportes.length} deportes`
          }
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar deporte"
            />
          }
        />
        <DeportesTable
          deportes={filtered}
          nombres={nombres}
          canViewEquipos={canViewEquipos}
          canEdit={canEdit}
          canDelete={canDelete}
          onViewEquipos={(deporte) => equiposDelDeporte.open(deporte)}
          onEdit={(deporte) => form.open(deporte)}
          onDelete={(deporte) => confirmDelete.open(deporte)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <DeporteFormModal
          open={form.isOpen}
          onClose={form.close}
          deporte={form.payload}
          deportes={deportes}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessDeportesApi.update(
                form.payload.id,
                input,
              );
              setDeportes((current) =>
                current.map((deporte) =>
                  deporte.id === updated.id ? updated : deporte,
                ),
              );
              notify(`Deporte “${updated.nombre}” actualizado.`);
            } else {
              const created = await businessDeportesApi.create(input);
              setDeportes((current) => [created, ...current]);
              notify(`Deporte “${created.nombre}” creado.`);
            }
          }}
        />
      )}

      {canViewEquipos && (
        <DeporteEquiposModal
          open={equiposDelDeporte.isOpen}
          onClose={equiposDelDeporte.close}
          deporte={equiposDelDeporte.payload}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar deporte"
          confirmLabel="Eliminar deporte"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>{confirmDelete.payload?.nombre}</strong>? Esta acción no
              se puede deshacer. Si el deporte tiene torneos, equipos o
              subdeportes asociados no se eliminará.
            </>
          }
          onConfirm={async () => {
            const deporte = confirmDelete.payload;
            if (!deporte) return;
            try {
              await businessDeportesApi.remove(deporte.id);
              setDeportes((current) =>
                current.filter((item) => item.id !== deporte.id),
              );
              notify(`Deporte “${deporte.nombre}” eliminado.`, "error");
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar el deporte.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

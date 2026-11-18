"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { HabilidadDetailModal } from "@/components/features/habilidades/HabilidadDetailModal";
import { HabilidadFormModal } from "@/components/features/habilidades/HabilidadFormModal";
import { HabilidadesTable } from "@/components/features/habilidades/HabilidadesTable";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessHabilidadesApi, type HabilidadDTO } from "@/lib/api/business-habilidades";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

const porNombre = (a: HabilidadDTO, b: HabilidadDTO) => a.nombre.localeCompare(b.nombre, "es");

function mensajeAlEliminar(caught: unknown): string {
  if (caught instanceof BusinessApiError && caught.status === 409) {
    return "La habilidad está asignada a jugadores y no se puede eliminar.";
  }
  return caught instanceof Error ? caught.message : "No se pudo eliminar la habilidad.";
}

export default function HabilidadesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/habilidades", "POST");
  const canView = access.hasPermission("/habilidades/{id}", "GET");
  const canEdit = access.hasPermission("/habilidades/{id}", "PATCH");
  const canDelete = access.hasPermission("/habilidades/{id}", "DELETE");
  const canViewJugadores =
    access.hasPermission("/habilidad-jugador", "GET") &&
    access.hasPermission("/jugadores", "GET");
  const [habilidades, setHabilidades] = useState<HabilidadDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<HabilidadDTO>();
  const detail = useDisclosure<HabilidadDTO>();
  const confirmDelete = useDisclosure<HabilidadDTO>();
  const { notify } = useToast();

  const loadHabilidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHabilidades(await businessHabilidadesApi.findAll());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar las habilidades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHabilidades();
  }, [loadHabilidades]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return habilidades.filter(
      (habilidad) =>
        !normalizedQuery ||
        habilidad.nombre.toLowerCase().includes(normalizedQuery) ||
        habilidad.descripcion.toLowerCase().includes(normalizedQuery),
    );
  }, [habilidades, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de habilidades"
        description="Registra y administra el catálogo de capacidades que se asignan a los jugadores."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadHabilidades()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => form.open()}>
                Nueva habilidad
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
          icon={<Sparkles />}
          title="Habilidades registradas"
          description={
            loading
              ? "Cargando habilidades…"
              : `${filtered.length} de ${habilidades.length} habilidades`
          }
          action={
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar habilidad" />
          }
        />
        <HabilidadesTable
          habilidades={filtered}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={(habilidad) => detail.open(habilidad)}
          onEdit={(habilidad) => form.open(habilidad)}
          onDelete={(habilidad) => confirmDelete.open(habilidad)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <HabilidadFormModal
          open={form.isOpen}
          onClose={form.close}
          habilidad={form.payload}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessHabilidadesApi.update(form.payload.id, input);
              setHabilidades((current) =>
                current
                  .map((habilidad) => (habilidad.id === updated.id ? updated : habilidad))
                  .sort(porNombre),
              );
              notify(`Habilidad “${updated.nombre}” actualizada.`);
            } else {
              const created = await businessHabilidadesApi.create(input);
              setHabilidades((current) => [...current, created].sort(porNombre));
              notify(`Habilidad “${created.nombre}” creada.`);
            }
          }}
        />
      )}

      {canView && (
        <HabilidadDetailModal
          open={detail.isOpen}
          onClose={detail.close}
          habilidad={detail.payload}
          canViewJugadores={canViewJugadores}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar habilidad"
          confirmLabel="Eliminar habilidad"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>{confirmDelete.payload?.nombre}</strong>? Esta acción no se puede deshacer.
              Si la habilidad está asignada a jugadores no se eliminará.
            </>
          }
          onConfirm={async () => {
            const habilidad = confirmDelete.payload;
            if (!habilidad) return;
            try {
              await businessHabilidadesApi.remove(habilidad.id);
              setHabilidades((current) => current.filter((item) => item.id !== habilidad.id));
              notify(`Habilidad “${habilidad.nombre}” eliminada.`, "error");
            } catch (caught) {
              notify(mensajeAlEliminar(caught), "error");
            }
          }}
        />
      )}
    </>
  );
}

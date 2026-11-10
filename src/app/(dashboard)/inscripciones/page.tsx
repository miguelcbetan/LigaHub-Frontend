"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import { InscripcionFormModal } from "@/components/features/inscripciones/InscripcionFormModal";
import { InscripcionesTable } from "@/components/features/inscripciones/InscripcionesTable";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  businessInscripcionesApi,
  type InscripcionDTO,
} from "@/lib/api/business-inscripciones";
import { useAccess } from "@/lib/access";

export default function InscripcionesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/inscripciones", "POST");
  const canEdit = access.hasPermission("/inscripciones/{id}", "PATCH");
  const canDelete = access.hasPermission("/inscripciones/{id}", "DELETE");
  const [inscripciones, setInscripciones] = useState<InscripcionDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<InscripcionDTO>();
  const confirmDelete = useDisclosure<InscripcionDTO>();
  const { notify } = useToast();

  const loadInscripciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInscripciones(await businessInscripcionesApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las inscripciones.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInscripciones();
  }, [loadInscripciones]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return inscripciones.filter(
      (inscripcion) =>
        !normalizedQuery ||
        inscripcion.equipo_id.toLowerCase().includes(normalizedQuery) ||
        inscripcion.torneo_id.toLowerCase().includes(normalizedQuery) ||
        inscripcion.fecha_inscripcion.includes(normalizedQuery) ||
        inscripcion.estado.toLowerCase().includes(normalizedQuery),
    );
  }, [inscripciones, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de inscripciones"
        description="Crea, consulta, actualiza y elimina inscripciones de equipos a torneos."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadInscripciones()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Nueva inscripción
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
          icon={<ClipboardList />}
          title="Inscripciones registradas"
          description={
            loading
              ? "Cargando inscripciones…"
              : `${filtered.length} de ${inscripciones.length} inscripciones`
          }
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar inscripción"
            />
          }
        />
        <InscripcionesTable
          inscripciones={filtered}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(inscripcion) => form.open(inscripcion)}
          onDelete={(inscripcion) => confirmDelete.open(inscripcion)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <InscripcionFormModal
          open={form.isOpen}
          onClose={form.close}
          inscripcion={form.payload}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessInscripcionesApi.update(
                form.payload.id,
                input,
              );
              setInscripciones((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
              notify(`Inscripción de equipo “${updated.equipo_id}” actualizada.`);
            } else {
              const created = await businessInscripcionesApi.create(input);
              setInscripciones((current) => [created, ...current]);
              notify(`Inscripción de equipo “${created.equipo_id}” creada.`);
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar inscripción"
          confirmLabel="Eliminar inscripción"
          message={
            <>
              ¿Seguro que deseas eliminar la inscripción del equipo{" "}
              <strong>{confirmDelete.payload?.equipo_id}</strong>? Esta acción
              no se puede deshacer.
            </>
          }
          onConfirm={async () => {
            const inscripcion = confirmDelete.payload;
            if (!inscripcion) return;
            try {
              await businessInscripcionesApi.remove(inscripcion.id);
              setInscripciones((current) =>
                current.filter((item) => item.id !== inscripcion.id),
              );
              notify(
                `Inscripción de equipo “${inscripcion.equipo_id}” eliminada.`,
                "error",
              );
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar la inscripción.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

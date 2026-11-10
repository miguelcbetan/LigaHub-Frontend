"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Medal, Plus, RefreshCw } from "lucide-react";
import { FaseFinalFormModal } from "@/components/features/fases-finales/FaseFinalFormModal";
import { FasesFinalesTable } from "@/components/features/fases-finales/FasesFinalesTable";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  businessFasesFinalesApi,
  type FaseFinalDTO,
} from "@/lib/api/business-fases-finales";
import { useAccess } from "@/lib/access";

export default function FasesFinalesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/fases", "POST");
  const canEdit = access.hasPermission("/fases/{id}", "PATCH");
  const canDelete = access.hasPermission("/fases/{id}", "DELETE");
  const [fasesFinales, setFasesFinales] = useState<FaseFinalDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<FaseFinalDTO>();
  const confirmDelete = useDisclosure<FaseFinalDTO>();
  const { notify } = useToast();

  const loadFasesFinales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFasesFinales(await businessFasesFinalesApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las fases finales.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFasesFinales();
  }, [loadFasesFinales]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return fasesFinales.filter(
      (faseFinal) =>
        !normalizedQuery ||
        faseFinal.torneo_id.toLowerCase().includes(normalizedQuery) ||
        String(faseFinal.numero_orden).includes(normalizedQuery) ||
        faseFinal.fecha_inicio.includes(normalizedQuery) ||
        faseFinal.fecha_fin.includes(normalizedQuery) ||
        faseFinal.estado.toLowerCase().includes(normalizedQuery) ||
        faseFinal.modalidad.toLowerCase().includes(normalizedQuery),
    );
  }, [fasesFinales, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de fases finales"
        description="Crea, consulta, actualiza y elimina las fases finales de los torneos."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadFasesFinales()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Nueva fase final
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
          icon={<Medal />}
          title="Fases finales registradas"
          description={
            loading
              ? "Cargando fases finales…"
              : `${filtered.length} de ${fasesFinales.length} fases finales`
          }
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar fase final"
            />
          }
        />
        <FasesFinalesTable
          fasesFinales={filtered}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(faseFinal) => form.open(faseFinal)}
          onDelete={(faseFinal) => confirmDelete.open(faseFinal)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <FaseFinalFormModal
          open={form.isOpen}
          onClose={form.close}
          faseFinal={form.payload}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessFasesFinalesApi.update(
                form.payload.id,
                input,
              );
              setFasesFinales((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
              notify(`Fase final ${updated.numero_orden} actualizada.`);
            } else {
              const created = await businessFasesFinalesApi.create(input);
              setFasesFinales((current) => [created, ...current]);
              notify(`Fase final ${created.numero_orden} creada.`);
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar fase final"
          confirmLabel="Eliminar fase final"
          message={
            <>
              ¿Seguro que deseas eliminar la fase final{" "}
              <strong>{confirmDelete.payload?.numero_orden}</strong> del torneo{" "}
              <strong>{confirmDelete.payload?.torneo_id}</strong>? Esta acción
              no se puede deshacer.
            </>
          }
          onConfirm={async () => {
            const faseFinal = confirmDelete.payload;
            if (!faseFinal) return;
            try {
              await businessFasesFinalesApi.remove(faseFinal.id);
              setFasesFinales((current) =>
                current.filter((item) => item.id !== faseFinal.id),
              );
              notify(
                `Fase final ${faseFinal.numero_orden} eliminada.`,
                "error",
              );
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar la fase final.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

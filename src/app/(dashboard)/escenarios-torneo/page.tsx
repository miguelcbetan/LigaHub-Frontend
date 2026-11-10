"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Plus, RefreshCw } from "lucide-react";
import { EscenarioTorneoFormModal } from "@/components/features/escenarios-torneo/EscenarioTorneoFormModal";
import { EscenariosTorneoTable } from "@/components/features/escenarios-torneo/EscenariosTorneoTable";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  businessEscenariosTorneoApi,
  type EscenarioTorneoDTO,
} from "@/lib/api/business-escenarios-torneo";
import { useAccess } from "@/lib/access";

export default function EscenariosTorneoPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/escenarios-torneo", "POST");
  const canEdit = access.hasPermission("/escenarios-torneo/{id}", "PATCH");
  const canDelete = access.hasPermission("/escenarios-torneo/{id}", "DELETE");
  const [escenariosTorneo, setEscenariosTorneo] = useState<
    EscenarioTorneoDTO[]
  >([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<EscenarioTorneoDTO>();
  const confirmDelete = useDisclosure<EscenarioTorneoDTO>();
  const { notify } = useToast();

  const loadEscenariosTorneo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEscenariosTorneo(await businessEscenariosTorneoApi.findAll());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar los escenarios de torneo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEscenariosTorneo();
  }, [loadEscenariosTorneo]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return escenariosTorneo.filter(
      (escenarioTorneo) =>
        !normalizedQuery ||
        escenarioTorneo.escenario_id.toLowerCase().includes(normalizedQuery) ||
        escenarioTorneo.torneo_id.toLowerCase().includes(normalizedQuery) ||
        escenarioTorneo.fecha_asignacion.includes(normalizedQuery) ||
        escenarioTorneo.estado.toLowerCase().includes(normalizedQuery),
    );
  }, [escenariosTorneo, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de escenarios de torneo"
        description="Asigna, consulta, actualiza y elimina los escenarios donde se juega cada torneo."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadEscenariosTorneo()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Asignar escenario
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
          icon={<MapPin />}
          title="Escenarios asignados"
          description={
            loading
              ? "Cargando escenarios de torneo…"
              : `${filtered.length} de ${escenariosTorneo.length} asignaciones`
          }
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar asignación"
            />
          }
        />
        <EscenariosTorneoTable
          escenariosTorneo={filtered}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(escenarioTorneo) => form.open(escenarioTorneo)}
          onDelete={(escenarioTorneo) => confirmDelete.open(escenarioTorneo)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <EscenarioTorneoFormModal
          open={form.isOpen}
          onClose={form.close}
          escenarioTorneo={form.payload}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessEscenariosTorneoApi.update(
                form.payload.id,
                input,
              );
              setEscenariosTorneo((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
              notify(
                `Asignación del escenario “${updated.escenario_id}” actualizada.`,
              );
            } else {
              const created = await businessEscenariosTorneoApi.create(input);
              setEscenariosTorneo((current) => [created, ...current]);
              notify(`Escenario “${created.escenario_id}” asignado.`);
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar escenario de torneo"
          confirmLabel="Eliminar asignación"
          message={
            <>
              ¿Seguro que deseas eliminar la asignación del escenario{" "}
              <strong>{confirmDelete.payload?.escenario_id}</strong>? Esta
              acción no se puede deshacer.
            </>
          }
          onConfirm={async () => {
            const escenarioTorneo = confirmDelete.payload;
            if (!escenarioTorneo) return;
            try {
              await businessEscenariosTorneoApi.remove(escenarioTorneo.id);
              setEscenariosTorneo((current) =>
                current.filter((item) => item.id !== escenarioTorneo.id),
              );
              notify(
                `Asignación del escenario “${escenarioTorneo.escenario_id}” eliminada.`,
                "error",
              );
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar la asignación del escenario.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

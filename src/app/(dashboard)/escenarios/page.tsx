"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EscenarioDetailModal } from "@/components/features/escenarios/EscenarioDetailModal";
import { EscenarioFormModal } from "@/components/features/escenarios/EscenarioFormModal";
import { EscenariosTable } from "@/components/features/escenarios/EscenariosTable";
import { mensajeDeError, porNombre } from "@/components/features/escenarios/escenario-utils";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import { businessEscenariosApi, type EscenarioDTO } from "@/lib/api/business-escenarios";
import { useAccess } from "@/lib/access";

export default function EscenariosPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/escenarios", "POST");
  const canView = access.hasPermission("/escenarios/{id}", "GET");
  const canEdit = access.hasPermission("/escenarios/{id}", "PATCH");
  const canDelete = access.hasPermission("/escenarios/{id}", "DELETE");
  const permisosLocalidades = useMemo(
    () => ({
      canCreate: access.hasPermission("/localidades", "POST"),
      canEdit: access.hasPermission("/localidades/{id}", "PATCH"),
      canDelete: access.hasPermission("/localidades/{id}", "DELETE"),
    }),
    [access],
  );
  const [escenarios, setEscenarios] = useState<EscenarioDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useDisclosure<EscenarioDTO>();
  const detail = useDisclosure<EscenarioDTO>();
  const confirmDelete = useDisclosure<EscenarioDTO>();
  const { notify } = useToast();

  const loadEscenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEscenarios((await businessEscenariosApi.findAll()).sort(porNombre));
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudieron cargar los escenarios."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEscenarios();
  }, [loadEscenarios]);

  const replace = useCallback((updated: EscenarioDTO) => {
    setEscenarios((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)).sort(porNombre),
    );
  }, []);

  const closeDetail = detail.close;
  const handleNotFound = useCallback(() => {
    closeDetail();
    notify("El escenario ya no existe. Se actualizó el listado.", "error");
    void loadEscenarios();
  }, [closeDetail, notify, loadEscenarios]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return escenarios.filter(
      (escenario) =>
        !normalizedQuery ||
        escenario.nombre.toLowerCase().includes(normalizedQuery) ||
        escenario.direccion.toLowerCase().includes(normalizedQuery),
    );
  }, [escenarios, query]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de escenarios"
        description="Registra los escenarios donde se juegan los partidos y define sus localidades."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadEscenarios()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button leftIcon={<Plus className="size-4" />} onClick={() => form.open()}>
                Nuevo escenario
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
          icon={<Building2 />}
          title="Escenarios registrados"
          description={
            loading
              ? "Cargando escenarios…"
              : `${filtered.length} de ${escenarios.length} escenarios`
          }
          action={
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o dirección" />
          }
        />
        <EscenariosTable
          escenarios={filtered}
          todos={escenarios}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={(escenario) => detail.open(escenario)}
          onEdit={(escenario) => form.open(escenario)}
          onDelete={(escenario) => confirmDelete.open(escenario)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <EscenarioFormModal
          open={form.isOpen}
          onClose={form.close}
          escenario={form.payload}
          escenarios={escenarios}
          onSubmit={async (input) => {
            if (form.payload) {
              const updated = await businessEscenariosApi.update(form.payload.id, input);
              replace(updated);
              notify(`Escenario “${updated.nombre}” actualizado.`);
            } else {
              const created = await businessEscenariosApi.create(input);
              setEscenarios((current) => [...current, created].sort(porNombre));
              notify(`Escenario “${created.nombre}” creado.`);
            }
          }}
        />
      )}

      {canView && (
        <EscenarioDetailModal
          open={detail.isOpen}
          onClose={detail.close}
          escenario={detail.payload}
          escenarios={escenarios}
          localidades={permisosLocalidades}
          onEscenarioChange={replace}
          onNotFound={handleNotFound}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar escenario"
          confirmLabel="Eliminar escenario"
          message={
            <>
              ¿Seguro que deseas eliminar <strong>{confirmDelete.payload?.nombre}</strong>? También
              se eliminarán sus localidades. No se eliminará si tiene subescenarios, asignaciones a
              torneos, partidos o boletas vendidas.
            </>
          }
          onConfirm={async () => {
            const escenario = confirmDelete.payload;
            if (!escenario) return;
            try {
              await businessEscenariosApi.remove(escenario.id);
              setEscenarios((current) => current.filter((item) => item.id !== escenario.id));
              notify(`Escenario “${escenario.nombre}” eliminado.`, "error");
            } catch (caught) {
              notify(mensajeDeError(caught, "No se pudo eliminar el escenario."), "error");
            }
          }}
        />
      )}
    </>
  );
}

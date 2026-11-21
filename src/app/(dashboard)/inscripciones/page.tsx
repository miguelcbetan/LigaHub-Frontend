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
import { Select } from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  businessInscripcionesApi,
  type InscripcionDTO,
} from "@/lib/api/business-inscripciones";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

export default function InscripcionesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/inscripciones", "POST");
  const canListInscripciones = access.hasPermission("/inscripciones", "GET");
  const canEdit = access.hasPermission("/inscripciones/{id}", "PATCH");
  const canDelete = access.hasPermission("/inscripciones/{id}", "DELETE");
  const canListTorneos = access.hasPermission("/torneos", "GET");
  const canListEquipos = access.hasPermission("/equipos", "GET");
  const canListRelaciones = access.hasPermission("/equipos-deportes", "GET");
  const [inscripciones, setInscripciones] = useState<InscripcionDTO[]>([]);
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [filterTorneoId, setFilterTorneoId] = useState("");
  const [filterEquipoId, setFilterEquipoId] = useState("");
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
      setInscripciones(
        await businessInscripcionesApi.findAll({
          torneo_id: filterTorneoId || undefined,
          equipo_id: filterEquipoId || undefined,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las inscripciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterTorneoId, filterEquipoId]);

  useEffect(() => {
    void loadInscripciones();
  }, [loadInscripciones]);

  useEffect(() => {
    let active = true;
    const requests: Promise<void>[] = [];
    setLookupError("");

    if (canListTorneos) {
      requests.push(
        businessTorneosApi.findAll().then(
          (result) => {
            if (active) setTorneos(result);
          },
          (caught: unknown) => {
            if (active) {
              setLookupError((current) =>
                [current, caught instanceof Error ? caught.message : "No se pudieron cargar los torneos."]
                  .filter(Boolean)
                  .join(" "),
              );
            }
          },
        ),
      );
    }

    if (canListEquipos) {
      requests.push(
        businessEquiposApi.findAll().then(
          (result) => {
            if (active) setEquipos(result);
          },
          (caught: unknown) => {
            if (active) {
              setLookupError((current) =>
                [current, caught instanceof Error ? caught.message : "No se pudieron cargar los equipos."]
                  .filter(Boolean)
                  .join(" "),
              );
            }
          },
        ),
      );
    }

    if (!canListTorneos || !canListEquipos) {
      setLookupError("Se requieren permisos de consulta de torneos y equipos para filtrar por nombre.");
    }

    void Promise.all(requests);
    return () => {
      active = false;
    };
  }, [canListTorneos, canListEquipos]);

  const torneoNombres = useMemo(
    () => new Map(torneos.map(({ id, nombre }) => [id, nombre])),
    [torneos],
  );
  const equipoNombres = useMemo(
    () => new Map(equipos.map(({ id, nombre }) => [id, nombre])),
    [equipos],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return inscripciones.filter(
      (inscripcion) =>
        !normalizedQuery ||
        (equipoNombres.get(inscripcion.equipo_id) ?? inscripcion.equipo_id)
          .toLowerCase()
          .includes(normalizedQuery) ||
        (torneoNombres.get(inscripcion.torneo_id) ?? inscripcion.torneo_id)
          .toLowerCase()
          .includes(normalizedQuery) ||
        inscripcion.fecha_inscripcion.includes(normalizedQuery) ||
        inscripcion.estado.toLowerCase().includes(normalizedQuery),
    );
  }, [inscripciones, query, equipoNombres, torneoNombres]);

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de inscripciones"
        description="Inscribe equipos en torneos, consulta su participación y actualiza o retira inscripciones."
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
      {lookupError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-co-red/30 bg-co-red/10 px-4 py-3 text-sm text-co-red"
        >
          {lookupError}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Select
                label="Filtrar por torneo"
                value={filterTorneoId}
                onChange={(event) => setFilterTorneoId(event.target.value)}
                options={[
                  { value: "", label: "Todos los torneos" },
                  ...torneos.map(({ id, nombre }) => ({ value: id, label: nombre })),
                ]}
                disabled={!canListTorneos}
              />
              <Select
                label="Filtrar por equipo"
                value={filterEquipoId}
                onChange={(event) => setFilterEquipoId(event.target.value)}
                options={[
                  { value: "", label: "Todos los equipos" },
                  ...equipos.map(({ id, nombre }) => ({ value: id, label: nombre })),
                ]}
                disabled={!canListEquipos}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Buscar inscripción"
              />
            </div>
          }
        />
        <InscripcionesTable
          inscripciones={filtered}
          equipoNombres={equipoNombres}
          torneoNombres={torneoNombres}
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
          canListTorneos={canListTorneos}
          canListEquipos={canListEquipos}
          canListRelaciones={canListRelaciones}
          canCheckDuplicates={canListInscripciones}
          onSubmit={async (inputs) => {
            if (form.payload) {
              const input = inputs[0];
              if (!input) return;
              const updated = await businessInscripcionesApi.update(
                form.payload.id,
                input,
              );
              setInscripciones((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
              notify(
                `Inscripción del equipo “${equipoNombres.get(updated.equipo_id) ?? updated.equipo_id}” actualizada.`,
              );
            } else {
              const creadas: InscripcionDTO[] = [];
              for (const input of inputs) {
                try {
                  const created = await businessInscripcionesApi.create(input);
                  creadas.push(created);
                } catch (caught) {
                  if (creadas.length > 0) {
                    await loadInscripciones();
                    throw new Error(
                      `Se inscribieron ${creadas.length} de ${inputs.length} equipos. ${caught instanceof Error ? caught.message : "No se pudo completar el resto de las inscripciones."}`,
                    );
                  }
                  throw caught;
                }
              }
              await loadInscripciones();
              notify(
                creadas.length === 1
                  ? `Inscripción del equipo “${equipoNombres.get(creadas[0].equipo_id) ?? creadas[0].equipo_id}” creada.`
                  : `Se inscribieron ${creadas.length} equipos en el torneo.`,
              );
            }
          }}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Retirar inscripción"
          confirmLabel="Retirar inscripción"
          message={
            <>
              ¿Seguro que deseas retirar la inscripción del equipo{" "}
              <strong>
                {confirmDelete.payload
                  ? equipoNombres.get(confirmDelete.payload.equipo_id) ??
                    confirmDelete.payload.equipo_id
                  : ""}
              </strong>
              ? Esta acción
              retira únicamente la participación del torneo; no elimina el
              equipo ni el torneo.
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
                `Inscripción del equipo “${equipoNombres.get(inscripcion.equipo_id) ?? inscripcion.equipo_id}” retirada.`,
              );
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo retirar la inscripción.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

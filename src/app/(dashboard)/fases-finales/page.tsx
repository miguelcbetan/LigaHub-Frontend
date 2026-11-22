"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Medal, Plus, RefreshCw } from "lucide-react";
import { FaseFormModal } from "@/components/features/fases/FaseFormModal";
import { FasesTable } from "@/components/features/fases/FasesTable";
import { GrupoEquiposModal } from "@/components/features/fases/GrupoEquiposModal";
import { FasePartidosModal } from "@/components/features/fases/FasePartidosModal";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  businessFasesApi,
  type FaseDTO,
  type FaseInput,
  type TipoFase,
} from "@/lib/api/business-fases";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { useAccess } from "@/lib/access";

const TIPOS: { value: TipoFase | ""; label: string }[] = [
  { value: "", label: "Todos los tipos" },
  { value: "GRUPOS", label: "Fase de grupos" },
  { value: "FINAL", label: "Fase final" },
];

const TIPO_LABEL: Record<TipoFase, string> = {
  GRUPOS: "Fase de grupos",
  FINAL: "Fase final",
};

export default function FasesPage() {
  const access = useAccess();
  const canCreate = access.hasPermission("/fases", "POST");
  const canEdit = access.hasPermission("/fases/{id}", "PATCH");
  const canDelete = access.hasPermission("/fases/{id}", "DELETE");
  const canListTorneos = access.hasPermission("/torneos", "GET");
  const canViewEquiposGrupo = access.hasPermission("/fases/{id}/equipos", "GET");
  const canAssignEquipos =
    access.hasPermission("/fases/{id}/equipos", "POST") &&
    access.hasPermission("/equipos", "GET") &&
    access.hasPermission("/inscripciones", "GET");
  const canViewPartidos = access.hasPermission("/fases/{id}/partidos", "GET");
  const canListEquipos = access.hasPermission("/equipos", "GET");
  const canRemoveEquipos = access.hasPermission(
    "/fases/{id}/equipos/{id}",
    "DELETE",
  );
  const [fases, setFases] = useState<FaseDTO[]>([]);
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [tipo, setTipo] = useState<TipoFase | "">("");
  const [torneoId, setTorneoId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torneosError, setTorneosError] = useState("");
  const form = useDisclosure<FaseDTO>();
  const confirmDelete = useDisclosure<FaseDTO>();
  const equiposGrupo = useDisclosure<FaseDTO>();
  const partidosFase = useDisclosure<FaseDTO>();
  const { notify } = useToast();

  const loadFases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFases(
        await businessFasesApi.findAll({
          tipo: tipo || undefined,
          torneo_id: torneoId || undefined,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las fases.",
      );
    } finally {
      setLoading(false);
    }
  }, [tipo, torneoId]);

  useEffect(() => {
    void loadFases();
  }, [loadFases]);

  useEffect(() => {
    if (!canListTorneos) {
      setTorneosError("No tienes permiso para consultar los torneos.");
      return;
    }
    let active = true;
    setTorneosError("");
    void businessTorneosApi
      .findAll()
      .then((result) => {
        if (active) setTorneos(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setTorneosError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los torneos.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [canListTorneos]);

  const torneoNombres = useMemo(
    () => new Map(torneos.map(({ id, nombre }) => [id, nombre])),
    [torneos],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...fases]
      .sort(
        (left, right) =>
          (torneoNombres.get(left.torneo_id) ?? left.torneo_id).localeCompare(
            torneoNombres.get(right.torneo_id) ?? right.torneo_id,
          ) || left.numero_orden - right.numero_orden,
      )
      .filter(
        (fase) =>
          !normalizedQuery ||
          (torneoNombres.get(fase.torneo_id) ?? fase.torneo_id)
            .toLowerCase()
            .includes(normalizedQuery) ||
          String(fase.numero_orden).includes(normalizedQuery) ||
          fase.fecha_inicio.includes(normalizedQuery) ||
          fase.fecha_fin.includes(normalizedQuery) ||
          fase.estado.toLowerCase().includes(normalizedQuery) ||
          TIPO_LABEL[fase.tipo].toLowerCase().includes(normalizedQuery),
      );
  }, [fases, query, torneoNombres]);

  const faseParaEliminar = confirmDelete.payload;
  const torneoDeFase = faseParaEliminar
    ? torneoNombres.get(faseParaEliminar.torneo_id) ?? faseParaEliminar.torneo_id
    : "";

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Gestión de fases de torneo"
        description="Crea, consulta, actualiza y elimina las fases de grupos y finales."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => void loadFases()}
            >
              Actualizar
            </Button>
            {canCreate && (
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => form.open()}
              >
                Nueva fase
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
      {torneosError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-co-red/30 bg-co-red/10 px-4 py-3 text-sm text-co-red"
        >
          {torneosError}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader
          icon={<Medal />}
          title="Fases registradas"
          description={
            loading ? "Cargando fases…" : `${filtered.length} de ${fases.length} fases`
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Select
                label="Tipo de fase"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as TipoFase | "")
                }
                options={TIPOS}
              />
              <Select
                label="Torneo"
                value={torneoId}
                onChange={(event) => setTorneoId(event.target.value)}
                options={[
                  { value: "", label: "Todos los torneos" },
                  ...torneos.map(({ id, nombre }) => ({ value: id, label: nombre })),
                ]}
                disabled={!canListTorneos || !!torneosError}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Buscar fase"
              />
            </div>
          }
        />
        <FasesTable
          fases={filtered}
          torneos={torneoNombres}
          canEdit={canEdit}
          canDelete={canDelete}
          canManageEquipos={canViewEquiposGrupo}
          onEdit={(fase) => form.open(fase)}
          onDelete={(fase) => confirmDelete.open(fase)}
          onEquipos={(fase) => equiposGrupo.open(fase)}
          canViewPartidos={canViewPartidos}
          onPartidos={(fase) => partidosFase.open(fase)}
        />
      </Card>

      {(canCreate || canEdit) && (
        <FaseFormModal
          open={form.isOpen}
          onClose={form.close}
          fase={form.payload}
          canListTorneos={canListTorneos}
          onSubmit={async (input: FaseInput) => {
            if (form.payload) {
              const { tipo: _tipo, ...update } = input;
              const updated = await businessFasesApi.update(
                form.payload.id,
                update,
              );
              await loadFases();
              notify(`Fase ${updated.numero_orden} actualizada.`);
            } else {
              const created = await businessFasesApi.create(input);
              await loadFases();
              notify(`${TIPO_LABEL[created.tipo]} ${created.numero_orden} creada.`);
            }
          }}
        />
      )}

      {canViewEquiposGrupo && (
        <GrupoEquiposModal
          open={equiposGrupo.isOpen}
          onClose={equiposGrupo.close}
          grupo={equiposGrupo.payload}
          torneoNombre={
            equiposGrupo.payload
              ? torneoNombres.get(equiposGrupo.payload.torneo_id)
              : undefined
          }
          canAssign={canAssignEquipos}
          canRemove={canRemoveEquipos}
        />
      )}

      {canViewPartidos && (
        <FasePartidosModal
          open={partidosFase.isOpen}
          onClose={partidosFase.close}
          fase={partidosFase.payload}
          torneoNombre={
            partidosFase.payload
              ? torneoNombres.get(partidosFase.payload.torneo_id)
              : undefined
          }
          canListEquipos={canListEquipos}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.isOpen}
          onClose={confirmDelete.close}
          title="Eliminar fase"
          confirmLabel="Eliminar fase"
          message={
            <>
              ¿Seguro que deseas eliminar{" "}
              <strong>
                {faseParaEliminar
                  ? `${TIPO_LABEL[faseParaEliminar.tipo]} ${faseParaEliminar.numero_orden}`
                  : ""}
              </strong>{" "}
              del torneo <strong>{torneoDeFase}</strong>? Si tiene partidos o
              equipos asignados, o si es un grupo o una fase final que ya no
              está pendiente,
              Business impedirá la eliminación y mostrará qué debe hacerse.
              El torneo y los equipos registrados no se eliminan.
            </>
          }
          onConfirm={async () => {
            if (!faseParaEliminar) return;
            try {
              await businessFasesApi.remove(faseParaEliminar.id);
              setFases((current) =>
                current.filter((fase) => fase.id !== faseParaEliminar.id),
              );
              notify(`Fase ${faseParaEliminar.numero_orden} eliminada.`);
            } catch (caught) {
              notify(
                caught instanceof Error
                  ? caught.message
                  : "No se pudo eliminar la fase.",
                "error",
              );
            }
          }}
        />
      )}
    </>
  );
}

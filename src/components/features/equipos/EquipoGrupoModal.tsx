"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LayoutGrid, TriangleAlert } from "lucide-react";
import type { EquipoDTO } from "@/lib/api/business-equipos";
import { businessFasesApi, type FaseDTO } from "@/lib/api/business-fases";
import { businessInscripcionesApi } from "@/lib/api/business-inscripciones";
import { businessTorneosApi } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface EquipoGrupoModalProps {
  open: boolean;
  onClose: () => void;
  equipo?: EquipoDTO;
  /** Recibe el id del grupo (fases_grupos) o null para dejarlo sin grupo. */
  onSubmit: (faseGruposId: string | null) => void | Promise<void>;
}

interface GrupoOption {
  id: string;
  label: string;
}

const SIN_GRUPO = "";

// Grupos de los torneos donde el equipo tiene una inscripción ACEPTADA.
async function loadGrupos(equipoId: string): Promise<GrupoOption[]> {
  const inscripciones = await businessInscripcionesApi.findAll({
    equipo_id: equipoId,
  });
  const torneoIds = [
    ...new Set(
      inscripciones
        .filter(({ estado }) => estado === "ACEPTADA")
        .map(({ torneo_id }) => torneo_id),
    ),
  ];
  if (torneoIds.length === 0) return [];

  const [fasesPorTorneo, torneos] = await Promise.all([
    Promise.all(
      torneoIds.map((torneo_id) =>
        businessFasesApi.findAll({ tipo: "GRUPOS", torneo_id }),
      ),
    ),
    // El nombre del torneo es solo para mostrar: si falla se usa el id.
    businessTorneosApi.findAll().catch(() => []),
  ]);
  const nombreTorneo = new Map(torneos.map(({ id, nombre }) => [id, nombre]));

  return fasesPorTorneo
    .flat()
    .filter((fase): fase is FaseDTO & { fase_grupos_id: string } =>
      Boolean(fase.fase_grupos_id),
    )
    .map((fase) => ({
      id: fase.fase_grupos_id,
      label: `${fase.nombre ?? `Fase ${fase.numero_orden}`} — ${
        nombreTorneo.get(fase.torneo_id) ?? fase.torneo_id
      }${fase.cupo_equipos ? ` (cupo ${fase.cupo_equipos})` : ""}`,
    }));
}

export function EquipoGrupoModal({
  open,
  onClose,
  equipo,
  onSubmit,
}: EquipoGrupoModalProps) {
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [grupoId, setGrupoId] = useState(SIN_GRUPO);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !equipo) return;
    setGrupoId(equipo.fase_grupos_id ?? SIN_GRUPO);
    setGrupos([]);
    setLoadError("");
    setError("");
    setSubmitting(false);

    let active = true;
    setLoading(true);
    void loadGrupos(equipo.id)
      .then((result) => {
        if (active) setGrupos(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setLoadError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los grupos.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, equipo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(grupoId === SIN_GRUPO ? null : grupoId);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo asignar el grupo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Si el grupo actual no está en la lista (p. ej. inscripción ya no aceptada),
  // se muestra igual para no perder la selección.
  const options = [
    { value: SIN_GRUPO, label: "Sin grupo" },
    ...grupos.map(({ id, label }) => ({ value: id, label })),
    ...(equipo?.fase_grupos_id &&
    !grupos.some(({ id }) => id === equipo.fase_grupos_id)
      ? [{ value: equipo.fase_grupos_id, label: "Grupo actual" }]
      : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<LayoutGrid />}
      title="Asignar grupo"
      description={
        equipo
          ? `Elige el grupo de “${equipo.nombre}”. Solo aparecen los grupos de torneos donde su inscripción está aceptada.`
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="equipo-grupo-form"
            loading={submitting}
            disabled={loading || !!loadError}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="equipo-grupo-form"
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {(error || loadError) && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error || `No se pudieron cargar los grupos: ${loadError}`}
          </div>
        )}
        <Select
          label="Grupo"
          value={grupoId}
          onChange={(event) => setGrupoId(event.target.value)}
          options={options}
          disabled={loading || !!loadError}
        />
        {!loading && !loadError && grupos.length === 0 && (
          <p className="text-sm text-zinc-500">
            El equipo no tiene inscripciones aceptadas en torneos con grupos.
          </p>
        )}
      </form>
    </Modal>
  );
}

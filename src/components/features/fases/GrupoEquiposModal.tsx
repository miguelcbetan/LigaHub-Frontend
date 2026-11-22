"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TriangleAlert, UserMinus, Users } from "lucide-react";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { businessFasesApi, type FaseDTO } from "@/lib/api/business-fases";
import { businessInscripcionesApi } from "@/lib/api/business-inscripciones";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

interface GrupoEquiposModalProps {
  open: boolean;
  onClose: () => void;
  /** Fase de tipo GRUPOS: cada una representa un grupo. */
  grupo?: FaseDTO;
  torneoNombre?: string;
  canAssign: boolean;
  canRemove: boolean;
}

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

// Equipos activos, con inscripción ACEPTADA en el torneo y sin grupo.
async function loadCandidatos(torneoId: string): Promise<EquipoDTO[]> {
  const [inscripciones, equipos] = await Promise.all([
    businessInscripcionesApi.findAll({ torneo_id: torneoId }),
    businessEquiposApi.findAll(),
  ]);
  const aceptados = new Set(
    inscripciones
      .filter(({ estado }) => estado === "ACEPTADA")
      .map(({ equipo_id }) => equipo_id),
  );
  return equipos
    .filter(
      ({ id, activo, fase_grupos_id }) =>
        activo && !fase_grupos_id && aceptados.has(id),
    )
    .sort((left, right) => left.nombre.localeCompare(right.nombre));
}

export function GrupoEquiposModal({
  open,
  onClose,
  grupo,
  torneoNombre,
  canAssign,
  canRemove,
}: GrupoEquiposModalProps) {
  const [miembros, setMiembros] = useState<EquipoDTO[]>([]);
  const [candidatos, setCandidatos] = useState<EquipoDTO[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidatosError, setCandidatosError] = useState("");
  const [saving, setSaving] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);
  const { notify } = useToast();

  const cargar = useCallback(async () => {
    if (!grupo) return;
    setLoading(true);
    setError("");
    setCandidatosError("");
    try {
      setMiembros(await businessFasesApi.findEquiposGrupo(grupo.id));
    } catch (caught) {
      setError(errorMessage(caught, "No se pudieron cargar los equipos del grupo."));
    }
    if (canAssign) {
      try {
        setCandidatos(await loadCandidatos(grupo.torneo_id));
      } catch (caught) {
        setCandidatosError(
          errorMessage(caught, "No se pudieron cargar los equipos disponibles."),
        );
      }
    }
    setLoading(false);
  }, [grupo, canAssign]);

  useEffect(() => {
    if (!open || !grupo) return;
    setMiembros([]);
    setCandidatos([]);
    setSeleccion(new Set());
    void cargar();
  }, [open, grupo, cargar]);

  const cupo = grupo?.cupo_equipos ?? null;
  const disponibles = cupo == null ? Infinity : Math.max(cupo - miembros.length, 0);
  const lleno = cupo != null && disponibles === 0;
  const excedeCupo = seleccion.size > disponibles;

  const toggle = (id: string) =>
    setSeleccion((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const asignar = async () => {
    if (!grupo || seleccion.size === 0) return;
    setSaving(true);
    setError("");
    try {
      const actualizados = await businessFasesApi.asignarEquiposGrupo(grupo.id, [
        ...seleccion,
      ]);
      setMiembros(actualizados);
      setCandidatos((current) => current.filter(({ id }) => !seleccion.has(id)));
      notify(
        seleccion.size === 1
          ? "Equipo asignado al grupo."
          : `${seleccion.size} equipos asignados al grupo.`,
      );
      setSeleccion(new Set());
    } catch (caught) {
      setError(errorMessage(caught, "No se pudieron asignar los equipos."));
    } finally {
      setSaving(false);
    }
  };

  const quitar = async (equipo: EquipoDTO) => {
    if (!grupo) return;
    setQuitando(equipo.id);
    setError("");
    try {
      await businessFasesApi.quitarEquipoGrupo(grupo.id, equipo.id);
      setMiembros((current) => current.filter(({ id }) => id !== equipo.id));
      if (canAssign) {
        setCandidatos((current) =>
          [...current, { ...equipo, fase_grupos_id: null }].sort((left, right) =>
            left.nombre.localeCompare(right.nombre),
          ),
        );
      }
      notify(`"${equipo.nombre}" salió del grupo.`);
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo quitar el equipo del grupo."));
    } finally {
      setQuitando(null);
    }
  };

  const titulo = grupo?.nombre ?? "Grupo";
  const descripcion = useMemo(() => {
    if (!grupo) return undefined;
    const torneo = torneoNombre ?? grupo.torneo_id;
    return `${torneo} · Fase ${grupo.numero_orden}`;
  }, [grupo, torneoNombre]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Users />}
      title={`Equipos de ${titulo}`}
      description={descripcion}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Equipos del grupo
            </h3>
            <Badge tone={lleno ? "red" : "blue"}>
              {cupo == null
                ? `${miembros.length} equipos`
                : `${miembros.length} / ${cupo} equipos`}
            </Badge>
          </div>
          {loading ? (
            <p className="text-sm text-zinc-500">Cargando equipos…</p>
          ) : miembros.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Este grupo aún no tiene equipos asignados.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              {miembros.map((equipo) => (
                <li
                  key={equipo.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {equipo.nombre}
                  </span>
                  {canRemove && (
                    <IconButton
                      label={`Quitar ${equipo.nombre} del grupo`}
                      tone="red"
                      disabled={quitando === equipo.id}
                      onClick={() => void quitar(equipo)}
                    >
                      <UserMinus />
                    </IconButton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {canAssign && (
          <section>
            <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Agregar equipos
            </h3>
            <p className="mb-3 text-xs text-zinc-500">
              Solo aparecen equipos activos, con inscripción aceptada en el
              torneo y que no están en otro grupo. Para cambiar un equipo de
              grupo, primero quítalo del grupo actual.
            </p>
            {candidatosError ? (
              <p role="alert" className="text-sm text-co-red">
                {candidatosError}
              </p>
            ) : loading ? null : candidatos.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay equipos disponibles para asignar.
              </p>
            ) : (
              <>
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {candidatos.map((equipo) => (
                    <li key={equipo.id}>
                      <Checkbox
                        label={equipo.nombre}
                        size="sm"
                        checked={seleccion.has(equipo.id)}
                        disabled={lleno && !seleccion.has(equipo.id)}
                        onChange={() => toggle(equipo.id)}
                      />
                    </li>
                  ))}
                </ul>
                {excedeCupo && (
                  <p className="mt-2 text-xs text-co-red">
                    Solo quedan {disponibles} cupos en el grupo.
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    leftIcon={<Plus className="size-4" />}
                    loading={saving}
                    disabled={seleccion.size === 0 || excedeCupo}
                    onClick={() => void asignar()}
                  >
                    {seleccion.size > 0
                      ? `Asignar ${seleccion.size} ${seleccion.size === 1 ? "equipo" : "equipos"}`
                      : "Asignar equipos"}
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

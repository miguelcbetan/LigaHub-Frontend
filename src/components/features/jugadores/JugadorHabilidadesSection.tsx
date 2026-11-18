"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  businessHabilidadJugadorApi,
  type HabilidadJugadorDTO,
} from "@/lib/api/business-habilidad-jugador";
import { businessHabilidadesApi, type HabilidadDTO } from "@/lib/api/business-habilidades";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Field";

interface JugadorHabilidadesSectionProps {
  jugadorId: string;
  canAdd: boolean;
  canRemove: boolean;
}

const statusDe = (caught: unknown) =>
  caught instanceof BusinessApiError ? caught.status : undefined;

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

function mensajeAlAsignar(caught: unknown): string {
  if (statusDe(caught) === 409) return "El jugador ya tiene esa habilidad.";
  if (statusDe(caught) === 404) return "La habilidad o el jugador ya no existen.";
  return errorMessage(caught, "No se pudo asignar la habilidad.");
}

function mensajeAlRetirar(caught: unknown): string {
  if (statusDe(caught) === 404) return "Esa habilidad ya había sido retirada del jugador.";
  return errorMessage(caught, "No se pudo retirar la habilidad.");
}

export function JugadorHabilidadesSection({
  jugadorId,
  canAdd,
  canRemove,
}: JugadorHabilidadesSectionProps) {
  const { notify } = useToast();
  const [asignaciones, setAsignaciones] = useState<HabilidadJugadorDTO[]>([]);
  const [habilidades, setHabilidades] = useState<HabilidadDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [habilidadId, setHabilidadId] = useState("");
  const [saving, setSaving] = useState(false);
  const [porRetirar, setPorRetirar] = useState<HabilidadJugadorDTO | null>(null);

  useEffect(() => {
    let active = true;
    setAsignaciones([]);
    setHabilidades([]);
    setError("");
    setActionError("");
    setHabilidadId("");
    setPorRetirar(null);
    setLoading(true);

    Promise.all([
      businessHabilidadJugadorApi.findByJugador(jugadorId),
      businessHabilidadesApi.findAll(),
    ])
      .then(([found, catalogo]) => {
        if (!active) return;
        setAsignaciones(found);
        setHabilidades(catalogo);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(errorMessage(caught, "No se pudieron cargar las habilidades del jugador."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jugadorId]);

  const nombres = useMemo(
    () => new Map(habilidades.map(({ id, nombre }) => [id, nombre])),
    [habilidades],
  );
  const asignadas = useMemo(
    () => new Set(asignaciones.map(({ habilidad_id }) => habilidad_id)),
    [asignaciones],
  );
  const hayDisponibles = habilidades.some(({ id }) => !asignadas.has(id));
  const nombreDe = (id: string) => nombres.get(id) ?? "Habilidad no disponible";

  /** Sincroniza la lista cuando otra sesión cambió las asignaciones. */
  const recargarAsignaciones = async () => {
    try {
      setAsignaciones(await businessHabilidadJugadorApi.findByJugador(jugadorId));
    } catch {
      // Se conserva la lista actual; el error de la acción ya está visible.
    }
  };

  const asignar = async () => {
    if (!habilidadId || saving) return;
    setSaving(true);
    setActionError("");
    try {
      const created = await businessHabilidadJugadorApi.create(habilidadId, jugadorId);
      setAsignaciones((current) => [...current, created]);
      setHabilidadId("");
      notify(`Habilidad “${nombreDe(created.habilidad_id)}” asignada.`);
    } catch (caught) {
      setActionError(mensajeAlAsignar(caught));
      setHabilidadId("");
      await recargarAsignaciones();
    } finally {
      setSaving(false);
    }
  };

  const retirar = async () => {
    const asignacion = porRetirar;
    if (!asignacion || saving) return;
    setSaving(true);
    setActionError("");
    try {
      await businessHabilidadJugadorApi.remove(asignacion.id);
      setAsignaciones((current) => current.filter(({ id }) => id !== asignacion.id));
      notify(`Habilidad “${nombreDe(asignacion.habilidad_id)}” retirada del jugador.`);
    } catch (caught) {
      setActionError(mensajeAlRetirar(caught));
      await recargarAsignaciones();
    } finally {
      setSaving(false);
    }
  };

  const placeholder =
    habilidades.length === 0
      ? "No hay habilidades registradas"
      : hayDisponibles
        ? "Selecciona una habilidad"
        : "Ya tiene todas las habilidades";

  return (
    <section aria-labelledby="jugador-habilidades" className="space-y-3 text-sm">
      <h3
        id="jugador-habilidades"
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        Habilidades
      </h3>

      {loading ? (
        <p className="text-zinc-500">Cargando habilidades…</p>
      ) : error ? (
        <p role="alert" className="text-co-red">
          {error}
        </p>
      ) : (
        <>
          {asignaciones.length === 0 ? (
            <p className="text-zinc-500">El jugador no tiene habilidades asignadas.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {asignaciones.map((asignacion) => {
                const nombre = nombreDe(asignacion.habilidad_id);
                return (
                  <li
                    key={asignacion.id}
                    className="inline-flex items-center gap-1 rounded-full bg-co-blue/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-co-blue"
                  >
                    {nombre}
                    {canRemove && (
                      <button
                        type="button"
                        aria-label={`Retirar ${nombre}`}
                        disabled={saving}
                        onClick={() => setPorRetirar(asignacion)}
                        className="rounded-full p-0.5 hover:bg-co-blue/20 disabled:opacity-50"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {canAdd && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select
                  label="Asignar habilidad"
                  placeholder={placeholder}
                  value={habilidadId}
                  onChange={(event) => setHabilidadId(event.target.value)}
                  options={habilidades.map(({ id, nombre }) => ({
                    value: id,
                    label: asignadas.has(id) ? `${nombre} (ya asignada)` : nombre,
                    disabled: asignadas.has(id),
                  }))}
                  disabled={!hayDisponibles}
                />
              </div>
              <Button
                leftIcon={<Plus className="size-4" />}
                onClick={() => void asignar()}
                disabled={!habilidadId}
                loading={saving}
              >
                Asignar
              </Button>
            </div>
          )}

          {actionError && (
            <p role="alert" className="text-co-red">
              {actionError}
            </p>
          )}
        </>
      )}

      {canRemove && (
        <ConfirmDialog
          open={porRetirar !== null}
          onClose={() => setPorRetirar(null)}
          title="Retirar habilidad"
          confirmLabel="Retirar habilidad"
          message={
            <>
              ¿Retirar <strong>{porRetirar ? nombreDe(porRetirar.habilidad_id) : ""}</strong> de
              este jugador? Solo se retira la asignación: la habilidad sigue disponible en el
              catálogo.
            </>
          }
          onConfirm={() => void retirar()}
        />
      )}
    </section>
  );
}

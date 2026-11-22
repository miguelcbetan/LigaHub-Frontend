"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Goal, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  businessAnotacionesApi,
  ESTADOS_CON_GOLES,
  MINUTO_MAXIMO,
  type AnotacionDTO,
} from "@/lib/api/business-anotaciones";
import {
  businessEquipoJugadorApi,
  type EquipoJugadorDTO,
} from "@/lib/api/business-equipo-jugador";
import { businessJugadoresApi, type JugadorDTO } from "@/lib/api/business-jugadores";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input, Select } from "@/components/ui/Field";
import { ordenarPorMinuto } from "./anotacion-utils";

interface PartidoGolesSectionProps {
  partido: PartidoDTO;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Se llama con la lista actualizada para refrescar el marcador. */
  onChange?: (anotaciones: AnotacionDTO[]) => void;
}

interface Borrador {
  /** undefined = gol nuevo. */
  id?: string;
  jugadorId: string;
  minuto: string;
  descripcion: string;
}

const BORRADOR_VACIO: Borrador = { jugadorId: "", minuto: "", descripcion: "" };

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

/** async que nunca falla: un catálogo sin permiso se deja vacío. */
async function orEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

/**
 * HU-GC-07: goles del partido. Se gestionan con el partido en juego (cada gol
 * se avisa por correo) y se pueden corregir con el partido finalizado (sin
 * correo). El marcador se calcula a partir de estos goles.
 */
export function PartidoGolesSection({
  partido,
  canCreate,
  canEdit,
  canDelete,
  onChange,
}: PartidoGolesSectionProps) {
  const { notify } = useToast();
  const [anotaciones, setAnotaciones] = useState<AnotacionDTO[]>(
    ordenarPorMinuto(partido.anotaciones ?? []),
  );
  const [plantilla, setPlantilla] = useState<EquipoJugadorDTO[]>([]);
  const [jugadores, setJugadores] = useState<JugadorDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UserResponseDTO[]>([]);
  const [error, setError] = useState("");
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [porEliminar, setPorEliminar] = useState<AnotacionDTO | null>(null);

  const editable = (ESTADOS_CON_GOLES as readonly string[]).includes(partido.estado);
  const enJuego = partido.estado === "EN_JUEGO";

  useEffect(() => {
    let active = true;
    setBorrador(null);
    setPorEliminar(null);
    setError("");
    setAnotaciones(ordenarPorMinuto(partido.anotaciones ?? []));

    businessAnotacionesApi
      .findByPartido(partido.id)
      .then((result) => {
        if (active) setAnotaciones(ordenarPorMinuto(result));
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught, "No se pudieron cargar los goles."));
      });

    // Plantillas de ambos equipos y nombres (ms-security) para el selector.
    void Promise.all([
      orEmpty(businessEquipoJugadorApi.findByEquipo(partido.equipo_local_id)),
      orEmpty(businessEquipoJugadorApi.findByEquipo(partido.equipo_visitante_id)),
      orEmpty(businessJugadoresApi.findAll()),
      orEmpty(usersApi.findAll()),
    ]).then(([locales, visitantes, todos, users]) => {
      if (!active) return;
      setPlantilla([...locales, ...visitantes]);
      setJugadores(todos);
      setUsuarios(users);
    });

    return () => {
      active = false;
    };
    // Se recarga al cambiar de partido, no en cada cambio de marcador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partido.id]);

  const jugadoresPorId = useMemo(
    () => new Map(jugadores.map((jugador) => [jugador.id, jugador])),
    [jugadores],
  );
  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios],
  );

  const nombreEquipo = (equipoId: string) =>
    equipoId === partido.equipo_local_id
      ? (partido.equipo_local_nombre ?? "Local")
      : equipoId === partido.equipo_visitante_id
        ? (partido.equipo_visitante_nombre ?? "Visitante")
        : "Equipo no disponible";

  const nombreJugador = (jugadorId: string) => {
    const jugador = jugadoresPorId.get(jugadorId);
    if (!jugador) return "Jugador no disponible";
    return usuariosPorId.get(jugador.user_id)?.name ?? `Usuario #${jugador.user_id}`;
  };

  // Jugadores vigentes de cada equipo; al editar se conserva el goleador actual.
  const opcionesJugador = useMemo(() => {
    const vistos = new Set<string>();
    const opciones = plantilla
      .filter(({ activo }) => activo)
      .filter(({ jugador_id }) => !vistos.has(jugador_id) && vistos.add(jugador_id))
      .map(({ jugador_id, equipo_id }) => ({
        value: jugador_id,
        label: `${nombreJugador(jugador_id)} · ${nombreEquipo(equipo_id)}`,
      }));
    const actual = anotaciones.find(({ id }) => id === borrador?.id);
    if (actual && !vistos.has(actual.jugador_id)) {
      opciones.push({
        value: actual.jugador_id,
        label: `${nombreJugador(actual.jugador_id)} · ${nombreEquipo(actual.equipo_id)}`,
      });
    }
    return opciones.sort((a, b) => a.label.localeCompare(b.label, "es"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla, jugadoresPorId, usuariosPorId, borrador?.id, anotaciones]);

  const actualizar = (lista: AnotacionDTO[]) => {
    const ordenada = ordenarPorMinuto(lista);
    setAnotaciones(ordenada);
    onChange?.(ordenada);
  };

  const abrir = (anotacion?: AnotacionDTO) => {
    setFormError("");
    setPorEliminar(null);
    setBorrador(
      anotacion
        ? {
            id: anotacion.id,
            jugadorId: anotacion.jugador_id,
            minuto: String(anotacion.minuto),
            descripcion: anotacion.descripcion ?? "",
          }
        : BORRADOR_VACIO,
    );
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!borrador || saving) return;
    if (!borrador.jugadorId) {
      setFormError("Selecciona el jugador que anotó el gol.");
      return;
    }
    const minuto = Number(borrador.minuto);
    if (borrador.minuto.trim() === "" || !Number.isInteger(minuto) || minuto < 0 || minuto > MINUTO_MAXIMO) {
      setFormError(`El minuto debe ser un número entero entre 0 y ${MINUTO_MAXIMO}.`);
      return;
    }
    const datos = {
      jugador_id: borrador.jugadorId,
      minuto,
      descripcion: borrador.descripcion.trim() || null,
    };

    setFormError("");
    setSaving(true);
    try {
      if (borrador.id) {
        const updated = await businessAnotacionesApi.update(borrador.id, datos);
        actualizar(anotaciones.map((item) => (item.id === updated.id ? updated : item)));
        notify("Gol actualizado.");
      } else {
        const created = await businessAnotacionesApi.create({
          ...datos,
          partido_id: partido.id,
        });
        actualizar([...anotaciones, created]);
        notify(
          enJuego
            ? "Gol registrado. Se notificará por correo a quienes tienen boleta o apuesta del partido."
            : "Gol registrado como corrección del partido finalizado.",
        );
      }
      setBorrador(null);
    } catch (caught) {
      setFormError(errorMessage(caught, "No se pudo guardar el gol."));
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar || saving) return;
    setSaving(true);
    try {
      await businessAnotacionesApi.remove(porEliminar.id);
      actualizar(anotaciones.filter(({ id }) => id !== porEliminar.id));
      notify("Gol eliminado.", "error");
      setPorEliminar(null);
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo eliminar el gol."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="goles-titulo" className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="goles-titulo" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Goal className="size-4 text-co-blue" />
          Goles ({anotaciones.length})
        </h3>
        {canCreate && editable && !borrador && (
          <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => abrir()}>
            Registrar gol
          </Button>
        )}
      </div>

      {!editable && (
        <p role="status" className="mb-3 text-sm text-zinc-500">
          {partido.estado === "CANCELADO"
            ? "El partido fue cancelado: no admite goles."
            : "Los goles se registran cuando el partido esté en juego."}
        </p>
      )}
      {partido.estado === "FINALIZADO" && (canCreate || canEdit || canDelete) && (
        <p role="status" className="mb-3 text-sm text-zinc-500">
          Partido finalizado: los cambios se guardan como corrección y no envían correo.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-sm text-co-red">
          {error}
        </p>
      )}

      {anotaciones.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay goles registrados.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {anotaciones.map((anotacion) => (
            <li key={anotacion.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-10 shrink-0 font-semibold tabular-nums text-co-blue">
                {anotacion.minuto}&apos;
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-zinc-900 dark:text-zinc-100">
                  {nombreJugador(anotacion.jugador_id)}
                  <span className="text-zinc-500"> · {nombreEquipo(anotacion.equipo_id)}</span>
                </div>
                {anotacion.descripcion && (
                  <div className="truncate text-zinc-500">{anotacion.descripcion}</div>
                )}
              </div>
              {editable && porEliminar?.id === anotacion.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-zinc-500">¿Eliminar?</span>
                  <Button size="sm" variant="danger" loading={saving} onClick={() => void eliminar()}>
                    Eliminar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setPorEliminar(null)}>
                    No
                  </Button>
                </div>
              ) : (
                editable && (
                  <div className="flex shrink-0 gap-0.5">
                    {canEdit && (
                      <IconButton label="Editar gol" tone="blue" onClick={() => abrir(anotacion)}>
                        <Pencil />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        label="Eliminar gol"
                        tone="red"
                        onClick={() => {
                          setBorrador(null);
                          setPorEliminar(anotacion);
                        }}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {borrador && (
        <form
          aria-label={borrador.id ? "Editar gol" : "Registrar gol"}
          onSubmit={guardar}
          noValidate
          className="mt-4 space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
        >
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2 text-sm text-co-red"
            >
              <TriangleAlert className="size-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <Select
              label="Jugador"
              placeholder={
                opcionesJugador.length
                  ? "Selecciona el goleador"
                  : "Los equipos no tienen jugadores vigentes"
              }
              value={borrador.jugadorId}
              onChange={(event) => setBorrador({ ...borrador, jugadorId: event.target.value })}
              options={opcionesJugador}
            />
            <Input
              label="Minuto"
              type="number"
              min={0}
              max={MINUTO_MAXIMO}
              value={borrador.minuto}
              onChange={(event) => setBorrador({ ...borrador, minuto: event.target.value })}
            />
          </div>
          <Input
            label="Descripción (opcional)"
            maxLength={255}
            value={borrador.descripcion}
            onChange={(event) => setBorrador({ ...borrador, descripcion: event.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBorrador(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {borrador.id ? "Guardar gol" : "Registrar gol"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

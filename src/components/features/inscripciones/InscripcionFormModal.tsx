"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EstadoInscripcion,
  InscripcionDTO,
  InscripcionInput,
} from "@/lib/api/business-inscripciones";
import { businessInscripcionesApi } from "@/lib/api/business-inscripciones";
import { businessEquiposDeportesApi } from "@/lib/api/business-equipos-deportes";
import { businessEquiposApi, type EquipoDTO } from "@/lib/api/business-equipos";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface InscripcionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (inputs: InscripcionInput[]) => void | Promise<void>;
  inscripcion?: InscripcionDTO;
  canListTorneos: boolean;
  canListEquipos: boolean;
  canListRelaciones: boolean;
  canCheckDuplicates: boolean;
}

const ESTADOS: { value: EstadoInscripcion; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "RECHAZADA", label: "Rechazada" },
];

function todayAsDateInput() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

export function InscripcionFormModal({
  open,
  onClose,
  onSubmit,
  inscripcion,
  canListTorneos,
  canListEquipos,
  canListRelaciones,
  canCheckDuplicates,
}: InscripcionFormModalProps) {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState<EstadoInscripcion>("PENDIENTE");
  const [equipoIds, setEquipoIds] = useState<string[]>([]);
  const [torneoId, setTorneoId] = useState("");
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [equipos, setEquipos] = useState<EquipoDTO[]>([]);
  const [equiposElegibles, setEquiposElegibles] = useState<EquipoDTO[]>([]);
  const [inscripcionesTorneo, setInscripcionesTorneo] = useState<InscripcionDTO[]>([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [loadingElegibles, setLoadingElegibles] = useState(false);
  const [torneosError, setTorneosError] = useState("");
  const [equiposError, setEquiposError] = useState("");
  const [elegiblesError, setElegiblesError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFecha(inscripcion?.fecha_inscripcion ?? todayAsDateInput());
    setEstado(inscripcion?.estado ?? "PENDIENTE");
    setEquipoIds(inscripcion ? [inscripcion.equipo_id] : []);
    setTorneoId(inscripcion?.torneo_id ?? "");
    setTorneos([]);
    setEquipos([]);
    setEquiposElegibles([]);
    setInscripcionesTorneo([]);
    setTorneosError("");
    setEquiposError("");
    setElegiblesError("");
    setError("");
    setSubmitting(false);

    let active = true;
    if (canListTorneos) {
      setLoadingTorneos(true);
      void businessTorneosApi
        .findAll()
        .then((result) => {
          if (active) setTorneos(result);
        })
        .catch((caught: unknown) => {
          if (active) setTorneosError(errorMessage(caught, "No se pudieron cargar los torneos."));
        })
        .finally(() => {
          if (active) setLoadingTorneos(false);
        });
    } else {
      setTorneosError("No tienes permiso para consultar los torneos.");
    }

    if (canListEquipos) {
      setLoadingEquipos(true);
      void businessEquiposApi
        .findAll()
        .then((result) => {
          if (active) setEquipos(result);
        })
        .catch((caught: unknown) => {
          if (active) setEquiposError(errorMessage(caught, "No se pudieron cargar los equipos."));
        })
        .finally(() => {
          if (active) setLoadingEquipos(false);
        });
    } else {
      setEquiposError("No tienes permiso para consultar los equipos.");
    }

    return () => {
      active = false;
    };
  }, [open, inscripcion, canListTorneos, canListEquipos]);

  const torneoSeleccionado = torneos.find(({ id }) => id === torneoId);
  const torneoValidoParaInscripcion =
    !!torneoSeleccionado &&
    torneoSeleccionado.activo &&
    torneoSeleccionado.estado === "PENDIENTE";
  const nombreEquipoDe = (id: string) =>
    equipos.find((equipo) => equipo.id === id)?.nombre ?? `Equipo ${id}`;

  useEffect(() => {
    if (!open || !torneoId || !torneoSeleccionado || inscripcion) return;
    let active = true;
    setEquiposElegibles([]);
    setInscripcionesTorneo([]);
    setElegiblesError("");
    setLoadingElegibles(true);

    if (!canListRelaciones) {
      setElegiblesError("No tienes permiso para consultar los deportes de los equipos.");
      setLoadingElegibles(false);
      return;
    }

    const requests: [
      ReturnType<typeof businessEquiposDeportesApi.findByDeporte>,
      Promise<InscripcionDTO[]>,
    ] = [
      businessEquiposDeportesApi.findByDeporte(torneoSeleccionado.deporte_id),
      canCheckDuplicates
        ? businessInscripcionesApi.findAll({ torneo_id: torneoId })
        : Promise.resolve([]),
    ];

    void Promise.all(requests)
      .then(([relaciones, existing]) => {
        if (!active) return;
        const equiposDelDeporte = new Set(relaciones.map(({ equipo_id }) => equipo_id));
        setEquiposElegibles(
          equipos.filter((equipo) => equiposDelDeporte.has(equipo.id) && equipo.activo),
        );
        setInscripcionesTorneo(existing);
      })
      .catch((caught: unknown) => {
        if (active) {
          setElegiblesError(
            errorMessage(caught, "No se pudieron validar los equipos del torneo."),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingElegibles(false);
      });

    return () => {
      active = false;
    };
  }, [
    open,
    torneoId,
    torneoSeleccionado,
    inscripcion,
    canListRelaciones,
    canCheckDuplicates,
    equipos,
  ]);

  const equiposDisponibles = useMemo(() => {
    const yaInscritos = new Set(
      inscripcionesTorneo
        .filter((item) => item.id !== inscripcion?.id)
        .map(({ equipo_id }) => equipo_id),
    );
    return equiposElegibles.filter(
      ({ id }) => !yaInscritos.has(id) || equipoIds.includes(id),
    );
  }, [inscripcionesTorneo, equiposElegibles, inscripcion, equipoIds]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fecha) {
      setError("Selecciona la fecha de inscripción.");
      return;
    }
    if (!torneoSeleccionado) {
      setError("Selecciona un torneo registrado.");
      return;
    }
    if (!inscripcion && !torneoValidoParaInscripcion) {
      setError("Solo se pueden inscribir equipos en torneos activos y pendientes.");
      return;
    }
    if (equipoIds.length === 0) {
      setError("Selecciona al menos un equipo.");
      return;
    }
    if (!inscripcion && equipoIds.some((id) => !equiposDisponibles.some((equipo) => equipo.id === id))) {
      setError("Selecciona equipos activos asociados al deporte del torneo que aún no estén inscritos.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(
        equipoIds.map((equipo_id) => ({
          fecha_inscripcion: fecha,
          estado,
          equipo_id,
          torneo_id: torneoId,
        })),
      );
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo guardar la inscripción."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={inscripcion ? <Pencil /> : <Plus />}
      title={inscripcion ? "Editar inscripción" : "Inscribir equipos en un torneo"}
      description={
        inscripcion
          ? "Actualiza la fecha o el estado de la inscripción."
          : "Selecciona un torneo y uno o varios equipos asociados al deporte correspondiente."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="inscripcion-form" loading={submitting}>
            {inscripcion ? "Guardar cambios" : "Inscribir equipos"}
          </Button>
        </>
      }
    >
      <form
        id="inscripcion-form"
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        {equiposError && (
          <p role="alert" className="text-sm text-co-red">{equiposError}</p>
        )}
        {torneosError && (
          <p role="alert" className="text-sm text-co-red">{torneosError}</p>
        )}
        <Select
          label="Torneo"
          placeholder={
            loadingTorneos
              ? "Cargando torneos…"
              : torneos.length
                ? "Selecciona un torneo"
                : "No hay torneos disponibles"
          }
          value={torneoId}
          onChange={(event) => {
            setTorneoId(event.target.value);
            setEquipoIds([]);
          }}
          options={torneos
            .filter(
              (torneo) =>
                inscripcion?.torneo_id === torneo.id ||
                (torneo.activo && torneo.estado === "PENDIENTE"),
            )
            .map((torneo) => ({
              value: torneo.id,
              label: `${torneo.nombre} · ${torneo.estado === "PENDIENTE" ? "Pendiente" : torneo.estado}`,
            }))}
          disabled={loadingTorneos || !!torneosError || !!inscripcion}
          required
        />
        {torneoId && torneoSeleccionado && !inscripcion && (
          <section aria-label="Equipos disponibles">
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Equipos asociados a {torneoSeleccionado.nombre}
            </p>
            {loadingEquipos || loadingElegibles ? (
              <p className="text-sm text-zinc-500">Cargando equipos disponibles…</p>
            ) : elegiblesError ? (
              <p role="alert" className="text-sm text-co-red">{elegiblesError}</p>
            ) : equiposDisponibles.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay equipos activos disponibles asociados al deporte de este torneo.
              </p>
            ) : (
              <fieldset className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <legend className="sr-only">Selecciona uno o varios equipos</legend>
                {equiposDisponibles.map((equipo) => (
                  <label key={equipo.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={equipoIds.includes(equipo.id)}
                      onChange={(event) =>
                        setEquipoIds((current) =>
                          event.target.checked
                            ? [...current, equipo.id]
                            : current.filter((id) => id !== equipo.id),
                        )
                      }
                    />
                    <span>{equipo.nombre}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </section>
        )}
        {inscripcion && (
          <Input
            label="Equipo"
            value={nombreEquipoDe(inscripcion.equipo_id)}
            readOnly
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de inscripción"
            type="date"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            required
            autoFocus
          />
          <Select
            label="Estado"
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoInscripcion)}
            options={ESTADOS}
          />
        </div>
      </form>
    </Modal>
  );
}

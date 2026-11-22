"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EstadoPartido,
  PartidoDTO,
  PartidoInput,
} from "@/lib/api/business-partidos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  ESTADO_LABEL,
  equiposHabilitados,
  escenariosDelTorneo,
  faseLabel,
  fromDateTimeInput,
  toDateTimeInput,
  type PartidoCatalogos,
} from "./partido-utils";

interface PartidoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PartidoInput) => void | Promise<void>;
  catalogos: PartidoCatalogos;
  partido?: PartidoDTO;
}

const ESTADOS = (Object.keys(ESTADO_LABEL) as EstadoPartido[]).map((value) => ({
  value,
  label: ESTADO_LABEL[value],
}));

export function PartidoFormModal({
  open,
  onClose,
  onSubmit,
  catalogos,
  partido,
}: PartidoFormModalProps) {
  const [torneoId, setTorneoId] = useState("");
  const [faseId, setFaseId] = useState("");
  const [localId, setLocalId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");
  const [escenarioId, setEscenarioId] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [estado, setEstado] = useState<EstadoPartido>("PROGRAMADO");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fase = catalogos.fases.find(({ id }) => id === partido?.fase_id);
    setTorneoId(partido?.torneo_id ?? fase?.torneo_id ?? "");
    setFaseId(partido?.fase_id ?? "");
    setLocalId(partido?.equipo_local_id ?? "");
    setVisitanteId(partido?.equipo_visitante_id ?? "");
    setEscenarioId(partido?.escenario_id ?? "");
    setFechaHora(partido ? toDateTimeInput(partido.fecha_hora) : "");
    setEstado(partido?.estado ?? "PROGRAMADO");
    setError("");
    setSubmitting(false);
    // Solo se reinicia al abrir; los catálogos pueden llegar después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partido]);

  // Un partido en juego solo admite cambiar su estado (regla de Business).
  // El marcador se calcula con los goles registrados en el detalle (HU-GC-07).
  const soloEstado = partido?.estado === "EN_JUEGO";
  // Al editar: un partido en juego no vuelve a programado y solo uno en juego
  // puede finalizarse. Al registrar se admite cualquier estado.
  const estados = ESTADOS.filter(({ value }) => {
    if (!partido) return true;
    if (soloEstado) return value !== "PROGRAMADO";
    return value !== "FINALIZADO";
  });
  const fase = catalogos.fases.find(({ id }) => id === faseId);

  const torneos = catalogos.torneos.filter(
    (torneo) =>
      torneo.id === torneoId || (torneo.activo && torneo.estado !== "FINALIZADO"),
  );
  const fases = catalogos.fases
    .filter(
      (item) =>
        item.torneo_id === torneoId &&
        (item.id === faseId || item.estado !== "FINALIZADA"),
    )
    .sort((a, b) => a.numero_orden - b.numero_orden);

  const equipos = useMemo(() => {
    const habilitados = equiposHabilitados(catalogos, torneoId, fase);
    // Al editar se conservan los equipos actuales aunque ya no sean elegibles.
    const actuales = catalogos.equipos.filter(
      ({ id }) =>
        (id === partido?.equipo_local_id || id === partido?.equipo_visitante_id) &&
        !habilitados.some((equipo) => equipo.id === id),
    );
    return [...habilitados, ...actuales];
  }, [catalogos, torneoId, fase, partido]);

  const escenarios = escenariosDelTorneo(catalogos, torneoId);
  const nombreEquipo = (id: string) =>
    catalogos.equipos.find((equipo) => equipo.id === id)?.nombre ?? id;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!torneoId || !faseId) {
      setError("Selecciona el torneo y la fase del partido.");
      return;
    }
    if (!localId || !visitanteId) {
      setError("Selecciona el equipo local y el visitante.");
      return;
    }
    if (localId === visitanteId) {
      setError("Un equipo no puede jugar contra sí mismo.");
      return;
    }
    if (!fechaHora || Number.isNaN(new Date(fechaHora).getTime())) {
      setError("Indica la fecha y hora del partido.");
      return;
    }
    const input: PartidoInput = {
      fecha_hora: fromDateTimeInput(fechaHora),
      equipo_local_id: localId,
      equipo_visitante_id: visitanteId,
      fase_id: faseId,
      escenario_id: escenarioId || null,
      estado,
    };
    if (!partido && !escenarioId) delete input.escenario_id;

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(input);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo guardar el partido.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const equipoOptions = (excluir: string) =>
    equipos
      .filter(({ id }) => id !== excluir)
      .map((equipo) => ({ value: equipo.id, label: equipo.nombre }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={partido ? <Pencil /> : <Plus />}
      title={partido ? "Editar partido" : "Registrar partido"}
      description={
        soloEstado
          ? "El partido está en juego: solo puedes actualizar su estado. Los goles se registran en el detalle del partido."
          : "Selecciona la fase, los equipos habilitados y, si ya se conoce, el escenario."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="partido-form" loading={submitting}>
            {partido ? "Guardar cambios" : "Registrar partido"}
          </Button>
        </>
      }
    >
      <form id="partido-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Torneo"
            placeholder={torneos.length ? "Selecciona un torneo" : "No hay torneos disponibles"}
            value={torneoId}
            onChange={(event) => {
              setTorneoId(event.target.value);
              setFaseId("");
              setLocalId("");
              setVisitanteId("");
              setEscenarioId("");
            }}
            options={torneos.map((torneo) => ({ value: torneo.id, label: torneo.nombre }))}
            disabled={soloEstado}
            required
          />
          <Select
            label="Fase"
            placeholder={
              !torneoId
                ? "Primero elige un torneo"
                : fases.length
                  ? "Selecciona una fase"
                  : "El torneo no tiene fases abiertas"
            }
            value={faseId}
            onChange={(event) => {
              setFaseId(event.target.value);
              setLocalId("");
              setVisitanteId("");
            }}
            options={fases.map((item) => ({ value: item.id, label: faseLabel(item) }))}
            disabled={!torneoId || soloEstado}
            required
          />
        </div>

        {faseId && equipos.length < 2 && !soloEstado && (
          <p role="status" className="text-sm text-zinc-500">
            Se necesitan al menos dos equipos activos con inscripción aceptada
            {fase?.tipo === "GRUPOS" ? " y asignados a este grupo" : ""}.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {soloEstado ? (
            <>
              <Input label="Equipo local" value={nombreEquipo(localId)} readOnly />
              <Input label="Equipo visitante" value={nombreEquipo(visitanteId)} readOnly />
            </>
          ) : (
            <>
              <Select
                label="Equipo local"
                placeholder="Selecciona el equipo local"
                value={localId}
                onChange={(event) => setLocalId(event.target.value)}
                options={equipoOptions(visitanteId)}
                disabled={!faseId}
                required
              />
              <Select
                label="Equipo visitante"
                placeholder="Selecciona el equipo visitante"
                value={visitanteId}
                onChange={(event) => setVisitanteId(event.target.value)}
                options={equipoOptions(localId)}
                disabled={!faseId}
                required
              />
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha y hora"
            type="datetime-local"
            value={fechaHora}
            onChange={(event) => setFechaHora(event.target.value)}
            disabled={soloEstado}
            required
          />
          <Select
            label="Escenario (opcional)"
            hint="Solo escenarios asignados al torneo."
            value={escenarioId}
            onChange={(event) => setEscenarioId(event.target.value)}
            options={[
              { value: "", label: "Por definir" },
              ...escenarios.map((escenario) => ({
                value: escenario.id,
                label: escenario.nombre,
              })),
            ]}
            disabled={!torneoId || soloEstado}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Estado"
            hint={
              soloEstado
                ? "Al finalizarlo se envía el resumen a quienes tienen boleta o apuesta."
                : partido
                  ? "Para finalizarlo, primero pásalo a «En juego»."
                  : undefined
            }
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoPartido)}
            options={estados}
          />
          {partido && (
            <Input
              label="Marcador"
              hint="Se calcula con los goles registrados en el detalle del partido."
              value={`${partido.goles_local} - ${partido.goles_visitante}`}
              readOnly
            />
          )}
        </div>
      </form>
    </Modal>
  );
}

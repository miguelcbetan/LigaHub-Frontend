"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EstadoFase,
  FaseDTO,
  FaseInput,
  ModalidadFinal,
  TipoFase,
} from "@/lib/api/business-fases";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface FaseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: FaseInput) => void | Promise<void>;
  fase?: FaseDTO;
  canListTorneos: boolean;
}

const TIPOS: { value: TipoFase; label: string }[] = [
  { value: "GRUPOS", label: "Grupo" },
  { value: "FINAL", label: "Fase final" },
];

const ESTADOS: { value: EstadoFase; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADA", label: "Finalizada" },
];

const MODALIDADES: { value: ModalidadFinal; label: string }[] = [
  { value: "PARTIDO_UNICO", label: "Partido único" },
  { value: "IDA_Y_VUELTA", label: "Ida y vuelta" },
];

function todayAsDateInput() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

function parsePositiveInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

function translatePhaseValidationMessage(message: string): string {
  return message
    .replace(
      /\bcupo_equipos must not be less than 2\b/gi,
      "El grupo debe admitir al menos 2 equipos.",
    )
    .replace(
      /\bcupo_equipos must be an integer number\b/gi,
      "El cupo de equipos debe ser un número entero.",
    );
}

export function FaseFormModal({
  open,
  onClose,
  onSubmit,
  fase,
  canListTorneos,
}: FaseFormModalProps) {
  const [tipo, setTipo] = useState<TipoFase>("GRUPOS");
  const [numeroOrden, setNumeroOrden] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState<EstadoFase>("PENDIENTE");
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [cupoEquipos, setCupoEquipos] = useState("");
  const [numeroPartidos, setNumeroPartidos] = useState("1");
  const [modalidad, setModalidad] = useState<ModalidadFinal>("PARTIDO_UNICO");
  const [torneoId, setTorneoId] = useState("");
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [torneosError, setTorneosError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = todayAsDateInput();
    setTipo(fase?.tipo ?? "GRUPOS");
    setNumeroOrden(fase ? String(fase.numero_orden) : "");
    setFechaInicio(fase?.fecha_inicio ?? today);
    setFechaFin(fase?.fecha_fin ?? today);
    setEstado(fase?.estado ?? "PENDIENTE");
    setNombreGrupo(fase?.nombre ?? "");
    setCupoEquipos(
      fase?.cupo_equipos == null ? "" : String(fase.cupo_equipos),
    );
    setNumeroPartidos(String(fase?.numero_partidos ?? 1));
    setModalidad(fase?.modalidad ?? "PARTIDO_UNICO");
    setTorneoId(fase?.torneo_id ?? "");
    setTorneos([]);
    setTorneosError("");
    setError("");
    setSubmitting(false);

    if (!canListTorneos) {
      setTorneosError("No tienes permiso para consultar los torneos.");
      return;
    }

    let active = true;
    setLoadingTorneos(true);
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
      })
      .finally(() => {
        if (active) setLoadingTorneos(false);
      });

    return () => {
      active = false;
    };
  }, [open, fase, canListTorneos]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const orden = parsePositiveInt(numeroOrden);
    if (orden === null) {
      setError("El número de orden debe ser un entero mayor o igual a 1.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Selecciona la fecha de inicio y la fecha de fin.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    if (!torneos.some(({ id }) => id === torneoId)) {
      setError("Selecciona un torneo registrado.");
      return;
    }

    const input: FaseInput = {
      tipo,
      numero_orden: orden,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado,
      torneo_id: torneoId,
    };

    if (tipo === "GRUPOS") {
      const nombre = nombreGrupo.trim();
      if (!nombre) {
        setError("El nombre del grupo es obligatorio.");
        return;
      }
      if (nombre.length > 100) {
        setError("El nombre del grupo no puede superar los 100 caracteres.");
        return;
      }
      const cupo = parsePositiveInt(cupoEquipos);
      if (cupo === null || cupo < 2) {
        setError("El grupo debe admitir al menos 2 equipos.");
        return;
      }
      input.nombre = nombre;
      input.cupo_equipos = cupo;
    } else {
      const partidos = parsePositiveInt(numeroPartidos);
      if (partidos === null) {
        setError("El número de partidos debe ser un entero mayor o igual a 1.");
        return;
      }
      input.numero_partidos = partidos;
      input.modalidad = modalidad;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(input);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? translatePhaseValidationMessage(caught.message)
          : "No se pudo guardar la fase.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={fase ? <Pencil /> : <Plus />}
      title={fase ? "Editar fase" : "Crear fase"}
      description="Define el tipo, orden, fechas, estado y torneo de la fase."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="fase-form" loading={submitting}>
            {fase ? "Guardar cambios" : "Crear fase"}
          </Button>
        </>
      }
    >
      <form id="fase-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        {torneosError && (
          <p role="alert" className="text-sm text-co-red">
            No se pudieron cargar los torneos: {torneosError}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo de fase"
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoFase)}
            options={TIPOS}
            disabled={!!fase}
          />
          <Input
            label="Número de orden"
            type="number"
            min={1}
            step={1}
            value={numeroOrden}
            onChange={(event) => setNumeroOrden(event.target.value)}
            required
            autoFocus
          />
          <Select
            label="Estado"
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoFase)}
            options={ESTADOS}
          />
          <Input
            label="Fecha de inicio"
            type="date"
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
            required
          />
          <Input
            label="Fecha de fin"
            type="date"
            min={fechaInicio || undefined}
            value={fechaFin}
            onChange={(event) => setFechaFin(event.target.value)}
            required
          />
          {tipo === "GRUPOS" && (
            <>
              <Input
                label="Nombre del grupo"
                placeholder="Grupo A"
                maxLength={100}
                value={nombreGrupo}
                onChange={(event) => setNombreGrupo(event.target.value)}
                required
              />
              <Input
                label="Cupo de equipos"
                type="number"
                min={2}
                step={1}
                value={cupoEquipos}
                onChange={(event) => setCupoEquipos(event.target.value)}
                required
              />
            </>
          )}
          {tipo === "FINAL" && (
            <>
              <Input
                label="Número de partidos"
                type="number"
                min={1}
                step={1}
                value={numeroPartidos}
                onChange={(event) => setNumeroPartidos(event.target.value)}
                required
              />
              <Select
                label="Modalidad"
                value={modalidad}
                onChange={(event) =>
                  setModalidad(event.target.value as ModalidadFinal)
                }
                options={MODALIDADES}
              />
            </>
          )}
        </div>
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
          onChange={(event) => setTorneoId(event.target.value)}
          options={torneos.map((torneo) => ({
            value: torneo.id,
            label: `${torneo.nombre} — ${torneo.id}`,
          }))}
          disabled={loadingTorneos || !!torneosError || torneos.length === 0}
          required
        />
      </form>
    </Modal>
  );
}

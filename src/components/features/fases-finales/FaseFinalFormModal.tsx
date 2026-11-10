"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EstadoFase,
  FaseFinalDTO,
  FaseFinalInput,
  ModalidadFinal,
} from "@/lib/api/business-fases-finales";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface FaseFinalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: FaseFinalInput) => void | Promise<void>;
  faseFinal?: FaseFinalDTO;
}

const ESTADOS: { value: EstadoFase; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADA", label: "Finalizada" },
];

const MODALIDADES: { value: ModalidadFinal; label: string }[] = [
  { value: "PARTIDO_UNICO", label: "Partido único" },
  { value: "IDA_Y_VUELTA", label: "Ida y vuelta" },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function todayAsDateInput() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

/** Entero positivo o `null` si el texto no lo es. */
function parsePositiveInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function FaseFinalFormModal({
  open,
  onClose,
  onSubmit,
  faseFinal,
}: FaseFinalFormModalProps) {
  const [numeroOrden, setNumeroOrden] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState<EstadoFase>("PENDIENTE");
  const [numeroPartidos, setNumeroPartidos] = useState("");
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
    setNumeroOrden(faseFinal ? String(faseFinal.numero_orden) : "");
    setFechaInicio(faseFinal?.fecha_inicio ?? today);
    setFechaFin(faseFinal?.fecha_fin ?? today);
    setEstado(faseFinal?.estado ?? "PENDIENTE");
    setNumeroPartidos(faseFinal ? String(faseFinal.numero_partidos) : "");
    setModalidad(faseFinal?.modalidad ?? "PARTIDO_UNICO");
    setTorneoId(faseFinal?.torneo_id ?? "");
    setTorneos([]);
    setLoadingTorneos(true);
    setTorneosError("");
    setError("");
    setSubmitting(false);

    let active = true;
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
  }, [open, faseFinal]);

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
    const partidos = parsePositiveInt(numeroPartidos);
    if (partidos === null) {
      setError("El número de partidos debe ser un entero mayor o igual a 1.");
      return;
    }
    if (!UUID_PATTERN.test(torneoId) || !torneos.some(({ id }) => id === torneoId)) {
      setError("Selecciona un torneo existente.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        numero_orden: orden,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado,
        torneo_id: torneoId,
        numero_partidos: partidos,
        modalidad,
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la fase final.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={faseFinal ? <Pencil /> : <Plus />}
      title={faseFinal ? "Editar fase final" : "Crear fase final"}
      description="Completa los datos de la fase final que se registrará en Business."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="fase-final-form" loading={submitting}>
            {faseFinal ? "Guardar cambios" : "Crear fase final"}
          </Button>
        </>
      }
    >
      <form
        id="fase-final-form"
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
        <div className="grid gap-4 sm:grid-cols-2">
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
      {torneosError && (
        <p role="alert" className="text-sm text-co-red">
          No se pudieron cargar los torneos: {torneosError}
        </p>
      )}
    </Modal>
  );
}

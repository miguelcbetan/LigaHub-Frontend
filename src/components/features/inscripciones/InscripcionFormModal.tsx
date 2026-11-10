"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EstadoInscripcion,
  InscripcionDTO,
  InscripcionInput,
} from "@/lib/api/business-inscripciones";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface InscripcionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: InscripcionInput) => void | Promise<void>;
  inscripcion?: InscripcionDTO;
}

const ESTADOS: { value: EstadoInscripcion; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "RECHAZADA", label: "Rechazada" },
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

export function InscripcionFormModal({
  open,
  onClose,
  onSubmit,
  inscripcion,
}: InscripcionFormModalProps) {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState<EstadoInscripcion>("PENDIENTE");
  const [equipoId, setEquipoId] = useState("");
  const [torneoId, setTorneoId] = useState("");
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [torneosError, setTorneosError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFecha(inscripcion?.fecha_inscripcion ?? todayAsDateInput());
    setEstado(inscripcion?.estado ?? "PENDIENTE");
    setEquipoId(inscripcion?.equipo_id ?? "");
    setTorneoId(inscripcion?.torneo_id ?? "");
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
  }, [open, inscripcion]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fecha) {
      setError("Selecciona la fecha de inscripción.");
      return;
    }
    if (!UUID_PATTERN.test(equipoId.trim())) {
      setError("Ingresa un UUID válido para el equipo.");
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
        fecha_inscripcion: fecha,
        estado,
        equipo_id: equipoId.trim(),
        torneo_id: torneoId.trim(),
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la inscripción.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={inscripcion ? <Pencil /> : <Plus />}
      title={inscripcion ? "Editar inscripción" : "Crear inscripción"}
      description="Completa los datos de la inscripción que se registrará en Business."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="inscripcion-form" loading={submitting}>
            {inscripcion ? "Guardar cambios" : "Crear inscripción"}
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
            onChange={(event) =>
              setEstado(event.target.value as EstadoInscripcion)
            }
            options={ESTADOS}
          />
        </div>
        <Input
          label="ID del equipo"
          placeholder="UUID del equipo"
          value={equipoId}
          onChange={(event) => setEquipoId(event.target.value)}
          required
        />
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

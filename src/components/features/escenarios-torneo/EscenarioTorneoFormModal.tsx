"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type {
  EscenarioTorneoDTO,
  EscenarioTorneoInput,
  EstadoAsignacionEscenario,
} from "@/lib/api/business-escenarios-torneo";
import { businessTorneosApi, type TorneoDTO } from "@/lib/api/business-torneos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface EscenarioTorneoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: EscenarioTorneoInput) => void | Promise<void>;
  escenarioTorneo?: EscenarioTorneoDTO;
}

const ESTADOS: { value: EstadoAsignacionEscenario; label: string }[] = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
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

export function EscenarioTorneoFormModal({
  open,
  onClose,
  onSubmit,
  escenarioTorneo,
}: EscenarioTorneoFormModalProps) {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState<EstadoAsignacionEscenario>("ACTIVO");
  const [escenarioId, setEscenarioId] = useState("");
  const [torneoId, setTorneoId] = useState("");
  const [torneos, setTorneos] = useState<TorneoDTO[]>([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);
  const [torneosError, setTorneosError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFecha(escenarioTorneo?.fecha_asignacion ?? todayAsDateInput());
    setEstado(escenarioTorneo?.estado ?? "ACTIVO");
    setEscenarioId(escenarioTorneo?.escenario_id ?? "");
    setTorneoId(escenarioTorneo?.torneo_id ?? "");
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
  }, [open, escenarioTorneo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fecha) {
      setError("Selecciona la fecha de asignación.");
      return;
    }
    if (!UUID_PATTERN.test(escenarioId.trim())) {
      setError("Ingresa un UUID válido para el escenario.");
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
        fecha_asignacion: fecha,
        estado,
        escenario_id: escenarioId.trim(),
        torneo_id: torneoId.trim(),
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la asignación del escenario.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={escenarioTorneo ? <Pencil /> : <Plus />}
      title={
        escenarioTorneo
          ? "Editar escenario de torneo"
          : "Asignar escenario a torneo"
      }
      description="Completa los datos de la asignación que se registrará en Business."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="escenario-torneo-form"
            loading={submitting}
          >
            {escenarioTorneo ? "Guardar cambios" : "Asignar escenario"}
          </Button>
        </>
      }
    >
      <form
        id="escenario-torneo-form"
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
            label="Fecha de asignación"
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
              setEstado(event.target.value as EstadoAsignacionEscenario)
            }
            options={ESTADOS}
          />
        </div>
        <Input
          label="ID del escenario"
          placeholder="UUID del escenario"
          value={escenarioId}
          onChange={(event) => setEscenarioId(event.target.value)}
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

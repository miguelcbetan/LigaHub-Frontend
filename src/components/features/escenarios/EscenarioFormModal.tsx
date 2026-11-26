"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { EscenarioDTO, EscenarioInput } from "@/lib/api/business-escenarios";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  ESCENARIO_DIRECCION_MAX,
  ESCENARIO_NOMBRE_MAX,
  esEnteroPositivo,
  mensajeDeError,
  opcionesDePadre,
} from "./escenario-utils";

interface EscenarioFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: EscenarioInput) => void | Promise<void>;
  /** Escenario a editar; sin él, el modal crea uno nuevo. */
  escenario?: EscenarioDTO;
  /** Escenarios existentes, para elegir el escenario padre. */
  escenarios: EscenarioDTO[];
}

interface Errores {
  nombre?: string;
  direccion?: string;
  capacidad?: string;
}

const SIN_PADRE = "";

export function EscenarioFormModal({
  open,
  onClose,
  onSubmit,
  escenario,
  escenarios,
}: EscenarioFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [padreId, setPadreId] = useState(SIN_PADRE);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(escenario?.nombre ?? "");
    setDireccion(escenario?.direccion ?? "");
    setCapacidad(escenario ? String(escenario.capacidad) : "");
    setPadreId(escenario?.escenario_padre_id ?? SIN_PADRE);
    setErrores({});
    setError("");
    setSubmitting(false);
  }, [open, escenario]);

  const opcionesPadre = useMemo(
    () => [
      { value: SIN_PADRE, label: "Sin escenario padre" },
      ...opcionesDePadre(escenarios, escenario?.id).map((item) => ({
        value: item.id,
        label: item.nombre,
      })),
    ],
    [escenarios, escenario],
  );

  const validar = (): Errores => {
    const encontrados: Errores = {};
    if (!nombre.trim()) encontrados.nombre = "Ingresa el nombre del escenario.";
    if (!direccion.trim()) encontrados.direccion = "Ingresa la dirección del escenario.";
    if (!esEnteroPositivo(capacidad)) {
      encontrados.capacidad = "La capacidad debe ser un número entero mayor o igual a 1.";
    }
    return encontrados;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const encontrados = validar();
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    const input: EscenarioInput = {
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      capacidad: Number(capacidad),
    };
    if (padreId) input.escenario_padre_id = padreId;
    // En edición, quitar el padre se envía como null; al crear basta con omitirlo.
    else if (escenario?.escenario_padre_id) input.escenario_padre_id = null;

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(input);
      onClose();
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo guardar el escenario."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={escenario ? <Pencil /> : <Plus />}
      title={escenario ? "Editar escenario" : "Crear escenario"}
      description="Lugar donde se juegan los partidos. Puede pertenecer a otro escenario, como una cancha dentro de un complejo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="escenario-form" loading={submitting}>
            {escenario ? "Guardar cambios" : "Crear escenario"}
          </Button>
        </>
      }
    >
      <form id="escenario-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        <Input
          label="Nombre"
          placeholder="Ej. Estadio Metropolitano"
          value={nombre}
          maxLength={ESCENARIO_NOMBRE_MAX}
          onChange={(event) => setNombre(event.target.value)}
          error={errores.nombre}
          required
          autoFocus
        />
        <Input
          label="Dirección"
          placeholder="Ej. Calle 45 # 12-30"
          value={direccion}
          maxLength={ESCENARIO_DIRECCION_MAX}
          onChange={(event) => setDireccion(event.target.value)}
          error={errores.direccion}
          required
        />
        <Input
          label="Capacidad"
          type="number"
          min={1}
          step={1}
          value={capacidad}
          onChange={(event) => setCapacidad(event.target.value)}
          error={errores.capacidad}
          required
        />
        <Select
          label="Escenario padre"
          value={padreId}
          onChange={(event) => setPadreId(event.target.value)}
          options={opcionesPadre}
          hint={escenario ? "No se ofrecen el propio escenario ni sus subescenarios." : undefined}
        />
      </form>
    </Modal>
  );
}

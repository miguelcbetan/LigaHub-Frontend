"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { EstadoTorneo, TorneoDTO, TorneoInput } from "@/lib/api/business-torneos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";

interface TorneoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TorneoInput) => void | Promise<void>;
  torneo?: TorneoDTO;
}

const ESTADOS: { value: EstadoTorneo; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TorneoFormModal({ open, onClose, onSubmit, torneo }: TorneoFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<EstadoTorneo>("PENDIENTE");
  const [maxEquipos, setMaxEquipos] = useState("8");
  const [deporteId, setDeporteId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(torneo?.nombre ?? "");
    setDescripcion(torneo?.descripcion ?? "");
    setEstado(torneo?.estado ?? "PENDIENTE");
    setMaxEquipos(String(torneo?.max_equipos ?? 8));
    setDeporteId(torneo?.deporte_id ?? "");
    setError("");
    setSubmitting(false);
  }, [open, torneo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const maxEquiposValue = Number(maxEquipos);

    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completa el nombre y la descripción del torneo.");
      return;
    }
    if (!Number.isInteger(maxEquiposValue) || maxEquiposValue < 1) {
      setError("El máximo de equipos debe ser un número entero mayor que cero.");
      return;
    }
    if (!UUID_PATTERN.test(deporteId.trim())) {
      setError("Ingresa un UUID válido para el deporte.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        estado,
        max_equipos: maxEquiposValue,
        deporte_id: deporteId.trim(),
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el torneo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={torneo ? <Pencil /> : <Plus />}
      title={torneo ? "Editar torneo" : "Crear torneo"}
      description="Completa los datos del torneo que se registrará en Business."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="torneo-form" loading={submitting}>
            {torneo ? "Guardar cambios" : "Crear torneo"}
          </Button>
        </>
      }
    >
      <form id="torneo-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          placeholder="Ej. Torneo Apertura"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Descripción"
          placeholder="Describe el torneo"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          required
          rows={3}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Estado"
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoTorneo)}
            options={ESTADOS}
          />
          <Input
            label="Máximo de equipos"
            type="number"
            min={1}
            step={1}
            value={maxEquipos}
            onChange={(event) => setMaxEquipos(event.target.value)}
            required
          />
        </div>
        <Input
          label="ID del deporte"
          placeholder="UUID del deporte"
          value={deporteId}
          onChange={(event) => setDeporteId(event.target.value)}
          required
        />
      </form>
    </Modal>
  );
}

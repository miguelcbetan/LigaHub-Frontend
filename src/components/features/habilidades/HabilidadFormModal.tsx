"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { HabilidadDTO, HabilidadInput } from "@/lib/api/business-habilidades";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

interface HabilidadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: HabilidadInput) => void | Promise<void>;
  habilidad?: HabilidadDTO;
}

const NOMBRE_MAX = 150;
const DESCRIPCION_MAX = 16383;

function mensajeDeError(caught: unknown): string {
  if (caught instanceof BusinessApiError && caught.status === 409) {
    return "Ya existe una habilidad con ese nombre.";
  }
  return caught instanceof Error ? caught.message : "No se pudo guardar la habilidad.";
}

export function HabilidadFormModal({
  open,
  onClose,
  onSubmit,
  habilidad,
}: HabilidadFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(habilidad?.nombre ?? "");
    setDescripcion(habilidad?.descripcion ?? "");
    setError("");
    setSubmitting(false);
  }, [open, habilidad]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completa el nombre y la descripción de la habilidad.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      onClose();
    } catch (caught) {
      setError(mensajeDeError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={habilidad ? <Pencil /> : <Plus />}
      title={habilidad ? "Editar habilidad" : "Crear habilidad"}
      description="Define las capacidades que se pueden asignar a los jugadores."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="habilidad-form" loading={submitting}>
            {habilidad ? "Guardar cambios" : "Crear habilidad"}
          </Button>
        </>
      }
    >
      <form id="habilidad-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          placeholder="Ej. Velocidad"
          value={nombre}
          maxLength={NOMBRE_MAX}
          onChange={(event) => setNombre(event.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Descripción"
          placeholder="Describe la habilidad"
          value={descripcion}
          maxLength={DESCRIPCION_MAX}
          onChange={(event) => setDescripcion(event.target.value)}
          required
          rows={3}
        />
      </form>
    </Modal>
  );
}

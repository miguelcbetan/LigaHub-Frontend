"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { DeporteDTO, DeporteInput } from "@/lib/api/business-deportes";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";

interface DeporteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DeporteInput) => void | Promise<void>;
  deporte?: DeporteDTO;
  deportes: DeporteDTO[];
}

const NOMBRE_MAX = 150;

export function DeporteFormModal({
  open,
  onClose,
  onSubmit,
  deporte,
  deportes,
}: DeporteFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [padreId, setPadreId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(deporte?.nombre ?? "");
    setDescripcion(deporte?.descripcion ?? "");
    setPadreId(deporte?.deporte_padre_id ?? "");
    setError("");
    setSubmitting(false);
  }, [open, deporte]);

  const padres = deportes.filter(({ id }) => id !== deporte?.id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completa el nombre y la descripción del deporte.");
      return;
    }
    if (nombre.trim().length > NOMBRE_MAX) {
      setError(`El nombre no puede superar ${NOMBRE_MAX} caracteres.`);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        deporte_padre_id: padreId || null,
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo guardar el deporte.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={deporte ? <Pencil /> : <Plus />}
      title={deporte ? "Editar deporte" : "Crear deporte"}
      description="Registra los deportes disponibles para los torneos."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="deporte-form" loading={submitting}>
            {deporte ? "Guardar cambios" : "Crear deporte"}
          </Button>
        </>
      }
    >
      <form id="deporte-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          placeholder="Ej. Fútbol"
          value={nombre}
          maxLength={NOMBRE_MAX}
          onChange={(event) => setNombre(event.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Descripción"
          placeholder="Describe el deporte"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          required
          rows={3}
        />
        <Select
          label="Deporte padre"
          value={padreId}
          onChange={(event) => setPadreId(event.target.value)}
          options={[
            { value: "", label: "Sin deporte padre" },
            ...padres.map(({ id, nombre: nombrePadre }) => ({
              value: id,
              label: nombrePadre,
            })),
          ]}
        />
      </form>
    </Modal>
  );
}

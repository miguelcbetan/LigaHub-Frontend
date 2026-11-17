"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { EquipoDTO, EquipoInput } from "@/lib/api/business-equipos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface EquipoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: EquipoInput) => void | Promise<void>;
  equipo?: EquipoDTO;
}

const NOMBRE_MAX = 150;

export function EquipoFormModal({
  open,
  onClose,
  onSubmit,
  equipo,
}: EquipoFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(equipo?.nombre ?? "");
    setNombreError("");
    setError("");
    setSubmitting(false);
  }, [open, equipo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const value = nombre.trim();
    if (!value) {
      setNombreError("El nombre del equipo es obligatorio.");
      return;
    }
    if (value.length > NOMBRE_MAX) {
      setNombreError(`El nombre no puede superar ${NOMBRE_MAX} caracteres.`);
      return;
    }

    setNombreError("");
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ nombre: value });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo guardar el equipo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={equipo ? <Pencil /> : <Plus />}
      title={equipo ? "Editar equipo" : "Registrar equipo"}
      description="Los campos marcados con * son obligatorios."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="equipo-form" loading={submitting}>
            {equipo ? "Guardar cambios" : "Registrar equipo"}
          </Button>
        </>
      }
    >
      <form id="equipo-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          label="Nombre *"
          placeholder="Ej. Tigres FC"
          value={nombre}
          maxLength={NOMBRE_MAX}
          onChange={(event) => setNombre(event.target.value)}
          error={nombreError}
          hint={`${nombre.trim().length}/${NOMBRE_MAX} caracteres`}
          required
          autoFocus
        />
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { DeporteDTO } from "@/lib/api/business-deportes";
import type { EstadoTorneo, TorneoDTO, TorneoInput } from "@/lib/api/business-torneos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";

interface TorneoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TorneoInput) => void | Promise<void>;
  torneo?: TorneoDTO;
  deportes: DeporteDTO[];
  loadingDeportes: boolean;
  deportesError: string;
}

const ESTADOS: { value: EstadoTorneo; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

export function TorneoFormModal({
  open,
  onClose,
  onSubmit,
  torneo,
  deportes,
  loadingDeportes,
  deportesError,
}: TorneoFormModalProps) {
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
    if (!deportes.some(({ id }) => id === deporteId)) {
      setError("Selecciona un deporte registrado.");
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
        deporte_id: deporteId,
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
        <Select
          label="Deporte"
          placeholder={
            loadingDeportes
              ? "Cargando deportes…"
              : deportes.length
                ? "Selecciona un deporte"
                : "No hay deportes registrados"
          }
          value={deporteId}
          onChange={(event) => setDeporteId(event.target.value)}
          options={deportes.map((deporte) => ({
            value: deporte.id,
            label: deporte.nombre,
          }))}
          disabled={loadingDeportes || !!deportesError || deportes.length === 0}
          required
        />
        {deportesError && (
          <p role="alert" className="text-sm text-co-red">
            No se pudieron cargar los deportes: {deportesError}
          </p>
        )}
      </form>
    </Modal>
  );
}

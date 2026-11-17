"use client";

import { useEffect, useState } from "react";
import { UserMinus } from "lucide-react";
import { hoyComoFecha, type EquipoJugadorDTO } from "@/lib/api/business-equipo-jugador";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface RetirarJugadorDialogProps {
  contrato: EquipoJugadorDTO | null;
  nombreJugador: string;
  nombreEquipo: string;
  onClose: () => void;
  onConfirm: (fechaFin: string) => Promise<void>;
}

/** Confirma el retiro de un jugador pidiendo su fecha de salida. */
export function RetirarJugadorDialog({
  contrato,
  nombreJugador,
  nombreEquipo,
  onClose,
  onConfirm,
}: RetirarJugadorDialogProps) {
  const [fechaFin, setFechaFin] = useState("");
  const [fechaError, setFechaError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!contrato) return;
    const hoy = hoyComoFecha();
    setFechaFin(hoy < contrato.fecha_inicio ? contrato.fecha_inicio : hoy);
    setFechaError("");
    setError("");
    setSubmitting(false);
  }, [contrato]);

  const confirmar = async () => {
    if (!contrato || submitting) return;
    if (!fechaFin) {
      setFechaError("La fecha de salida es obligatoria.");
      return;
    }
    if (fechaFin < contrato.fecha_inicio) {
      setFechaError("La fecha de salida no puede ser anterior al inicio del contrato.");
      return;
    }
    setFechaError("");
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(fechaFin);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo retirar al jugador.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={contrato !== null}
      onClose={onClose}
      size="sm"
      icon={<UserMinus className="text-co-red" />}
      title="Retirar jugador"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" loading={submitting} onClick={() => void confirmar()}>
            Retirar del equipo
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          ¿Retirar a <strong>{nombreJugador}</strong> de <strong>{nombreEquipo}</strong>? El
          contrato se conserva en el historial y el jugador queda disponible para otros equipos.
        </p>
        <Input
          type="date"
          label="Fecha de salida *"
          value={fechaFin}
          min={contrato?.fecha_inicio}
          onChange={(event) => setFechaFin(event.target.value)}
          error={fechaError}
          required
        />
        {error && (
          <p role="alert" className="text-co-red">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

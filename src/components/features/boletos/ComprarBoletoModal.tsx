"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Ticket, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { PartidoDisponibleDTO } from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { cn } from "@/utils/cn";
import { etiquetaPartido, formatearPesos, mensajeDeError } from "./boleto-utils";

interface ComprarBoletoModalProps {
  open: boolean;
  onClose: () => void;
  partidos: PartidoDisponibleDTO[];
  onComprar: (input: { partido_id: string; localidad_id: string }) => Promise<void>;
  /** Se invoca si la localidad se agotó (409) para refrescar el cupo. */
  onAgotada: () => void | Promise<void>;
}

export function ComprarBoletoModal({
  open,
  onClose,
  partidos,
  onComprar,
  onAgotada,
}: ComprarBoletoModalProps) {
  const [partidoId, setPartidoId] = useState("");
  const [localidadId, setLocalidadId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Solo se venden boletos de partidos con escenario y localidades.
  const conEscenario = useMemo(
    () => partidos.filter((partido) => partido.localidades.length > 0),
    [partidos],
  );
  const partido = conEscenario.find((item) => item.id === partidoId);
  const localidad = partido?.localidades.find((item) => item.id === localidadId);

  useEffect(() => {
    if (!open) return;
    setPartidoId("");
    setLocalidadId("");
    setError("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!partido || !localidad) {
      setError("Elige un partido y una localidad con cupo.");
      return;
    }
    if (localidad.disponibles <= 0) {
      setError(`La localidad "${localidad.nombre}" está agotada.`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onComprar({ partido_id: partido.id, localidad_id: localidad.id });
      onClose();
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo comprar el boleto."));
      if (caught instanceof BusinessApiError && caught.status === 409) {
        setLocalidadId("");
        await onAgotada();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Ticket />}
      size="lg"
      title="Comprar boleto"
      description="Elige un partido programado y la localidad. El precio es el de la localidad."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="comprar-boleto-form"
            loading={submitting}
            disabled={!localidad || localidad.disponibles <= 0}
          >
            {localidad ? `Comprar por ${formatearPesos(localidad.precio)}` : "Comprar"}
          </Button>
        </>
      }
    >
      <form id="comprar-boleto-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        {conEscenario.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay partidos programados con boletería disponible.
          </p>
        ) : (
          <Select
            label="Partido"
            placeholder="Selecciona el partido"
            value={partidoId}
            onChange={(event) => {
              setPartidoId(event.target.value);
              setLocalidadId("");
              setError("");
            }}
            options={conEscenario.map((item) => ({
              value: item.id,
              label: `${etiquetaPartido(item)} · ${item.escenario_nombre ?? ""}`,
            }))}
          />
        )}

        {partido && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Localidad
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {partido.localidades.map((item) => {
                const agotada = item.disponibles <= 0;
                const elegida = item.id === localidadId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={agotada}
                    aria-pressed={elegida}
                    onClick={() => {
                      setLocalidadId(item.id);
                      setError("");
                    }}
                    className={cn(
                      "rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      elegida
                        ? "border-co-blue bg-co-blue/5 dark:border-co-yellow dark:bg-co-yellow/10"
                        : "border-zinc-200 hover:border-co-blue/50 dark:border-zinc-800",
                    )}
                  >
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      {item.nombre}
                    </span>
                    <span className="block text-zinc-500">
                      {formatearPesos(item.precio)} ·{" "}
                      {agotada ? "Agotada" : `Quedan ${item.disponibles}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </form>
    </Modal>
  );
}

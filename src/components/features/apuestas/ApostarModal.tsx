"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Dices, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type {
  MiApuestaInput,
  MiMetodoPagoDTO,
  PartidoDisponibleDTO,
  Pronostico,
} from "@/lib/api/business-aficionados";
import {
  etiquetaPartido,
  formatearPesos,
  mensajeDeError,
} from "@/components/features/boletos/boleto-utils";
import { cn } from "@/utils/cn";
import {
  PRONOSTICOS,
  PRONOSTICO_LABEL,
  esMontoValido,
  gananciaPotencial,
} from "./apuesta-utils";

interface ApostarModalProps {
  open: boolean;
  onClose: () => void;
  partidos: PartidoDisponibleDTO[];
  /** Métodos del aficionado; solo se ofrecen los activos. */
  metodos: MiMetodoPagoDTO[];
  onApostar: (input: MiApuestaInput) => Promise<void>;
}

interface Errores {
  partido?: string;
  pronostico?: string;
  monto?: string;
  metodo?: string;
}

export function ApostarModal({ open, onClose, partidos, metodos, onApostar }: ApostarModalProps) {
  const activos = useMemo(() => metodos.filter((metodo) => metodo.estado === "ACTIVO"), [metodos]);
  const [partidoId, setPartidoId] = useState("");
  const [pronostico, setPronostico] = useState<Pronostico | "">("");
  const [monto, setMonto] = useState("");
  const [metodoId, setMetodoId] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPartidoId("");
    setPronostico("");
    setMonto("");
    setMetodoId(activos.find((metodo) => metodo.predeterminado)?.id ?? activos[0]?.id ?? "");
    setErrores({});
    setError("");
    setSubmitting(false);
  }, [open, activos]);

  const partido = partidos.find((item) => item.id === partidoId);
  const cuota = partido && pronostico ? partido.cuotas[pronostico] : undefined;
  const ganancia =
    cuota !== undefined && esMontoValido(monto) ? gananciaPotencial(Number(monto), cuota) : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const encontrados: Errores = {};
    if (!partido) encontrados.partido = "Elige el partido.";
    if (!pronostico) encontrados.pronostico = "Elige tu pronóstico.";
    if (!esMontoValido(monto)) encontrados.monto = "El monto debe ser mayor que 0 y tener máximo 2 decimales.";
    if (!metodoId) encontrados.metodo = "Elige un método de pago activo.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length || !partido || !pronostico) return;

    setError("");
    setSubmitting(true);
    try {
      await onApostar({
        partido_id: partido.id,
        pronostico,
        monto: Number(monto),
        metodo_pago_aficionado_id: metodoId,
      });
      onClose();
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo registrar la apuesta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Dices />}
      size="lg"
      title="Nueva apuesta"
      description="La cuota la fija la liga según tu pronóstico."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="apostar-form" loading={submitting}>
            Apostar
          </Button>
        </>
      }
    >
      <form id="apostar-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        <Select
          label="Partido"
          placeholder={partidos.length ? "Selecciona el partido" : "No hay partidos programados"}
          value={partidoId}
          onChange={(event) => setPartidoId(event.target.value)}
          options={partidos.map((item) => ({ value: item.id, label: etiquetaPartido(item) }))}
          error={errores.partido}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Pronóstico</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRONOSTICOS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                aria-pressed={pronostico === opcion}
                onClick={() => setPronostico(opcion)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  pronostico === opcion
                    ? "border-co-blue bg-co-blue/5 dark:border-co-yellow dark:bg-co-yellow/10"
                    : "border-zinc-200 hover:border-co-blue/50 dark:border-zinc-800",
                )}
              >
                <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                  {PRONOSTICO_LABEL[opcion]}
                </span>
                <span className="block text-zinc-500">
                  Cuota {partido ? partido.cuotas[opcion].toFixed(2) : "—"}
                </span>
              </button>
            ))}
          </div>
          {errores.pronostico && <p className="mt-1.5 text-xs text-co-red">{errores.pronostico}</p>}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Monto"
            type="number"
            min={0}
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            error={errores.monto}
          />
          <Select
            label="Método de pago"
            placeholder={activos.length ? "Selecciona el método" : "No tienes métodos activos"}
            value={metodoId}
            onChange={(event) => setMetodoId(event.target.value)}
            options={activos.map((metodo) => ({
              value: metodo.id,
              label: `${metodo.metodo_pago_nombre} · ${metodo.referencia}`,
            }))}
            error={errores.metodo}
          />
        </div>
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Ganancia potencial:{" "}
          <strong>{ganancia !== undefined ? formatearPesos(ganancia) : "—"}</strong>
        </p>
      </form>
    </Modal>
  );
}

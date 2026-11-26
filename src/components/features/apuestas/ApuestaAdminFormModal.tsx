"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { etiquetaPartido, mensajeDeError } from "@/components/features/boletos/boleto-utils";
import type { Pronostico } from "@/lib/api/business-aficionados";
import type { ApuestaInput } from "@/lib/api/business-apuestas";
import type {
  AficionadoSelectorDTO,
  MetodoPagoAficionadoDTO,
} from "@/lib/api/business-metodos-pago-aficionado";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import {
  CUOTAS_POR_DEFECTO,
  PRONOSTICOS,
  PRONOSTICO_LABEL,
  esMontoValido,
} from "./apuesta-utils";

interface ApuestaAdminFormModalProps {
  open: boolean;
  onClose: () => void;
  aficionados: AficionadoSelectorDTO[];
  partidos: PartidoDTO[];
  metodos: MetodoPagoAficionadoDTO[];
  onSubmit: (input: ApuestaInput) => Promise<void>;
}

interface Errores {
  aficionado?: string;
  partido?: string;
  monto?: string;
  cuota?: string;
  metodo?: string;
}

/** Cuota ≥ 1 con hasta 2 decimales, como exige el servidor. */
const esCuotaValida = (valor: string) =>
  /^\d+(\.\d{1,2})?$/.test(valor.trim()) && Number(valor) >= 1;

export function ApuestaAdminFormModal({
  open,
  onClose,
  aficionados,
  partidos,
  metodos,
  onSubmit,
}: ApuestaAdminFormModalProps) {
  const [aficionadoId, setAficionadoId] = useState("");
  const [partidoId, setPartidoId] = useState("");
  const [pronostico, setPronostico] = useState<Pronostico>("LOCAL");
  const [monto, setMonto] = useState("");
  const [cuota, setCuota] = useState(String(CUOTAS_POR_DEFECTO.LOCAL));
  const [metodoId, setMetodoId] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Solo se apuesta a partidos programados (regla del servidor).
  const programados = useMemo(() => partidos.filter((p) => p.estado === "PROGRAMADO"), [partidos]);
  const metodosDelAficionado = useMemo(
    () => metodos.filter((m) => m.aficionado_id === aficionadoId && m.estado === "ACTIVO"),
    [metodos, aficionadoId],
  );

  useEffect(() => {
    if (!open) return;
    setAficionadoId("");
    setPartidoId("");
    setPronostico("LOCAL");
    setMonto("");
    setCuota(String(CUOTAS_POR_DEFECTO.LOCAL));
    setMetodoId("");
    setErrores({});
    setError("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const encontrados: Errores = {};
    if (!aficionadoId) encontrados.aficionado = "Elige el aficionado.";
    if (!partidoId) encontrados.partido = "Elige un partido programado.";
    if (!esMontoValido(monto)) encontrados.monto = "Debe ser mayor que 0 y tener máximo 2 decimales.";
    if (!esCuotaValida(cuota)) encontrados.cuota = "Debe ser mayor o igual a 1 y tener máximo 2 decimales.";
    if (!metodoId) encontrados.metodo = "Elige un método de pago activo del aficionado.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        aficionado_id: aficionadoId,
        partido_id: partidoId,
        metodo_pago_aficionado_id: metodoId,
        pronostico,
        monto: Number(monto),
        cuota: Number(cuota),
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
      icon={<Plus />}
      title="Registrar apuesta"
      description="La apuesta queda pendiente. La cuota propuesta es la de la tabla de la liga."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="apuesta-admin-form" loading={submitting}>
            Registrar apuesta
          </Button>
        </>
      }
    >
      <form id="apuesta-admin-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          label="Aficionado"
          placeholder="Selecciona el aficionado"
          value={aficionadoId}
          onChange={(event) => {
            setAficionadoId(event.target.value);
            setMetodoId("");
          }}
          options={aficionados.map((a) => ({ value: a.id, label: `${a.nombre} · ${a.documento}` }))}
          error={errores.aficionado}
        />
        <Select
          label="Partido"
          placeholder="Selecciona el partido"
          value={partidoId}
          onChange={(event) => setPartidoId(event.target.value)}
          options={programados.map((p) => ({ value: p.id, label: etiquetaPartido(p) }))}
          error={errores.partido}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Pronóstico"
            value={pronostico}
            onChange={(event) => {
              const elegido = event.target.value as Pronostico;
              setPronostico(elegido);
              setCuota(String(CUOTAS_POR_DEFECTO[elegido]));
            }}
            options={PRONOSTICOS.map((p) => ({ value: p, label: PRONOSTICO_LABEL[p] }))}
          />
          <Input
            label="Cuota"
            type="number"
            min={1}
            step="0.01"
            value={cuota}
            onChange={(event) => setCuota(event.target.value)}
            error={errores.cuota}
          />
          <Input
            label="Monto"
            type="number"
            min={0}
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            error={errores.monto}
          />
        </div>
        <Select
          label="Método de pago"
          placeholder={
            !aficionadoId
              ? "Primero elige el aficionado"
              : metodosDelAficionado.length
                ? "Selecciona el método"
                : "El aficionado no tiene métodos activos"
          }
          value={metodoId}
          disabled={!aficionadoId}
          onChange={(event) => setMetodoId(event.target.value)}
          options={metodosDelAficionado.map((m) => ({ value: m.id, label: m.referencia }))}
          error={errores.metodo}
        />
      </form>
    </Modal>
  );
}

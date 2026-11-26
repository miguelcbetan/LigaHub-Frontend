"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { esPrecioValido } from "@/components/features/escenarios/escenario-utils";
import type { BoletaInput } from "@/lib/api/business-boletas";
import type { LocalidadDTO } from "@/lib/api/business-localidades";
import type { AficionadoSelectorDTO } from "@/lib/api/business-metodos-pago-aficionado";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import { etiquetaPartido, formatearPesos, mensajeDeError } from "./boleto-utils";

interface BoletoAdminFormModalProps {
  open: boolean;
  onClose: () => void;
  aficionados: AficionadoSelectorDTO[];
  partidos: PartidoDTO[];
  localidades: LocalidadDTO[];
  onSubmit: (input: BoletaInput) => Promise<void>;
}

interface Errores {
  aficionado?: string;
  partido?: string;
  localidad?: string;
  precio?: string;
}

export function BoletoAdminFormModal({
  open,
  onClose,
  aficionados,
  partidos,
  localidades,
  onSubmit,
}: BoletoAdminFormModalProps) {
  const [aficionadoId, setAficionadoId] = useState("");
  const [partidoId, setPartidoId] = useState("");
  const [localidadId, setLocalidadId] = useState("");
  const [precio, setPrecio] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Solo se venden boletas de partidos con escenario asignado.
  const conEscenario = useMemo(() => partidos.filter((p) => p.escenario_id), [partidos]);
  const partido = conEscenario.find((p) => p.id === partidoId);
  const delEscenario = useMemo(
    () => localidades.filter((l) => partido && l.escenario_id === partido.escenario_id),
    [localidades, partido],
  );
  const localidad = delEscenario.find((l) => l.id === localidadId);

  useEffect(() => {
    if (!open) return;
    setAficionadoId("");
    setPartidoId("");
    setLocalidadId("");
    setPrecio("");
    setErrores({});
    setError("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const encontrados: Errores = {};
    if (!aficionadoId) encontrados.aficionado = "Elige el aficionado.";
    if (!partido) encontrados.partido = "Elige un partido con escenario.";
    if (!localidad) encontrados.localidad = "Elige una localidad del escenario del partido.";
    if (precio.trim() && !esPrecioValido(precio)) {
      encontrados.precio = "Debe ser mayor o igual a 0 y tener máximo 2 decimales.";
    }
    setErrores(encontrados);
    if (Object.keys(encontrados).length || !partido || !localidad) return;

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        aficionado_id: aficionadoId,
        partido_id: partido.id,
        localidad_id: localidad.id,
        ...(precio.trim() ? { precio: Number(precio) } : {}),
      });
      onClose();
    } catch (caught) {
      setError(mensajeDeError(caught, "No se pudo registrar la boleta."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Plus />}
      title="Registrar boleta"
      description="La boleta queda activa. Se respeta el cupo de la localidad para el partido."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="boleta-admin-form" loading={submitting}>
            Registrar boleta
          </Button>
        </>
      }
    >
      <form id="boleta-admin-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          onChange={(event) => setAficionadoId(event.target.value)}
          options={aficionados.map((a) => ({ value: a.id, label: `${a.nombre} · ${a.documento}` }))}
          error={errores.aficionado}
        />
        <Select
          label="Partido"
          placeholder="Selecciona el partido"
          value={partidoId}
          onChange={(event) => {
            setPartidoId(event.target.value);
            setLocalidadId("");
          }}
          options={conEscenario.map((p) => ({
            value: p.id,
            label: `${etiquetaPartido(p)} · ${p.escenario_nombre ?? ""}`,
          }))}
          error={errores.partido}
        />
        <Select
          label="Localidad"
          placeholder={partido ? "Selecciona la localidad" : "Primero elige el partido"}
          value={localidadId}
          disabled={!partido}
          onChange={(event) => setLocalidadId(event.target.value)}
          options={delEscenario.map((l) => ({
            value: l.id,
            label: `${l.nombre} · ${formatearPesos(l.precio)}`,
          }))}
          error={errores.localidad}
        />
        <Input
          label="Precio (opcional)"
          type="number"
          min={0}
          step="0.01"
          value={precio}
          placeholder={localidad ? String(localidad.precio) : "Precio de la localidad"}
          onChange={(event) => setPrecio(event.target.value)}
          hint="Si lo dejas vacío se usa el precio de la localidad."
          error={errores.precio}
        />
      </form>
    </Modal>
  );
}

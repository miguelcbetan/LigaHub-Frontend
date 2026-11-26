"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type {
  EstadoMetodoPago,
  MetodoPagoDisponibleDTO,
  MiMetodoPagoDTO,
  MiMetodoPagoInput,
  MiMetodoPagoUpdate,
} from "@/lib/api/business-aficionados";
import { ESTADOS_METODO, MAX_REFERENCIA, TIPO_METODO_LABEL, validarReferencia } from "./metodo-pago-utils";

type Props = {
  open: boolean;
  onClose: () => void;
} & (
  | { registro?: undefined; catalogo: MetodoPagoDisponibleDTO[]; onSave: (input: MiMetodoPagoInput) => Promise<void> }
  | { registro: MiMetodoPagoDTO; onSave: (input: MiMetodoPagoUpdate) => Promise<void> }
);

export function MiMetodoPagoFormModal(props: Props) {
  if (!props.open) return null;
  return <Formulario key={props.registro?.id ?? "alta"} {...props} />;
}

function Formulario(props: Props) {
  const { onClose, registro } = props;
  const formId = useId();
  const [metodoId, setMetodoId] = useState("");
  const [referencia, setReferencia] = useState(registro?.referencia ?? "");
  const [predeterminado, setPredeterminado] = useState(registro?.predeterminado ?? false);
  const [estado, setEstado] = useState<EstadoMetodoPago>(registro?.estado ?? "ACTIVO");
  const [errorReferencia, setErrorReferencia] = useState<string>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const catalogo = props.registro ? [] : props.catalogo;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const errorCampo = validarReferencia(referencia);
    setErrorReferencia(errorCampo);
    setError(undefined);
    if (errorCampo || (!props.registro && !catalogo.some(({ id }) => id === metodoId))) return;
    setSaving(true);
    const datos = { referencia: referencia.trim(), predeterminado };
    try {
      if (props.registro) {
        await props.onSave({ ...datos, estado });
      } else {
        await props.onSave({ ...datos, metodo_pago_id: metodoId });
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el método de pago.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={props.open}
      onClose={() => { if (!saving) onClose(); }}
      title={registro ? "Editar método de pago" : "Registrar método de pago"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} loading={saving} disabled={!registro && !metodoId}>
            Guardar
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={submit}>
        {!registro && (
          <Select
            label="Método de pago"
            placeholder="Selecciona un método"
            options={catalogo.map(({ id, nombre, tipo }) => ({
              value: id, label: nombre + " · " + TIPO_METODO_LABEL[tipo],
            }))}
            hint={catalogo.length === 0 ? "No hay métodos de pago activos disponibles." : undefined}
            value={metodoId}
            onChange={(event) => setMetodoId(event.target.value)}
            disabled={saving || catalogo.length === 0}
            required
          />
        )}
        <Input
          label="Referencia enmascarada"
          placeholder="**** 4242"
          value={referencia}
          maxLength={MAX_REFERENCIA}
          error={errorReferencia}
          onChange={(event) => setReferencia(event.target.value)}
          disabled={saving}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={predeterminado}
            onChange={(event) => setPredeterminado(event.target.checked)}
            disabled={saving}
          />
          Predeterminado
        </label>
        {registro && (
          <Select
            label="Estado"
            options={ESTADOS_METODO}
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoMetodoPago)}
            disabled={saving}
          />
        )}
        {error && <p role="alert" className="text-sm text-co-red">{error}</p>}
      </form>
    </Modal>
  );
}

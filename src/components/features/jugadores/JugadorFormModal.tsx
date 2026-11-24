"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
import type { UserResponseDTO } from "@/lib/api/types";
import type { JugadorDTO, JugadorInput, JugadorUpdate } from "@/lib/api/business-jugadores";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

interface JugadorFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: JugadorInput) => Promise<void>;
  onUpdate: (input: JugadorUpdate) => Promise<void>;
  jugador?: JugadorDTO;
  usuarios: UserResponseDTO[];
  loadingUsuarios: boolean;
  usuariosError: string;
  jugadores: JugadorDTO[];
}

const NACIONALIDAD_MAX = 100;

const hoyIso = () => {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

const EDAD_MINIMA = 14;

const fechaMaximaNacimiento = () => {
  const hoy = hoyIso();
  return `${Number(hoy.slice(0, 4)) - EDAD_MINIMA}${hoy.slice(4)}`;
};

interface FieldErrors {
  usuario?: string;
  fecha?: string;
  nacionalidad?: string;
}

export function JugadorFormModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  jugador,
  usuarios,
  loadingUsuarios,
  usuariosError,
  jugadores,
}: JugadorFormModalProps) {
  const [userId, setUserId] = useState("");
  const [fecha, setFecha] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUserId(jugador ? String(jugador.user_id) : "");
    setFecha(jugador?.fecha_nacimiento ?? "");
    setNacionalidad(jugador?.nacionalidad ?? "");
    setErrors({});
    setError("");
    setSubmitting(false);
  }, [open, jugador]);

  const usuariosConJugador = useMemo(
    () => new Set(jugadores.map(({ user_id }) => user_id)),
    [jugadores],
  );
  const usuarioActual = jugador
    ? usuarios.find(({ id }) => id === jugador.user_id)
    : undefined;

  const validar = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!jugador) {
      const id = Number(userId);
      if (!userId) next.usuario = "Selecciona el usuario del jugador.";
      else if (usuariosConJugador.has(id)) next.usuario = "Ese usuario ya está registrado como jugador.";
    }
    if (!fecha) next.fecha = "La fecha de nacimiento es obligatoria.";
    else if (fecha > hoyIso()) next.fecha = "La fecha de nacimiento no puede ser futura.";
    else if (fecha !== jugador?.fecha_nacimiento && fecha > fechaMaximaNacimiento()) {
      next.fecha = `El jugador debe tener al menos ${EDAD_MINIMA} años.`;
    }
    const valor = nacionalidad.trim();
    if (!valor) next.nacionalidad = "La nacionalidad es obligatoria.";
    else if (valor.length > NACIONALIDAD_MAX) {
      next.nacionalidad = `La nacionalidad no puede superar ${NACIONALIDAD_MAX} caracteres.`;
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const next = validar();
    setErrors(next);
    if (Object.keys(next).length) return;

    setError("");
    setSubmitting(true);
    try {
      const datos = { fecha_nacimiento: fecha, nacionalidad: nacionalidad.trim() };
      if (jugador) await onUpdate(datos);
      else await onCreate({ user_id: Number(userId), ...datos });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el jugador.");
    } finally {
      setSubmitting(false);
    }
  };

  const usuarioPlaceholder = loadingUsuarios
    ? "Cargando usuarios…"
    : usuariosError
      ? "No se pudieron cargar los usuarios"
      : "Selecciona un usuario";

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={jugador ? <Pencil /> : <Plus />}
      title={jugador ? "Editar jugador" : "Registrar jugador"}
      description="Los campos marcados con * son obligatorios."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="jugador-form" loading={submitting}>
            {jugador ? "Guardar cambios" : "Registrar jugador"}
          </Button>
        </>
      }
    >
      <form id="jugador-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-co-red/30 bg-co-red/10 px-3 py-2.5 text-sm text-co-red"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
        {jugador ? (
          <div className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Usuario (no se puede cambiar)</p>
            <p className="font-medium">
              {usuarioActual
                ? `${usuarioActual.name} — ${usuarioActual.email}`
                : `Usuario #${jugador.user_id}`}
            </p>
          </div>
        ) : (
          <Select
            label="Usuario *"
            placeholder={usuarioPlaceholder}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            options={usuarios.map(({ id, name, email }) => ({
              value: String(id),
              label: usuariosConJugador.has(id)
                ? `${name} — ${email} (ya es jugador)`
                : `${name} — ${email}`,
              disabled: usuariosConJugador.has(id),
            }))}
            disabled={loadingUsuarios || !!usuariosError}
            error={errors.usuario ?? (usuariosError || undefined)}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de nacimiento *"
            type="date"
            max={jugador ? hoyIso() : fechaMaximaNacimiento()}
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            error={errors.fecha}
            required
          />
          <Input
            label="Nacionalidad *"
            placeholder="Ej. Colombiana"
            value={nacionalidad}
            maxLength={NACIONALIDAD_MAX}
            onChange={(event) => setNacionalidad(event.target.value)}
            error={errors.nacionalidad}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

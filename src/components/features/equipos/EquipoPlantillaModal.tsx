"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, UserMinus, Users } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  businessEquipoJugadorApi,
  hoyComoFecha,
  type EquipoJugadorDTO,
} from "@/lib/api/business-equipo-jugador";
import type { EquipoDTO } from "@/lib/api/business-equipos";
import { businessJugadoresApi, type JugadorDTO } from "@/lib/api/business-jugadores";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Input, Select } from "@/components/ui/Field";
import { RetirarJugadorDialog } from "./RetirarJugadorDialog";

interface EquipoPlantillaModalProps {
  open: boolean;
  onClose: () => void;
  equipo?: EquipoDTO;
  canAsignar: boolean;
  canRetirar: boolean;
}

interface FormErrors {
  jugador?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const errorMessage = (caught: unknown, fallback: string) =>
  caught instanceof Error ? caught.message : fallback;

const periodo = ({ fecha_inicio, fecha_fin }: EquipoJugadorDTO) =>
  `Desde ${fecha_inicio}${fecha_fin ? ` hasta ${fecha_fin}` : " · sin fecha de fin"}`;

export function EquipoPlantillaModal({
  open,
  onClose,
  equipo,
  canAsignar,
  canRetirar,
}: EquipoPlantillaModalProps) {
  const { notify } = useToast();
  const [contratos, setContratos] = useState<EquipoJugadorDTO[]>([]);
  const [jugadores, setJugadores] = useState<JugadorDTO[]>([]);
  const [usuarios, setUsuarios] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [error, setError] = useState("");
  const [jugadoresError, setJugadoresError] = useState("");
  const [jugadorId, setJugadorId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [porRetirar, setPorRetirar] = useState<EquipoJugadorDTO | null>(null);

  useEffect(() => {
    if (!open || !equipo) return;
    let active = true;
    setContratos([]);
    setError("");
    setJugadoresError("");
    setActionError("");
    setFormErrors({});
    setJugadorId("");
    setFechaInicio(hoyComoFecha());
    setFechaFin("");
    setPorRetirar(null);
    setLoading(true);
    setLoadingJugadores(true);

    businessEquipoJugadorApi
      .findByEquipo(equipo.id)
      .then((result) => {
        if (active) setContratos(result);
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught, "No se pudo cargar la plantilla del equipo."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    businessJugadoresApi
      .findAll()
      .then((result) => {
        if (active) setJugadores(result);
      })
      .catch((caught: unknown) => {
        if (active) setJugadoresError(errorMessage(caught, "No se pudieron cargar los jugadores."));
      })
      .finally(() => {
        if (active) setLoadingJugadores(false);
      });

    // Los nombres viven en ms-security; si no se pueden consultar se muestra el id.
    usersApi
      .findAll()
      .then((result) => {
        if (active) setUsuarios(result);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [open, equipo]);

  const jugadoresPorId = useMemo(
    () => new Map(jugadores.map((jugador) => [jugador.id, jugador])),
    [jugadores],
  );
  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios],
  );
  const vigentes = contratos.filter(({ activo }) => activo);
  const historial = contratos.filter(({ activo }) => !activo);
  const enPlantilla = new Set(vigentes.map(({ jugador_id }) => jugador_id));
  const disponibles = jugadores.filter(({ activo }) => activo);
  const hayDisponibles = disponibles.some(({ id }) => !enPlantilla.has(id));

  const nombreJugador = (jugadorIdBuscado: string) => {
    const jugador = jugadoresPorId.get(jugadorIdBuscado);
    if (!jugador) return "Jugador no disponible";
    return usuariosPorId.get(jugador.user_id)?.name ?? `Usuario #${jugador.user_id}`;
  };

  const asignar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!equipo || saving) return;
    const errors: FormErrors = {};
    if (!jugadorId) errors.jugador = "Selecciona un jugador.";
    else if (enPlantilla.has(jugadorId)) errors.jugador = "El jugador ya está en la plantilla.";
    if (!fechaInicio) errors.fechaInicio = "La fecha de inicio es obligatoria.";
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
      errors.fechaFin = "La fecha de fin no puede ser anterior a la de inicio.";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setActionError("");
    try {
      const created = await businessEquipoJugadorApi.create({
        equipo_id: equipo.id,
        jugador_id: jugadorId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
      });
      setContratos((current) => [created, ...current]);
      setJugadorId("");
      setFechaFin("");
      notify(`“${nombreJugador(created.jugador_id)}” asignado a “${equipo.nombre}”.`);
    } catch (caught) {
      setActionError(errorMessage(caught, "No se pudo asignar el jugador."));
    } finally {
      setSaving(false);
    }
  };

  const retirar = async (fechaSalida: string) => {
    const contrato = porRetirar;
    if (!contrato || !equipo) return;
    const updated = await businessEquipoJugadorApi.retirar(contrato.id, fechaSalida);
    setContratos((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    notify(`“${nombreJugador(updated.jugador_id)}” retirado de “${equipo.nombre}”.`);
  };

  const selectorPlaceholder = loadingJugadores
    ? "Cargando jugadores…"
    : jugadoresError
      ? "No se pudieron cargar los jugadores"
      : hayDisponibles
        ? "Selecciona un jugador"
        : "No hay jugadores activos disponibles";

  const renderContrato = (contrato: EquipoJugadorDTO) => {
    const nombre = nombreJugador(contrato.jugador_id);
    return (
      <li key={contrato.id} className="flex items-center justify-between gap-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{nombre}</p>
          <p className="text-xs text-zinc-500">{periodo(contrato)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge tone={contrato.activo ? "success" : "neutral"}>
            {contrato.activo ? "Vigente" : "Retirado"}
          </Badge>
          {contrato.activo && canRetirar && (
            <IconButton
              label={`Retirar a ${nombre}`}
              tone="red"
              disabled={saving}
              onClick={() => setPorRetirar(contrato)}
            >
              <UserMinus />
            </IconButton>
          )}
        </div>
      </li>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        icon={<Users />}
        title={`Plantilla de ${equipo?.nombre ?? "este equipo"}`}
        description="Jugadores con contrato vigente e historial de traspasos del equipo."
        footer={
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando plantilla…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-co-red">
            {error}
          </p>
        ) : (
          <div className="space-y-5 text-sm">
            <section aria-labelledby="plantilla-vigente">
              <h3
                id="plantilla-vigente"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                Plantilla vigente ({vigentes.length})
              </h3>
              {vigentes.length === 0 ? (
                <p className="py-2 text-zinc-500">El equipo no tiene jugadores asignados.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {vigentes.map(renderContrato)}
                </ul>
              )}
            </section>

            {canAsignar && equipo && (
              <form
                onSubmit={(event) => void asignar(event)}
                noValidate
                className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                {!equipo.activo && (
                  <p className="text-xs text-zinc-500">
                    El equipo está inactivo: actívalo para poder asignarle jugadores.
                  </p>
                )}
                <Select
                  label="Asignar jugador *"
                  placeholder={selectorPlaceholder}
                  value={jugadorId}
                  onChange={(event) => setJugadorId(event.target.value)}
                  error={formErrors.jugador}
                  options={disponibles.map(({ id }) => ({
                    value: id,
                    label: enPlantilla.has(id)
                      ? `${nombreJugador(id)} (en la plantilla)`
                      : nombreJugador(id),
                    disabled: enPlantilla.has(id),
                  }))}
                  disabled={loadingJugadores || !!jugadoresError || !hayDisponibles}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Inicio del contrato *"
                    value={fechaInicio}
                    onChange={(event) => setFechaInicio(event.target.value)}
                    error={formErrors.fechaInicio}
                    required
                  />
                  <Input
                    type="date"
                    label="Fin del contrato"
                    value={fechaFin}
                    min={fechaInicio || undefined}
                    onChange={(event) => setFechaFin(event.target.value)}
                    error={formErrors.fechaFin}
                    hint="Opcional"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    leftIcon={<Plus className="size-4" />}
                    loading={saving}
                    disabled={!equipo.activo}
                  >
                    Asignar
                  </Button>
                </div>
                {(actionError || jugadoresError) && (
                  <p role="alert" className="text-co-red">
                    {actionError || jugadoresError}
                  </p>
                )}
              </form>
            )}

            <section aria-labelledby="plantilla-historial">
              <h3
                id="plantilla-historial"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                Historial ({historial.length})
              </h3>
              {historial.length === 0 ? (
                <p className="py-2 text-zinc-500">Sin jugadores retirados.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {historial.map(renderContrato)}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>

      {canRetirar && (
        <RetirarJugadorDialog
          contrato={porRetirar}
          nombreJugador={porRetirar ? nombreJugador(porRetirar.jugador_id) : ""}
          nombreEquipo={equipo?.nombre ?? ""}
          onClose={() => setPorRetirar(null)}
          onConfirm={retirar}
        />
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ContactRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  businessJugadoresApi,
  edadDesde,
  type JugadorDTO,
  type JugadorPerfilDTO,
} from "@/lib/api/business-jugadores";
import { describeError } from "@/lib/api/http";

interface JugadorPerfilModalProps {
  open: boolean;
  onClose: () => void;
  jugador?: JugadorDTO;
  nombreUsuario: string;
  correoUsuario?: string;
}

export function JugadorPerfilModal({
  open,
  onClose,
  jugador,
  nombreUsuario,
  correoUsuario,
}: JugadorPerfilModalProps) {
  const [perfil, setPerfil] = useState<JugadorPerfilDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !jugador) return;
    let active = true;
    setPerfil(null);
    setError("");
    setLoading(true);

    businessJugadoresApi
      .findPerfil(jugador.id)
      .then((found) => {
        if (active) setPerfil(found);
      })
      .catch((caught: unknown) => {
        if (active) setError(describeError(caught, "No se pudo cargar el perfil deportivo."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, jugador]);

  const detalle = perfil?.jugador;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<ContactRound />}
      title="Perfil deportivo del jugador"
      description="Información del jugador, sus equipos y habilidades deportivas."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando perfil deportivo…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-co-red">
          {error}
        </p>
      ) : detalle ? (
        <div className="space-y-6">
          <section aria-labelledby="perfil-jugador">
            <h3
              id="perfil-jugador"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Información del jugador
            </h3>
            <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-40 shrink-0 text-zinc-500">Jugador</dt>
                <dd className="min-w-0 flex-1 font-medium">
                  {nombreUsuario}
                  {correoUsuario && (
                    <span className="block text-xs font-normal text-zinc-500">
                      {correoUsuario}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-40 shrink-0 text-zinc-500">Fecha de nacimiento</dt>
                <dd className="min-w-0 flex-1 font-medium">
                  {detalle.fecha_nacimiento} ({edadDesde(detalle.fecha_nacimiento)} años)
                </dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-40 shrink-0 text-zinc-500">Nacionalidad</dt>
                <dd className="min-w-0 flex-1 font-medium">{detalle.nacionalidad}</dd>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <dt className="w-40 shrink-0 text-zinc-500">Estado</dt>
                <dd className="min-w-0 flex-1">
                  <Badge tone={detalle.activo ? "success" : "neutral"}>
                    {detalle.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="perfil-equipos">
            <h3
              id="perfil-equipos"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Equipos
            </h3>
            {perfil.equipos.length === 0 ? (
              <p className="text-sm text-zinc-500">
                El jugador no tiene equipos asociados.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {perfil.equipos.map((equipo, index) => (
                  <li
                    key={`${equipo.id ?? equipo.equipo_id ?? equipo.nombre}-${equipo.fecha_inicio}-${equipo.fecha_fin ?? "actual"}-${index}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {equipo.nombre}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Desde {equipo.fecha_inicio}
                        {equipo.fecha_fin
                          ? ` hasta ${equipo.fecha_fin}`
                          : " · sin fecha de fin"}
                      </p>
                    </div>
                    <Badge tone={equipo.activo ? "success" : "neutral"}>
                      {equipo.activo ? "Vigente" : "Retirado"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="perfil-habilidades">
            <h3
              id="perfil-habilidades"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Habilidades
            </h3>
            {perfil.habilidades.length === 0 ? (
              <p className="text-sm text-zinc-500">
                El jugador no tiene habilidades registradas.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {perfil.habilidades.map((habilidad, index) => {
                  const habilidadId =
                    habilidad.id ?? habilidad.habilidad_id ?? habilidad.habilidad?.id;
                  const nombre = habilidad.nombre ?? habilidad.habilidad?.nombre;
                  return (
                    <li key={`${habilidadId ?? nombre ?? "habilidad"}-${index}`}>
                      <Badge tone="blue">{nombre ?? "Habilidad sin nombre"}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

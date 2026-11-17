"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  businessEquipoJugadorApi,
  type EquipoJugadorDTO,
} from "@/lib/api/business-equipo-jugador";
import { businessEquiposApi } from "@/lib/api/business-equipos";
import { describeError } from "@/lib/api/http";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import {
  businessJugadoresApi,
  edadDesde,
  type JugadorDTO,
} from "@/lib/api/business-jugadores";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface JugadorDetailModalProps {
  open: boolean;
  onClose: () => void;
  jugador?: JugadorDTO;
  canViewEquipos?: boolean;
}

export function JugadorDetailModal({
  open,
  onClose,
  jugador,
  canViewEquipos = false,
}: JugadorDetailModalProps) {
  const [detail, setDetail] = useState<JugadorDTO | null>(null);
  const [usuario, setUsuario] = useState<UserResponseDTO | null>(null);
  const [usuarioError, setUsuarioError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contratos, setContratos] = useState<EquipoJugadorDTO[]>([]);
  const [equipos, setEquipos] = useState<Map<string, string>>(new Map());
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [equiposError, setEquiposError] = useState("");

  useEffect(() => {
    if (!open || !jugador || !canViewEquipos) return;
    let active = true;
    setContratos([]);
    setEquiposError("");
    setLoadingEquipos(true);

    Promise.all([
      businessEquipoJugadorApi.findByJugador(jugador.id),
      businessEquiposApi.findAll(),
    ])
      .then(([found, todos]) => {
        if (!active) return;
        setContratos(found);
        setEquipos(new Map(todos.map(({ id, nombre }) => [id, nombre])));
      })
      .catch((caught: unknown) => {
        if (active) {
          setEquiposError(
            caught instanceof Error ? caught.message : "No se pudieron cargar los equipos.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingEquipos(false);
      });

    return () => {
      active = false;
    };
  }, [open, jugador, canViewEquipos]);

  useEffect(() => {
    if (!open || !jugador) return;
    let active = true;
    setDetail(null);
    setUsuario(null);
    setUsuarioError("");
    setError("");
    setLoading(true);

    businessJugadoresApi
      .findOne(jugador.id)
      .then(async (found) => {
        if (!active) return;
        setDetail(found);
        try {
          const user = await usersApi.findById(found.user_id);
          if (active) setUsuario(user);
        } catch (caught) {
          if (active) setUsuarioError(describeError(caught, "Usuario no encontrado."));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "No se pudo cargar el jugador.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, jugador]);

  const rows = detail
    ? [
        {
          label: "Usuario",
          value: usuario ? (
            <span>
              {usuario.name}
              <span className="block text-xs font-normal text-zinc-500">{usuario.email}</span>
            </span>
          ) : (
            <span className="text-co-red">
              {usuarioError || "Cargando usuario…"} (#{detail.user_id})
            </span>
          ),
        },
        {
          label: "Fecha de nacimiento",
          value: `${detail.fecha_nacimiento} (${edadDesde(detail.fecha_nacimiento)} años)`,
        },
        { label: "Nacionalidad", value: detail.nacionalidad },
        {
          label: "Estado",
          value: (
            <Badge tone={detail.activo ? "success" : "neutral"}>
              {detail.activo ? "Activo" : "Inactivo"}
            </Badge>
          ),
        },
      ]
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<Eye />}
      title="Detalle del jugador"
      description="Datos deportivos del jugador y su usuario en la plataforma."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando detalle…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-co-red">
          {error}
        </p>
      ) : (
        <div className="space-y-4">
          <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2.5">
                <dt className="w-40 shrink-0 text-zinc-500">{label}</dt>
                <dd className="min-w-0 flex-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {canViewEquipos && detail && (
            <section aria-labelledby="jugador-equipos" className="text-sm">
              <h3
                id="jugador-equipos"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                Equipos e historial de traspasos
              </h3>
              {loadingEquipos ? (
                <p className="py-2 text-zinc-500">Cargando equipos…</p>
              ) : equiposError ? (
                <p role="alert" className="py-2 text-co-red">
                  {equiposError}
                </p>
              ) : contratos.length === 0 ? (
                <p className="py-2 text-zinc-500">El jugador no ha pertenecido a ningún equipo.</p>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {contratos.map((contrato) => (
                    <li
                      key={contrato.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {equipos.get(contrato.equipo_id) ?? "Equipo no disponible"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Desde {contrato.fecha_inicio}
                          {contrato.fecha_fin
                            ? ` hasta ${contrato.fecha_fin}`
                            : " · sin fecha de fin"}
                        </p>
                      </div>
                      <Badge tone={contrato.activo ? "success" : "neutral"}>
                        {contrato.activo ? "Vigente" : "Retirado"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

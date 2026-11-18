"use client";

import { useEffect, useState } from "react";
import { businessHabilidadJugadorApi } from "@/lib/api/business-habilidad-jugador";
import { businessJugadoresApi, type JugadorDTO } from "@/lib/api/business-jugadores";
import type { UserResponseDTO } from "@/lib/api/types";
import { usersApi } from "@/lib/api/users";
import { Badge } from "@/components/ui/Badge";

interface HabilidadJugadoresSectionProps {
  habilidadId: string;
}

interface JugadorConUsuario {
  jugador: JugadorDTO;
  usuario?: UserResponseDTO;
}

const nombreDe = ({ jugador, usuario }: JugadorConUsuario) =>
  usuario?.name ?? `Usuario #${jugador.user_id}`;

export function HabilidadJugadoresSection({ habilidadId }: HabilidadJugadoresSectionProps) {
  const [jugadores, setJugadores] = useState<JugadorConUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setJugadores([]);
    setError("");
    setLoading(true);

    Promise.all([
      businessHabilidadJugadorApi.findByHabilidad(habilidadId),
      businessJugadoresApi.findAll(),
      // Sin el servicio de usuarios la lista sigue siendo útil con el id del usuario.
      usersApi.findAll().catch((): UserResponseDTO[] => []),
    ])
      .then(([asignaciones, todos, usuarios]) => {
        if (!active) return;
        const asignados = new Set(asignaciones.map(({ jugador_id }) => jugador_id));
        const porId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
        setJugadores(
          todos
            .filter(({ id }) => asignados.has(id))
            .map((jugador) => ({ jugador, usuario: porId.get(jugador.user_id) }))
            .sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), "es")),
        );
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los jugadores de la habilidad.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [habilidadId]);

  return (
    <section aria-labelledby="habilidad-jugadores" className="mt-4 text-sm">
      <h3
        id="habilidad-jugadores"
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        Jugadores con esta habilidad
      </h3>
      {loading ? (
        <p className="py-2 text-zinc-500">Cargando jugadores…</p>
      ) : error ? (
        <p role="alert" className="py-2 text-co-red">
          {error}
        </p>
      ) : jugadores.length === 0 ? (
        <p className="py-2 text-zinc-500">Ningún jugador tiene esta habilidad.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {jugadores.map((item) => (
            <li key={item.jugador.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {nombreDe(item)}
                </p>
                {item.usuario && (
                  <p className="truncate text-xs text-zinc-500">{item.usuario.email}</p>
                )}
              </div>
              <Badge tone={item.jugador.activo ? "success" : "neutral"}>
                {item.jugador.activo ? "Activo" : "Inactivo"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

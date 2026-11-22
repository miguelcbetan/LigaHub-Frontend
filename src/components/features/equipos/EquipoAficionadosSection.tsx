"use client";

import { useEffect, useState } from "react";
import {
  equipoAficionadosApi,
  type AficionadoDeEquipoDTO,
} from "@/lib/api/business-aficionados";

interface EquipoAficionadosSectionProps {
  equipoId: string;
}

/** HU-GE-05: aficionados que siguen el equipo, para el administrador deportivo. */
export function EquipoAficionadosSection({ equipoId }: EquipoAficionadosSectionProps) {
  const [aficionados, setAficionados] = useState<AficionadoDeEquipoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setAficionados([]);
    setError("");
    setLoading(true);

    equipoAficionadosApi
      .findByEquipo(equipoId)
      .then((result) => {
        if (active) setAficionados(result);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar los aficionados del equipo.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [equipoId]);

  return (
    <section aria-labelledby="equipo-aficionados" className="text-sm">
      <h3
        id="equipo-aficionados"
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        Aficionados que siguen al equipo
      </h3>
      {loading ? (
        <p className="py-2 text-zinc-500">Cargando aficionados…</p>
      ) : error ? (
        <p role="alert" className="py-2 text-co-red">
          {error}
        </p>
      ) : aficionados.length === 0 ? (
        <p className="py-2 text-zinc-500">Ningún aficionado sigue a este equipo.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {aficionados.map((aficionado) => (
            <li key={aficionado.asociacion_id} className="py-2.5">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {aficionado.nombre}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {aficionado.email}
                {aficionado.telefono ? ` · ${aficionado.telefono}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

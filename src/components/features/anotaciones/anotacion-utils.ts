import type { AnotacionDTO } from "@/lib/api/business-anotaciones";
import type { PartidoDTO } from "@/lib/api/business-partidos";

/** Marcador calculado con los goles de cada equipo (misma regla que Business). */
export function marcadorDe(
  partido: Pick<PartidoDTO, "equipo_local_id" | "equipo_visitante_id">,
  anotaciones: Pick<AnotacionDTO, "equipo_id">[],
): Pick<PartidoDTO, "goles_local" | "goles_visitante"> {
  return {
    goles_local: anotaciones.filter(({ equipo_id }) => equipo_id === partido.equipo_local_id)
      .length,
    goles_visitante: anotaciones.filter(
      ({ equipo_id }) => equipo_id === partido.equipo_visitante_id,
    ).length,
  };
}

export const ordenarPorMinuto = (anotaciones: AnotacionDTO[]) =>
  [...anotaciones].sort((a, b) => a.minuto - b.minuto);

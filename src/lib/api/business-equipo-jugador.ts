import { request } from "./business-torneos";

export interface EquipoJugadorDTO {
  id: string;
  equipo_id: string;
  jugador_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
}

export interface EquipoJugadorInput {
  equipo_id: string;
  jugador_id: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
}

const BASE = "/api/business/equipo-jugador";

export const businessEquipoJugadorApi = {
  findByEquipo(equipoId: string) {
    return request<EquipoJugadorDTO[]>(
      `${BASE}?equipo_id=${encodeURIComponent(equipoId)}`,
    );
  },

  findByJugador(jugadorId: string) {
    return request<EquipoJugadorDTO[]>(
      `${BASE}?jugador_id=${encodeURIComponent(jugadorId)}`,
    );
  },

  create(input: EquipoJugadorInput) {
    return request<EquipoJugadorDTO>(BASE, { method: "POST", body: input });
  },

  retirar(id: string, fechaFin: string) {
    return request<EquipoJugadorDTO>(
      `${BASE}/${encodeURIComponent(id)}/retiro`,
      { method: "PATCH", body: { fecha_fin: fechaFin } },
    );
  },
};

/** Fecha local de hoy en formato `YYYY-MM-DD` (para inputs de tipo date). */
export function hoyComoFecha(hoy = new Date()): string {
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

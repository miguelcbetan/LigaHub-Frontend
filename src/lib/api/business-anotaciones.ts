import { request } from "./business-torneos";

/** HU-GC-07: una anotación es un gol de un jugador en un partido. */
export interface AnotacionDTO {
  id: string;
  minuto: number;
  descripcion: string | null;
  partido_id: string;
  jugador_id: string;
  /** Equipo al que se sumó el gol (local o visitante). */
  equipo_id: string;
}

export interface AnotacionInput {
  partido_id: string;
  jugador_id: string;
  minuto: number;
  descripcion?: string | null;
}

/** El partido de una anotación no cambia. */
export type AnotacionUpdate = Partial<Omit<AnotacionInput, "partido_id">>;

/** Estados del partido en los que Business admite gestionar goles. */
export const ESTADOS_CON_GOLES = ["EN_JUEGO", "FINALIZADO"] as const;

export const MINUTO_MAXIMO = 130;

const BASE = "/api/business/anotaciones";
const anotacionUrl = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export const businessAnotacionesApi = {
  findByPartido(partidoId: string) {
    return request<AnotacionDTO[]>(
      `${BASE}?partido_id=${encodeURIComponent(partidoId)}`,
    );
  },

  create(input: AnotacionInput) {
    return request<AnotacionDTO>(BASE, { method: "POST", body: input });
  },

  update(id: string, input: AnotacionUpdate) {
    return request<AnotacionDTO>(anotacionUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(anotacionUrl(id), { method: "DELETE" });
  },
};

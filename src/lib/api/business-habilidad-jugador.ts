import { request } from "./business-torneos";

export interface HabilidadJugadorDTO {
  id: string;
  habilidad_id: string;
  jugador_id: string;
}

const BASE = "/api/business/habilidad-jugador";

export const businessHabilidadJugadorApi = {
  findByJugador(jugadorId: string) {
    return request<HabilidadJugadorDTO[]>(
      `${BASE}?jugador_id=${encodeURIComponent(jugadorId)}`,
    );
  },

  findByHabilidad(habilidadId: string) {
    return request<HabilidadJugadorDTO[]>(
      `${BASE}?habilidad_id=${encodeURIComponent(habilidadId)}`,
    );
  },

  create(habilidadId: string, jugadorId: string) {
    return request<HabilidadJugadorDTO>(BASE, {
      method: "POST",
      body: { habilidad_id: habilidadId, jugador_id: jugadorId },
    });
  },

  remove(id: string) {
    return request<void>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

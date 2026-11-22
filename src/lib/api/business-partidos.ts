import type { EstadoPartido, TipoFase } from "./business-fases";
import type { AnotacionDTO } from "./business-anotaciones";
import { request } from "./business-torneos";

export type { EstadoPartido } from "./business-fases";

export interface PartidoDTO {
  id: string;
  fecha_hora: string;
  estado: EstadoPartido;
  equipo_local_id: string;
  equipo_visitante_id: string;
  equipo_local_nombre: string | null;
  equipo_visitante_nombre: string | null;
  /** Calculados por Business a partir de las anotaciones (HU-GC-07). */
  goles_local: number;
  goles_visitante: number;
  /** null mientras el escenario esté por definir (HU-GC-06). */
  escenario_id: string | null;
  escenario_nombre: string | null;
  fase_id: string | null;
  fase_tipo: TipoFase | null;
  torneo_id: string | null;
  boletas?: { id: string }[];
  apuestas?: { id: string }[];
  anotaciones?: AnotacionDTO[];
  pelota?: { id: string; marca: string; modelo: string } | null;
}

export interface PartidoInput {
  /** ISO 8601 con zona horaria. */
  fecha_hora: string;
  equipo_local_id: string;
  equipo_visitante_id: string;
  fase_id: string;
  /** null quita el escenario asignado. */
  escenario_id?: string | null;
  estado?: EstadoPartido;
}

export interface PartidoFilters {
  fase_id?: string;
  torneo_id?: string;
}

/** Estados en los que Business ya no permite modificar el partido. */
export const ESTADOS_CERRADOS: EstadoPartido[] = ["FINALIZADO", "CANCELADO"];

const partidoUrl = (id: string) =>
  `/api/business/partidos/${encodeURIComponent(id)}`;

export const businessPartidosApi = {
  findAll(filters: PartidoFilters = {}) {
    const params = new URLSearchParams();
    if (filters.fase_id) params.set("fase_id", filters.fase_id);
    if (filters.torneo_id) params.set("torneo_id", filters.torneo_id);
    const query = params.toString();
    return request<PartidoDTO[]>(
      `/api/business/partidos${query ? `?${query}` : ""}`,
    );
  },

  findOne(id: string) {
    return request<PartidoDTO>(partidoUrl(id));
  },

  create(input: PartidoInput) {
    return request<PartidoDTO>("/api/business/partidos", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<PartidoInput>) {
    return request<PartidoDTO>(partidoUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(partidoUrl(id), { method: "DELETE" });
  },
};

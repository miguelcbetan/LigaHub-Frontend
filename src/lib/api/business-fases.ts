import { request } from "./business-torneos";

export type TipoFase = "GRUPOS" | "FINAL";
export type EstadoFase = "PENDIENTE" | "EN_CURSO" | "FINALIZADA";
export type ModalidadFinal = "PARTIDO_UNICO" | "IDA_Y_VUELTA";

export interface FaseDTO {
  id: string;
  tipo: TipoFase;
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFase;
  torneo_id: string;
  cantidad_grupos?: number | null;
  equipos_por_grupo?: number | null;
  numero_partidos?: number | null;
  modalidad?: ModalidadFinal | null;
}

export interface FaseFilters {
  tipo?: TipoFase;
  torneo_id?: string;
}

export interface FaseInput {
  tipo: TipoFase;
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFase;
  torneo_id: string;
  cantidad_grupos?: number;
  equipos_por_grupo?: number;
  numero_partidos?: number;
  modalidad?: ModalidadFinal;
}

export type FaseUpdate = Partial<Omit<FaseInput, "tipo">>;

export const businessFasesApi = {
  findAll(filters: FaseFilters = {}) {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.torneo_id) params.set("torneo_id", filters.torneo_id);
    const query = params.toString();
    return request<FaseDTO[]>(`/api/business/fases${query ? `?${query}` : ""}`);
  },

  create(input: FaseInput) {
    return request<FaseDTO>("/api/business/fases", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: FaseUpdate) {
    return request<FaseDTO>(`/api/business/fases/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: input,
    });
  },

  remove(id: string) {
    return request<void>(`/api/business/fases/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

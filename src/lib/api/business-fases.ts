import type { EquipoDTO } from "./business-equipos";
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
  /** Id del grupo en fases_grupos; es el valor de equipo.fase_grupos_id. */
  fase_grupos_id?: string;
  fase_final_id?: string;
  nombre?: string | null;
  cupo_equipos?: number | null;
  numero_partidos?: number | null;
  modalidad?: ModalidadFinal | null;
}

export interface FaseFilters {
  tipo?: TipoFase;
  torneo_id?: string;
  /** Los grupos de una misma etapa comparten torneo y numero_orden. */
  numero_orden?: number;
}

export interface FaseInput {
  tipo: TipoFase;
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFase;
  torneo_id: string;
  nombre?: string;
  cupo_equipos?: number;
  numero_partidos?: number;
  modalidad?: ModalidadFinal;
}

export type FaseUpdate = Partial<Omit<FaseInput, "tipo">>;

export const businessFasesApi = {
  findAll(filters: FaseFilters = {}) {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.torneo_id) params.set("torneo_id", filters.torneo_id);
    if (filters.numero_orden !== undefined) {
      params.set("numero_orden", String(filters.numero_orden));
    }
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

  /** Equipos que conforman un grupo (fase de tipo GRUPOS). */
  findEquiposGrupo(id: string) {
    return request<EquipoDTO[]>(
      `/api/business/fases/${encodeURIComponent(id)}/equipos`,
    );
  },

  /** Asigna varios equipos a la vez; devuelve los equipos del grupo. */
  asignarEquiposGrupo(id: string, equipoIds: string[]) {
    return request<EquipoDTO[]>(
      `/api/business/fases/${encodeURIComponent(id)}/equipos`,
      { method: "POST", body: { equipo_ids: equipoIds } },
    );
  },

  quitarEquipoGrupo(id: string, equipoId: string) {
    return request<{ message: string }>(
      `/api/business/fases/${encodeURIComponent(id)}/equipos/${encodeURIComponent(equipoId)}`,
      { method: "DELETE" },
    );
  },
};

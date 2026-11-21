import { request } from "./business-torneos";

export interface EquipoDTO {
  id: string;
  nombre: string;
  fase_grupos_id: string | null;
  activo: boolean;
}

export interface EquipoInput {
  nombre: string;
  activo?: boolean;
  /** Id del grupo (fases_grupos); null deja al equipo sin grupo. */
  fase_grupos_id?: string | null;
}

const equipoUrl = (id: string) =>
  `/api/business/equipos/${encodeURIComponent(id)}`;

export const businessEquiposApi = {
  findAll() {
    return request<EquipoDTO[]>("/api/business/equipos");
  },

  findOne(id: string) {
    return request<EquipoDTO>(equipoUrl(id));
  },

  create(input: EquipoInput) {
    return request<EquipoDTO>("/api/business/equipos", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<EquipoInput>) {
    return request<EquipoDTO>(equipoUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<void>(equipoUrl(id), { method: "DELETE" });
  },
};

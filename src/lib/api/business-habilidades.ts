import { request } from "./business-torneos";

export interface HabilidadDTO {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface HabilidadInput {
  nombre: string;
  descripcion: string;
}

const habilidadUrl = (id: string) =>
  `/api/business/habilidades/${encodeURIComponent(id)}`;

export const businessHabilidadesApi = {
  findAll() {
    return request<HabilidadDTO[]>("/api/business/habilidades");
  },

  findOne(id: string) {
    return request<HabilidadDTO>(habilidadUrl(id));
  },

  create(input: HabilidadInput) {
    return request<HabilidadDTO>("/api/business/habilidades", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<HabilidadInput>) {
    return request<HabilidadDTO>(habilidadUrl(id), {
      method: "PATCH",
      body: input,
    });
  },

  remove(id: string) {
    return request<void>(habilidadUrl(id), { method: "DELETE" });
  },
};

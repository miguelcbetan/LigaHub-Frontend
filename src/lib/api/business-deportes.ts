import { request } from "./business-torneos";

export interface DeporteDTO {
  id: string;
  nombre: string;
  descripcion: string;
  deporte_padre_id: string | null;
}

export interface DeporteInput {
  nombre: string;
  descripcion: string;
  deporte_padre_id?: string | null;
}

const deporteUrl = (id: string) =>
  `/api/business/deportes/${encodeURIComponent(id)}`;

export const businessDeportesApi = {
  findAll() {
    return request<DeporteDTO[]>("/api/business/deportes");
  },

  create(input: DeporteInput) {
    return request<DeporteDTO>("/api/business/deportes", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<DeporteInput>) {
    return request<DeporteDTO>(deporteUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<void>(deporteUrl(id), { method: "DELETE" });
  },
};

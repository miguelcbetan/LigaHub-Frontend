import { request } from "./business-torneos";

export interface EquipoDeporteDTO {
  id: string;
  equipo_id: string;
  deporte_id: string;
}

export const businessEquiposDeportesApi = {
  findByEquipo(equipoId: string) {
    return request<EquipoDeporteDTO[]>(
      `/api/business/equipos-deportes?equipo_id=${encodeURIComponent(equipoId)}`,
    );
  },

  findByDeporte(deporteId: string) {
    return request<EquipoDeporteDTO[]>(
      `/api/business/equipos-deportes?deporte_id=${encodeURIComponent(deporteId)}`,
    );
  },

  create(equipoId: string, deporteId: string) {
    return request<EquipoDeporteDTO>("/api/business/equipos-deportes", {
      method: "POST",
      body: { equipo_id: equipoId, deporte_id: deporteId },
    });
  },

  remove(id: string) {
    return request<void>(
      `/api/business/equipos-deportes/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },
};

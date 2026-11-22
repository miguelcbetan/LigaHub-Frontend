import { request } from "./business-torneos";

/** Equipo que sigue el aficionado (fila de aficionados_equipos). */
export interface EquipoAsociadoDTO {
  asociacion_id: string;
  equipo_id: string;
  nombre: string;
  activo: boolean;
}

export interface EquipoDisponibleDTO {
  id: string;
  nombre: string;
}

export interface MiAficionadoDTO {
  id: string;
  user_id: number;
  nombre: string;
  documento: string;
  email: string;
  telefono: string | null;
  equipos: EquipoAsociadoDTO[];
}

export interface ConvertirseAficionadoInput {
  nombre: string;
  documento: string;
  email: string;
  telefono?: string;
  equipo_ids: string[];
}

/** Aficionado que sigue un equipo, visto por el administrador deportivo. */
export interface AficionadoDeEquipoDTO {
  asociacion_id: string;
  aficionado_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
}

const ME = "/api/business/aficionados/me";

/** HU-GE-05: el usuario se identifica por su token; nunca se envía su id. */
export const miAficionadoApi = {
  findMine() {
    return request<MiAficionadoDTO>(ME);
  },

  convertirse(input: ConvertirseAficionadoInput) {
    return request<MiAficionadoDTO>(ME, { method: "POST", body: input });
  },

  findEquiposDisponibles() {
    return request<EquipoDisponibleDTO[]>(`${ME}/equipos-disponibles`);
  },

  asociarEquipo(equipoId: string) {
    return request<EquipoAsociadoDTO>(`${ME}/equipos`, {
      method: "POST",
      body: { equipo_id: equipoId },
    });
  },

  retirarEquipo(equipoId: string) {
    return request<void>(`${ME}/equipos/${encodeURIComponent(equipoId)}`, {
      method: "DELETE",
    });
  },
};

export const equipoAficionadosApi = {
  findByEquipo(equipoId: string) {
    return request<AficionadoDeEquipoDTO[]>(
      `/api/business/equipos/${encodeURIComponent(equipoId)}/aficionados`,
    );
  },
};

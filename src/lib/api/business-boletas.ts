import type { EstadoBoleta } from "./business-aficionados";
import { request } from "./business-torneos";

export interface BoletaDTO {
  id: string;
  fecha_compra: string;
  precio: number;
  estado: EstadoBoleta;
  aficionado_id: string;
  partido_id: string;
  localidad_id: string;
}

export interface BoletaInput {
  aficionado_id: string;
  partido_id: string;
  localidad_id: string;
  /** Sin precio se usa el de la localidad. */
  precio?: number;
  estado?: EstadoBoleta;
}

const BASE = "/api/business/boletas";
const recurso = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

/** HU-C: gestión de boletas del administrador deportivo. */
export const businessBoletasApi = {
  findAll() {
    return request<BoletaDTO[]>(BASE);
  },

  create(input: BoletaInput) {
    return request<BoletaDTO>(BASE, { method: "POST", body: input });
  },

  update(id: string, input: Partial<BoletaInput>) {
    return request<BoletaDTO>(recurso(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(recurso(id), { method: "DELETE" });
  },
};

import type { EstadoApuesta, Pronostico } from "./business-aficionados";
import { request } from "./business-torneos";

export interface ApuestaDTO {
  id: string;
  fecha_apuesta: string;
  monto: number;
  pronostico: Pronostico;
  cuota: number;
  estado: EstadoApuesta;
  aficionado_id: string;
  partido_id: string;
  metodo_pago_aficionado_id: string;
}

export interface ApuestaInput {
  aficionado_id: string;
  partido_id: string;
  metodo_pago_aficionado_id: string;
  pronostico: Pronostico;
  monto: number;
  cuota: number;
  estado?: EstadoApuesta;
}

const BASE = "/api/business/apuestas";
const recurso = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

/** HU-C: gestión y liquidación de apuestas del administrador deportivo. */
export const businessApuestasApi = {
  findAll() {
    return request<ApuestaDTO[]>(BASE);
  },

  create(input: ApuestaInput) {
    return request<ApuestaDTO>(BASE, { method: "POST", body: input });
  },

  update(id: string, input: Partial<ApuestaInput>) {
    return request<ApuestaDTO>(recurso(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(recurso(id), { method: "DELETE" });
  },
};

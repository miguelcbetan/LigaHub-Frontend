import type {
  EstadoMetodoPago,
  MetodoPagoDisponibleDTO,
  MiMetodoPagoInput,
  MiMetodoPagoUpdate,
} from "./business-aficionados";
import { request } from "./business-torneos";

export interface MetodoPagoAficionadoDTO {
  id: string;
  referencia: string;
  fecha_registro: string;
  predeterminado: boolean;
  estado: EstadoMetodoPago;
  aficionado_id: string;
  metodo_pago_id: string;
  apuestas?: { id: string }[];
}

export interface MetodoPagoAficionadoInput extends MiMetodoPagoInput {
  aficionado_id: string;
  estado?: EstadoMetodoPago;
}

export type MetodoPagoAficionadoUpdate = MiMetodoPagoUpdate;

export interface MetodoPagoCatalogoDTO extends MetodoPagoDisponibleDTO {
  activo: boolean;
}

export interface AficionadoSelectorDTO {
  id: string;
  nombre: string;
  documento: string;
}

const BASE = "/api/business/metodos-pago-aficionado";
const recurso = (id: string) => BASE + "/" + encodeURIComponent(id);

export const businessMetodosPagoAficionadoApi = {
  findAll() {
    return request<MetodoPagoAficionadoDTO[]>(BASE);
  },

  findOne(id: string) {
    return request<MetodoPagoAficionadoDTO>(recurso(id));
  },

  create(input: MetodoPagoAficionadoInput) {
    return request<MetodoPagoAficionadoDTO>(BASE, { method: "POST", body: input });
  },

  update(id: string, input: MetodoPagoAficionadoUpdate) {
    return request<MetodoPagoAficionadoDTO>(recurso(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<{ message: string }>(recurso(id), { method: "DELETE" });
  },

  findCatalogo() {
    return request<MetodoPagoCatalogoDTO[]>("/api/business/metodos-pago");
  },

  findAficionados() {
    return request<AficionadoSelectorDTO[]>("/api/business/aficionados");
  },
};

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

export type TipoMetodoPago =
  | "TARJETA_CREDITO"
  | "TARJETA_DEBITO"
  | "BILLETERA_DIGITAL"
  | "PSE"
  | "EFECTIVO";

export type EstadoMetodoPago = "ACTIVO" | "INACTIVO";

export interface MiMetodoPagoDTO {
  id: string;
  referencia: string;
  fecha_registro: string;
  predeterminado: boolean;
  estado: EstadoMetodoPago;
  metodo_pago_id: string;
  metodo_pago_nombre: string;
  metodo_pago_tipo: TipoMetodoPago;
  tiene_apuestas: boolean;
}

export interface MiMetodoPagoInput {
  metodo_pago_id: string;
  referencia: string;
  predeterminado?: boolean;
}

export interface MiMetodoPagoUpdate {
  referencia?: string;
  predeterminado?: boolean;
  estado?: EstadoMetodoPago;
}

export interface MetodoPagoDisponibleDTO {
  id: string;
  nombre: string;
  tipo: TipoMetodoPago;
}

/* ---------- HU-C: boletas y apuestas del aficionado ---------- */

export type EstadoPartidoResumen = "PROGRAMADO" | "EN_JUEGO" | "FINALIZADO" | "CANCELADO";
export type EstadoBoleta = "ACTIVA" | "USADA" | "ANULADA";
export type Pronostico = "LOCAL" | "EMPATE" | "VISITANTE";
export type EstadoApuesta = "PENDIENTE" | "GANADA" | "PERDIDA" | "ANULADA";

export interface PartidoResumenDTO {
  id: string;
  fecha_hora: string;
  estado: EstadoPartidoResumen;
  equipo_local_nombre: string | null;
  equipo_visitante_nombre: string | null;
}

export interface LocalidadDisponibleDTO {
  id: string;
  nombre: string;
  precio: number;
  capacidad: number;
  disponibles: number;
}

export interface PartidoDisponibleDTO extends PartidoResumenDTO {
  escenario_id: string | null;
  escenario_nombre: string | null;
  localidades: LocalidadDisponibleDTO[];
  cuotas: Record<Pronostico, number>;
}

export interface MiBoletaDTO {
  id: string;
  fecha_compra: string;
  precio: number;
  estado: EstadoBoleta;
  partido: PartidoResumenDTO;
  escenario_nombre: string | null;
  localidad_id: string;
  localidad_nombre: string;
}

export interface MiApuestaDTO {
  id: string;
  fecha_apuesta: string;
  monto: number;
  pronostico: Pronostico;
  cuota: number;
  ganancia_potencial: number;
  estado: EstadoApuesta;
  partido: PartidoResumenDTO;
  metodo_pago_aficionado_id: string;
  metodo_pago_referencia: string;
  metodo_pago_nombre: string | null;
}

/** La cuota, el estado y el aficionado los fija el servidor. */
export interface MiApuestaInput {
  partido_id: string;
  pronostico: Pronostico;
  monto: number;
  metodo_pago_aficionado_id: string;
}

const ME = "/api/business/aficionados/me";
const MIS_METODOS = ME + "/metodos-pago";

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

  misMetodosPago() {
    return request<MiMetodoPagoDTO[]>(MIS_METODOS);
  },

  registrarMetodoPago(input: MiMetodoPagoInput) {
    return request<MiMetodoPagoDTO>(MIS_METODOS, { method: "POST", body: input });
  },

  actualizarMetodoPago(id: string, input: MiMetodoPagoUpdate) {
    return request<MiMetodoPagoDTO>(MIS_METODOS + "/" + encodeURIComponent(id), {
      method: "PATCH",
      body: input,
    });
  },

  eliminarMetodoPago(id: string) {
    return request<{ message: string }>(MIS_METODOS + "/" + encodeURIComponent(id), {
      method: "DELETE",
    });
  },

  metodosPagoDisponibles() {
    return request<MetodoPagoDisponibleDTO[]>(MIS_METODOS + "-disponibles");
  },

  retirarEquipo(equipoId: string) {
    return request<void>(`${ME}/equipos/${encodeURIComponent(equipoId)}`, {
      method: "DELETE",
    });
  },

  partidosDisponibles() {
    return request<PartidoDisponibleDTO[]>(`${ME}/partidos-disponibles`);
  },

  misBoletas() {
    return request<MiBoletaDTO[]>(`${ME}/boletas`);
  },

  /** El precio y el estado los fija el servidor (HU-C). */
  comprarBoleta(input: { partido_id: string; localidad_id: string }) {
    return request<MiBoletaDTO>(`${ME}/boletas`, { method: "POST", body: input });
  },

  misApuestas() {
    return request<MiApuestaDTO[]>(`${ME}/apuestas`);
  },

  apostar(input: MiApuestaInput) {
    return request<MiApuestaDTO>(`${ME}/apuestas`, { method: "POST", body: input });
  },
};

export const equipoAficionadosApi = {
  findByEquipo(equipoId: string) {
    return request<AficionadoDeEquipoDTO[]>(
      `/api/business/equipos/${encodeURIComponent(equipoId)}/aficionados`,
    );
  },
};

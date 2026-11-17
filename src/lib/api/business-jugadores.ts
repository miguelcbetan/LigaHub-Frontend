import { request } from "./business-torneos";

export interface JugadorDTO {
  id: string;
  user_id: number;
  fecha_nacimiento: string;
  nacionalidad: string;
  activo: boolean;
}

export interface JugadorInput {
  user_id: number;
  fecha_nacimiento: string;
  nacionalidad: string;
  activo?: boolean;
}

export type JugadorUpdate = Partial<Omit<JugadorInput, "user_id">>;

const jugadorUrl = (id: string) =>
  `/api/business/jugadores/${encodeURIComponent(id)}`;

export const businessJugadoresApi = {
  findAll() {
    return request<JugadorDTO[]>("/api/business/jugadores");
  },

  findOne(id: string) {
    return request<JugadorDTO>(jugadorUrl(id));
  },

  create(input: JugadorInput) {
    return request<JugadorDTO>("/api/business/jugadores", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: JugadorUpdate) {
    return request<JugadorDTO>(jugadorUrl(id), { method: "PATCH", body: input });
  },

  remove(id: string) {
    return request<void>(jugadorUrl(id), { method: "DELETE" });
  },
};

/** Edad cumplida a hoy para una fecha `YYYY-MM-DD`. */
export function edadDesde(fecha: string, hoy = new Date()): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  let edad = hoy.getFullYear() - anio;
  const mesActual = hoy.getMonth() + 1;
  if (mesActual < mes || (mesActual === mes && hoy.getDate() < dia)) edad -= 1;
  return edad;
}

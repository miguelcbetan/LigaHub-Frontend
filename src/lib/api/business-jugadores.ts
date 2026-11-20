import { request } from "./business-torneos";
import type { HabilidadDTO } from "./business-habilidades";

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

export interface JugadorPerfilEquipoDTO {
  id?: string;
  equipo_id?: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
}

export interface JugadorPerfilHabilidadDTO extends Partial<Omit<HabilidadDTO, "id">> {
  id?: string;
  habilidad_id?: string;
  habilidad?: Pick<HabilidadDTO, "id" | "nombre">;
}

export interface JugadorPerfilDTO {
  jugador: JugadorDTO;
  equipos: JugadorPerfilEquipoDTO[];
  habilidades: JugadorPerfilHabilidadDTO[];
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

  findPerfil(id: string) {
    return request<JugadorPerfilDTO>(
      `${jugadorUrl(id)}/perfil`,
    );
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

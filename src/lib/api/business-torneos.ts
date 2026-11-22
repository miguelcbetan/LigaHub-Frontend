import { getAuthorizationHeaders, handleUnauthorized } from "./http";

export type EstadoTorneo = "PENDIENTE" | "EN_CURSO" | "FINALIZADO";

export interface TorneoDTO {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EstadoTorneo;
  max_equipos: number;
  activo: boolean;
  deporte_id: string;
}

export interface TorneoInput {
  nombre: string;
  descripcion: string;
  estado: EstadoTorneo;
  max_equipos: number;
  deporte_id: string;
  activo?: boolean;
}

export interface TorneoFaseDTO {
  id: string;
  tipo?: string;
  numero_orden?: number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// HU-GC-08: desarrollo del torneo (GET /torneos/:id/desarrollo).
export type EstadoFaseDesarrollo = "PENDIENTE" | "EN_CURSO" | "FINALIZADA";
export type EstadoPartidoDesarrollo =
  | "PROGRAMADO"
  | "EN_JUEGO"
  | "FINALIZADO"
  | "CANCELADO";

export interface EquipoResumenDTO {
  id: string;
  nombre: string;
}

export interface AnotacionDesarrolloDTO {
  id: string;
  minuto: number;
  descripcion: string | null;
  jugador_id: string;
  jugador_user_id: number | null;
  equipo_id: string;
}

export interface PartidoDesarrolloDTO {
  id: string;
  fecha_hora: string;
  estado: EstadoPartidoDesarrollo;
  equipo_local: EquipoResumenDTO;
  equipo_visitante: EquipoResumenDTO;
  escenario_nombre: string | null;
  goles_local: number;
  goles_visitante: number;
  con_resultado: boolean;
  anotaciones: AnotacionDesarrolloDTO[];
}

export interface PosicionDTO {
  posicion: number;
  equipo: EquipoResumenDTO;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface FaseResumenDTO {
  id: string;
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFaseDesarrollo;
}

export interface GrupoDesarrolloDTO {
  fase: FaseResumenDTO;
  nombre: string;
  cupo_equipos: number | null;
  equipos: EquipoResumenDTO[];
  tabla_posiciones: PosicionDTO[];
  partidos: PartidoDesarrolloDTO[];
}

export interface LlaveDTO {
  equipo_a: EquipoResumenDTO;
  equipo_b: EquipoResumenDTO;
  goles_a: number;
  goles_b: number;
  ganador_id: string | null;
  partidos: PartidoDesarrolloDTO[];
}

export interface FinalDesarrolloDTO {
  fase: FaseResumenDTO;
  modalidad: "PARTIDO_UNICO" | "IDA_Y_VUELTA" | null;
  numero_partidos: number | null;
  llaves: LlaveDTO[];
}

export interface EtapaDesarrolloDTO {
  numero_orden: number;
  tipo: "GRUPOS" | "FINAL";
  grupos: GrupoDesarrolloDTO[];
  finales: FinalDesarrolloDTO[];
}

export interface TorneoDesarrolloDTO {
  torneo: TorneoDTO & { deporte_nombre: string | null };
  resumen: {
    total_fases: number;
    total_partidos: number;
    partidos_con_resultado: number;
    partidos_pendientes: number;
  };
  etapas: EtapaDesarrolloDTO[];
}

export class BusinessApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BusinessApiError";
  }
}

function localizedBusinessMessage(message: string): string {
  const mentionsDependencies =
    /has\s+(fases?|phases?|inscripciones?|registrations?|escenarios?|matches|partidos)/i.test(
      message,
    );
  const mentionsDeletion = /\bdelete\b|\bdeactivate\b|\beliminar\b/i.test(message);

  if (mentionsDependencies && mentionsDeletion) {
    return "No se puede eliminar el torneo porque tiene fases, partidos, inscripciones o escenarios asociados. Desactívalo en su lugar.";
  }

  return message;
}

export async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
) {
  const { method = "GET", body } = options;
  let response: Response;

  try {
    const headers = {
      ...getAuthorizationHeaders(),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    };
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BusinessApiError(
      0,
      "No se pudo contactar el servicio de torneos.",
    );
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    let message = `Error ${response.status} al consultar el servicio de torneos.`;
    try {
      const payload: unknown = await response.json();
      if (payload && typeof payload === "object" && "message" in payload) {
        const detail = payload.message;
        if (typeof detail === "string") message = detail;
        else if (Array.isArray(detail))
          message = detail
            .filter((item): item is string => typeof item === "string")
            .join(" ");
      }
    } catch {
      // Si la respuesta de error no es JSON, se conserva el mensaje por estado.
    }
    throw new BusinessApiError(
      response.status,
      localizedBusinessMessage(message),
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const businessTorneosApi = {
  findAll() {
    return request<TorneoDTO[]>("/api/business/torneos");
  },

  findFases(id: string) {
    return request<TorneoFaseDTO[]>(
      `/api/business/torneos/${encodeURIComponent(id)}/fases`,
    );
  },

  findDesarrollo(id: string) {
    return request<TorneoDesarrolloDTO>(
      `/api/business/torneos/${encodeURIComponent(id)}/desarrollo`,
    );
  },

  create(input: TorneoInput) {
    return request<TorneoDTO>("/api/business/torneos", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<TorneoInput>) {
    return request<TorneoDTO>(
      `/api/business/torneos/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: input,
      },
    );
  },

  remove(id: string) {
    return request<void>(`/api/business/torneos/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

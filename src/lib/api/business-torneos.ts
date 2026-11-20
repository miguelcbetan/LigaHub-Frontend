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

import { getAuthorizationHeaders, handleUnauthorized } from "./http";

export type EstadoTorneo = "PENDIENTE" | "EN_CURSO" | "FINALIZADO";

export interface TorneoDTO {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EstadoTorneo;
  max_equipos: number;
  deporte_id: string;
}

export interface TorneoInput {
  nombre: string;
  descripcion: string;
  estado: EstadoTorneo;
  max_equipos: number;
  deporte_id: string;
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

async function request<T>(
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
    throw new BusinessApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const businessTorneosApi = {
  findAll() {
    return request<TorneoDTO[]>("/api/business/torneos");
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

import { getAuthorizationHeaders, handleUnauthorized } from "./http";

export type EstadoAsignacionEscenario = "ACTIVO" | "INACTIVO";

export interface EscenarioTorneoDTO {
  id: string;
  fecha_asignacion: string;
  estado: EstadoAsignacionEscenario;
  escenario_id: string;
  torneo_id: string;
}

export interface EscenarioTorneoInput {
  fecha_asignacion: string;
  estado: EstadoAsignacionEscenario;
  escenario_id: string;
  torneo_id: string;
}

export class BusinessEscenariosTorneoApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BusinessEscenariosTorneoApiError";
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
    throw new BusinessEscenariosTorneoApiError(
      0,
      "No se pudo contactar el servicio de escenarios de torneo.",
    );
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    let message = `Error ${response.status} al consultar el servicio de escenarios de torneo.`;
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
    throw new BusinessEscenariosTorneoApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const businessEscenariosTorneoApi = {
  findAll() {
    return request<EscenarioTorneoDTO[]>("/api/business/escenarios-torneo");
  },

  create(input: EscenarioTorneoInput) {
    return request<EscenarioTorneoDTO>("/api/business/escenarios-torneo", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<EscenarioTorneoInput>) {
    return request<EscenarioTorneoDTO>(
      `/api/business/escenarios-torneo/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: input,
      },
    );
  },

  remove(id: string) {
    return request<void>(
      `/api/business/escenarios-torneo/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },
};

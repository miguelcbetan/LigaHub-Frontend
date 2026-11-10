import { getAuthorizationHeaders, handleUnauthorized } from "./http";

export type EstadoInscripcion = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

export interface InscripcionDTO {
  id: string;
  fecha_inscripcion: string;
  estado: EstadoInscripcion;
  equipo_id: string;
  torneo_id: string;
}

export interface InscripcionInput {
  fecha_inscripcion: string;
  estado: EstadoInscripcion;
  equipo_id: string;
  torneo_id: string;
}

export class BusinessInscripcionesApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BusinessInscripcionesApiError";
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
    throw new BusinessInscripcionesApiError(
      0,
      "No se pudo contactar el servicio de inscripciones.",
    );
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    let message = `Error ${response.status} al consultar el servicio de inscripciones.`;
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
    throw new BusinessInscripcionesApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const businessInscripcionesApi = {
  findAll() {
    return request<InscripcionDTO[]>("/api/business/inscripciones");
  },

  create(input: InscripcionInput) {
    return request<InscripcionDTO>("/api/business/inscripciones", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: Partial<InscripcionInput>) {
    return request<InscripcionDTO>(
      `/api/business/inscripciones/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: input,
      },
    );
  },

  remove(id: string) {
    return request<void>(
      `/api/business/inscripciones/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },
};

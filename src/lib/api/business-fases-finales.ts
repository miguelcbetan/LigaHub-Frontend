import { getAuthorizationHeaders, handleUnauthorized } from "./http";

export type EstadoFase = "PENDIENTE" | "EN_CURSO" | "FINALIZADA";
export type ModalidadFinal = "PARTIDO_UNICO" | "IDA_Y_VUELTA";

export interface FaseFinalDTO {
  id: string;
  tipo: "FINAL";
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFase;
  torneo_id: string;
  numero_partidos: number;
  modalidad: ModalidadFinal;
}

/** Datos que captura el formulario; el tipo FINAL lo agrega la API. */
export interface FaseFinalInput {
  numero_orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoFase;
  torneo_id: string;
  numero_partidos: number;
  modalidad: ModalidadFinal;
}

export class BusinessFasesFinalesApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BusinessFasesFinalesApiError";
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
    throw new BusinessFasesFinalesApiError(
      0,
      "No se pudo contactar el servicio de fases.",
    );
  }

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    let message = `Error ${response.status} al consultar el servicio de fases.`;
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
    throw new BusinessFasesFinalesApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const businessFasesFinalesApi = {
  /** Solo las fases finales: el backend filtra por la columna `tipo`. */
  findAll() {
    return request<FaseFinalDTO[]>("/api/business/fases?tipo=FINAL");
  },

  create(input: FaseFinalInput) {
    return request<FaseFinalDTO>("/api/business/fases", {
      method: "POST",
      body: { ...input, tipo: "FINAL" },
    });
  },

  /** El backend no permite cambiar el tipo, así que no se envía. */
  update(id: string, input: Partial<FaseFinalInput>) {
    return request<FaseFinalDTO>(
      `/api/business/fases/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: input,
      },
    );
  },

  remove(id: string) {
    return request<void>(`/api/business/fases/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

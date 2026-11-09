/**
 * Cliente HTTP único contra ms-security.
 *
 * Responsabilidades: URL base desde el entorno, cabecera Authorization,
 * serialización JSON y normalización de los tres formatos de error que
 * produce el backend.
 */

import type { ApplicationErrorBody } from "./types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8181"
).replace(/\/+$/, "");

/** Error normalizado de la API. `fieldErrors` solo viene en validaciones (400). */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCase?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    options?: { errorCase?: string; fieldErrors?: Record<string, string> },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCase = options?.errorCase;
    this.fieldErrors = options?.fieldErrors;
  }

  /** 401: token ausente, inválido o expirado (el filtro responde sin cuerpo). */
  get isUnauthorized() {
    return this.status === 401;
  }

  /** 403: el rol del usuario no tiene el permiso para esa URL + método. */
  get isForbidden() {
    return this.status === 403;
  }
}

/** Mensaje presentable de cualquier fallo, venga de la API o de JS. */
export function describeError(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Proveedor del token: lo inyecta AuthContext para no acoplar storage aquí. */
type TokenProvider = () => string | null;

let getToken: TokenProvider = () => null;
let onUnauthorized: (() => void) | null = null;

export function configureHttp(options: {
  getToken: TokenProvider;
  onUnauthorized: () => void;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export function getAuthorizationHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function handleUnauthorized() {
  onUnauthorized?.();
}

const MESSAGE_BY_STATUS: Record<number, string> = {
  401: "Tu sesión expiró o no es válida. Vuelve a iniciar sesión.",
  403: "No tienes permisos para realizar esta acción.",
  404: "El recurso solicitado no existe.",
  409: "El registro ya existe.",
  500: "Ocurrió un error interno en el servidor.",
};

/**
 * El backend responde con tres formas distintas según de dónde salga el error:
 * `{errorCase, message}` desde GlobalExceptionHandler, un mapa plano
 * `{campo: mensaje}` en validaciones, y cuerpo vacío en los 401/403 del
 * filtro de seguridad.
 */
async function toApiError(response: Response): Promise<ApiError> {
  const fallback =
    MESSAGE_BY_STATUS[response.status] ??
    `Error ${response.status} al contactar el servidor.`;

  let body: unknown;
  try {
    const text = await response.text();
    body = text ? JSON.parse(text) : undefined;
  } catch {
    return new ApiError(response.status, fallback);
  }

  if (!body || typeof body !== "object") {
    return new ApiError(response.status, fallback);
  }

  const record = body as Record<string, unknown>;

  if (typeof record.errorCase === "string") {
    const { errorCase, message } = record as unknown as ApplicationErrorBody;
    return new ApiError(response.status, message?.trim() || fallback, {
      errorCase,
    });
  }

  // Validación: mapa plano campo → mensaje.
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") fieldErrors[key] = value;
  }

  const first = Object.values(fieldErrors)[0];
  return Object.keys(fieldErrors).length
    ? new ApiError(response.status, first ?? fallback, { fieldErrors })
    : new ApiError(response.status, fallback);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Para el login, que es la única ruta pública. */
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, skipAuth = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!skipAuth) {
    Object.assign(headers, getAuthorizationHeaders());
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "No se pudo contactar el servidor. Verifica que ms-security esté arriba en el puerto 8181.",
    );
  }

  if (!response.ok) {
    const error = await toApiError(response);
    if (error.isUnauthorized && !skipAuth) handleUnauthorized();
    throw error;
  }

  // 204 No Content (delete) y respuestas sin cuerpo.
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiBaseUrl = BASE_URL;

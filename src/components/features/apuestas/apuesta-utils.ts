import type { EstadoApuesta, Pronostico } from "@/lib/api/business-aficionados";

type BadgeTone = "neutral" | "blue" | "yellow" | "red" | "success";

export const PRONOSTICOS: Pronostico[] = ["LOCAL", "EMPATE", "VISITANTE"];

export const PRONOSTICO_LABEL: Record<Pronostico, string> = {
  LOCAL: "Gana local",
  EMPATE: "Empate",
  VISITANTE: "Gana visitante",
};

export const ESTADO_APUESTA_LABEL: Record<EstadoApuesta, string> = {
  PENDIENTE: "Pendiente",
  GANADA: "Ganada",
  PERDIDA: "Perdida",
  ANULADA: "Anulada",
};

export const ESTADO_APUESTA_TONE: Record<EstadoApuesta, BadgeTone> = {
  PENDIENTE: "yellow",
  GANADA: "success",
  PERDIDA: "neutral",
  ANULADA: "red",
};

/**
 * Cuotas fijas del servidor (HU-C). Solo sirven para proponer la cuota en el
 * formulario del administrador; el aficionado usa las que devuelve el servidor.
 */
export const CUOTAS_POR_DEFECTO: Record<Pronostico, number> = {
  LOCAL: 2,
  EMPATE: 3,
  VISITANTE: 2.5,
};

/** Monto > 0 con hasta 2 decimales, como exige el servidor. */
export function esMontoValido(valor: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(valor.trim()) && Number(valor) > 0;
}

export function gananciaPotencial(monto: number, cuota: number): number {
  return Math.round(monto * cuota * 100) / 100;
}

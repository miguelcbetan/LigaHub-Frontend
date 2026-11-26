import type {
  EstadoBoleta,
  PartidoResumenDTO,
} from "@/lib/api/business-aficionados";
import { formatFechaHora } from "@/components/features/partidos/partido-utils";

type BadgeTone = "neutral" | "blue" | "yellow" | "red" | "success";

export const ESTADO_BOLETA_LABEL: Record<EstadoBoleta, string> = {
  ACTIVA: "Activa",
  USADA: "Usada",
  ANULADA: "Anulada",
};

export const ESTADO_BOLETA_TONE: Record<EstadoBoleta, BadgeTone> = {
  ACTIVA: "success",
  USADA: "neutral",
  ANULADA: "red",
};

/** "Tigres vs Leones" (o "Por definir" si falta un equipo). */
export function nombrePartido(
  partido: Pick<PartidoResumenDTO, "equipo_local_nombre" | "equipo_visitante_nombre">,
): string {
  return `${partido.equipo_local_nombre ?? "Por definir"} vs ${
    partido.equipo_visitante_nombre ?? "Por definir"
  }`;
}

/** "Tigres vs Leones · 1 dic 2026, 3:00 p. m." */
export function etiquetaPartido(
  partido: Pick<
    PartidoResumenDTO,
    "equipo_local_nombre" | "equipo_visitante_nombre" | "fecha_hora"
  >,
): string {
  return `${nombrePartido(partido)} · ${formatFechaHora(partido.fecha_hora)}`;
}

const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

export function formatearPesos(valor: number): string {
  return formatoPesos.format(valor);
}

export function mensajeDeError(caught: unknown, fallback: string): string {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

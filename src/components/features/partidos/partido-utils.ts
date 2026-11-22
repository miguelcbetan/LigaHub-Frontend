import type { EquipoDTO } from "@/lib/api/business-equipos";
import type { EscenarioDTO } from "@/lib/api/business-escenarios";
import type { EscenarioTorneoDTO } from "@/lib/api/business-escenarios-torneo";
import type { FaseDTO } from "@/lib/api/business-fases";
import type { InscripcionDTO } from "@/lib/api/business-inscripciones";
import type { EstadoPartido } from "@/lib/api/business-partidos";
import type { TorneoDTO } from "@/lib/api/business-torneos";

/** Datos de referencia que la página carga una vez y comparte con los modales. */
export interface PartidoCatalogos {
  torneos: TorneoDTO[];
  fases: FaseDTO[];
  equipos: EquipoDTO[];
  inscripciones: InscripcionDTO[];
  escenarios: EscenarioDTO[];
  escenariosTorneo: EscenarioTorneoDTO[];
}

export const CATALOGOS_VACIOS: PartidoCatalogos = {
  torneos: [],
  fases: [],
  equipos: [],
  inscripciones: [],
  escenarios: [],
  escenariosTorneo: [],
};

export const ESTADO_LABEL: Record<EstadoPartido, string> = {
  PROGRAMADO: "Programado",
  EN_JUEGO: "En juego",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const ESTADO_TONE: Record<
  EstadoPartido,
  "blue" | "yellow" | "success" | "red"
> = {
  PROGRAMADO: "blue",
  EN_JUEGO: "yellow",
  FINALIZADO: "success",
  CANCELADO: "red",
};

export function faseLabel(fase: FaseDTO | undefined): string {
  if (!fase) return "Sin fase";
  const tipo =
    fase.tipo === "FINAL" ? "Fase final" : (fase.nombre ?? "Fase de grupos");
  return `Etapa ${fase.numero_orden} · ${tipo}`;
}

/** ISO → valor de <input type="datetime-local"> en la hora local. */
export function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Valor de datetime-local (hora local) → ISO 8601 en UTC. */
export function fromDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}

export function formatFechaHora(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Equipos habilitados para un partido de la fase (mismas reglas que Business):
 * activos, con inscripción ACEPTADA en el torneo y, en grupos, del mismo grupo.
 */
export function equiposHabilitados(
  catalogos: PartidoCatalogos,
  torneoId: string,
  fase: FaseDTO | undefined,
): EquipoDTO[] {
  const aceptados = new Set(
    catalogos.inscripciones
      .filter((item) => item.torneo_id === torneoId && item.estado === "ACEPTADA")
      .map((item) => item.equipo_id),
  );
  return catalogos.equipos.filter(
    (equipo) =>
      equipo.activo &&
      aceptados.has(equipo.id) &&
      (fase?.tipo !== "GRUPOS" || equipo.fase_grupos_id === fase.fase_grupos_id),
  );
}

/** Escenarios asignados (activos) al torneo. */
export function escenariosDelTorneo(
  catalogos: PartidoCatalogos,
  torneoId: string,
): EscenarioDTO[] {
  const asignados = new Set(
    catalogos.escenariosTorneo
      .filter((item) => item.torneo_id === torneoId && item.estado === "ACTIVO")
      .map((item) => item.escenario_id),
  );
  return catalogos.escenarios.filter((escenario) => asignados.has(escenario.id));
}

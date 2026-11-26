import type { EscenarioDTO } from "@/lib/api/business-escenarios";

export const ESCENARIO_NOMBRE_MAX = 150;
export const ESCENARIO_DIRECCION_MAX = 255;
export const LOCALIDAD_NOMBRE_MAX = 100;

export const porNombre = (a: { nombre: string }, b: { nombre: string }) =>
  a.nombre.localeCompare(b.nombre, "es");

/**
 * Ids del escenario indicado y de todos sus descendientes. Elegir cualquiera
 * de ellos como padre crearía un ciclo en la jerarquía (CA-03).
 */
export function idsConDescendientes(escenarios: EscenarioDTO[], escenarioId: string): Set<string> {
  const bloqueados = new Set<string>([escenarioId]);
  let agregado = true;
  while (agregado) {
    agregado = false;
    for (const escenario of escenarios) {
      const padre = escenario.escenario_padre_id;
      if (padre && bloqueados.has(padre) && !bloqueados.has(escenario.id)) {
        bloqueados.add(escenario.id);
        agregado = true;
      }
    }
  }
  return bloqueados;
}

/** Escenarios que pueden ser padre del indicado (todos si es uno nuevo). */
export function opcionesDePadre(escenarios: EscenarioDTO[], escenarioId?: string): EscenarioDTO[] {
  const bloqueados = escenarioId ? idsConDescendientes(escenarios, escenarioId) : new Set<string>();
  return escenarios.filter((escenario) => !bloqueados.has(escenario.id)).sort(porNombre);
}

export function nombreDelPadre(escenarios: EscenarioDTO[], padreId?: string | null): string | null {
  if (!padreId) return null;
  return escenarios.find((escenario) => escenario.id === padreId)?.nombre ?? null;
}

export function esEnteroPositivo(valor: string): boolean {
  return /^\d+$/.test(valor.trim()) && Number(valor) >= 1;
}

/** Precio ≥ 0 con hasta 2 decimales, como exige el servicio de negocio. */
export function esPrecioValido(valor: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(valor.trim());
}

export function boletasVendidas(escenario: EscenarioDTO): number {
  return (escenario.localidades ?? []).reduce(
    (total, localidad) => total + (localidad.boletas?.length ?? 0),
    0,
  );
}

export function mensajeDeError(caught: unknown, fallback: string): string {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

export function formatearPrecio(precio: number): string {
  return formatoPrecio.format(precio);
}

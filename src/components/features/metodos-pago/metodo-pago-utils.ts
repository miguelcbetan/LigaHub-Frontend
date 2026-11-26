import type { EstadoMetodoPago, TipoMetodoPago } from "@/lib/api/business-aficionados";

export const MAX_REFERENCIA = 30;

export const TIPO_METODO_LABEL: Record<TipoMetodoPago, string> = {
  TARJETA_CREDITO: "Tarjeta de crédito",
  TARJETA_DEBITO: "Tarjeta de débito",
  BILLETERA_DIGITAL: "Billetera digital",
  PSE: "PSE",
  EFECTIVO: "Efectivo",
};

export const ESTADO_METODO_LABEL: Record<EstadoMetodoPago, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export const ESTADOS_METODO: { value: EstadoMetodoPago; label: string }[] = [
  { value: "ACTIVO", label: ESTADO_METODO_LABEL.ACTIVO },
  { value: "INACTIVO", label: ESTADO_METODO_LABEL.INACTIVO },
];

export function validarReferencia(value: string): string | undefined {
  const referencia = value.trim();
  if (!referencia) return "Ingresa una referencia enmascarada.";
  if ([...referencia].length > MAX_REFERENCIA) return "Usa un máximo de 30 caracteres.";
  if (/\d{5}/.test(referencia) || /^\d{4}(?:[ -]+\d{4}){2,3}$/.test(referencia)) {
    return "Usa una referencia enmascarada, por ejemplo **** 4242.";
  }
}

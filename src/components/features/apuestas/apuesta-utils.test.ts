import { describe, expect, it } from "vitest";
import { nombrePartido } from "@/components/features/boletos/boleto-utils";
import { CUOTAS_POR_DEFECTO, esMontoValido, gananciaPotencial } from "./apuesta-utils";

describe("apuesta-utils", () => {
  it("acepta montos positivos con hasta 2 decimales", () => {
    expect(esMontoValido("10000")).toBe(true);
    expect(esMontoValido("10.5")).toBe(true);
    expect(esMontoValido("0")).toBe(false);
    expect(esMontoValido("10.555")).toBe(false);
    expect(esMontoValido("-5")).toBe(false);
    expect(esMontoValido("")).toBe(false);
  });

  it("calcula la ganancia potencial redondeada a 2 decimales", () => {
    expect(gananciaPotencial(10000, 3)).toBe(30000);
    expect(gananciaPotencial(333.33, 3)).toBe(999.99);
  });

  it("mantiene la tabla de cuotas del servidor", () => {
    expect(CUOTAS_POR_DEFECTO).toEqual({ LOCAL: 2, EMPATE: 3, VISITANTE: 2.5 });
  });

  it("nombra el partido aunque falte un equipo", () => {
    expect(
      nombrePartido({ equipo_local_nombre: "Tigres", equipo_visitante_nombre: null }),
    ).toBe("Tigres vs Por definir");
  });
});

import { describe, expect, it } from "vitest";
import type { EscenarioDTO } from "@/lib/api/business-escenarios";
import {
  boletasVendidas,
  esEnteroPositivo,
  esPrecioValido,
  nombreDelPadre,
  opcionesDePadre,
} from "./escenario-utils";

const escenario = (id: string, padre: string | null = null): EscenarioDTO => ({
  id,
  nombre: `Escenario ${id}`,
  direccion: "Calle 1",
  capacidad: 100,
  escenario_padre_id: padre,
});

// a ← b ← c ; d independiente
const jerarquia = [escenario("c", "b"), escenario("a"), escenario("b", "a"), escenario("d")];

describe("escenario-utils", () => {
  it("ofrece todos los escenarios como padre de uno nuevo, ordenados", () => {
    expect(opcionesDePadre(jerarquia).map((e) => e.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("excluye el propio escenario y sus descendientes para evitar ciclos", () => {
    expect(opcionesDePadre(jerarquia, "a").map((e) => e.id)).toEqual(["d"]);
    expect(opcionesDePadre(jerarquia, "b").map((e) => e.id)).toEqual(["a", "d"]);
    expect(opcionesDePadre(jerarquia, "c").map((e) => e.id)).toEqual(["a", "b", "d"]);
  });

  it("resuelve el nombre del padre", () => {
    expect(nombreDelPadre(jerarquia, "a")).toBe("Escenario a");
    expect(nombreDelPadre(jerarquia, null)).toBeNull();
    expect(nombreDelPadre(jerarquia, "x")).toBeNull();
  });

  it("valida enteros positivos y precios con hasta 2 decimales", () => {
    expect(esEnteroPositivo("1")).toBe(true);
    expect(esEnteroPositivo("0")).toBe(false);
    expect(esEnteroPositivo("2.5")).toBe(false);
    expect(esPrecioValido("0")).toBe(true);
    expect(esPrecioValido("10.55")).toBe(true);
    expect(esPrecioValido("10.555")).toBe(false);
    expect(esPrecioValido("-1")).toBe(false);
  });

  it("suma las boletas vendidas en todas las localidades", () => {
    expect(
      boletasVendidas({
        ...escenario("a"),
        localidades: [
          { id: "l1", nombre: "A", capacidad: 1, precio: 0, escenario_id: "a", boletas: [{ id: "b1" }] },
          { id: "l2", nombre: "B", capacidad: 1, precio: 0, escenario_id: "a", boletas: [] },
        ],
      }),
    ).toBe(1);
  });
});

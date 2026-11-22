import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EquipoAficionadosSection } from "./EquipoAficionadosSection";

const api = vi.hoisted(() => ({ findByEquipo: vi.fn() }));

vi.mock("@/lib/api/business-aficionados", () => ({
  equipoAficionadosApi: { findByEquipo: api.findByEquipo },
}));

describe("EquipoAficionadosSection", () => {
  afterEach(cleanup);
  beforeEach(() => vi.resetAllMocks());

  it("lists the aficionados that follow the equipo", async () => {
    api.findByEquipo.mockResolvedValue([
      {
        asociacion_id: "r-1",
        aficionado_id: "a-1",
        nombre: "Ana Ruiz",
        email: "ana@liga.test",
        telefono: "300",
      },
    ]);
    render(<EquipoAficionadosSection equipoId="e-1" />);

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.getByText("ana@liga.test · 300")).toBeTruthy();
    expect(api.findByEquipo).toHaveBeenCalledWith("e-1");
  });

  it("explains when nobody follows the equipo", async () => {
    api.findByEquipo.mockResolvedValue([]);
    render(<EquipoAficionadosSection equipoId="e-1" />);

    expect(await screen.findByText("Ningún aficionado sigue a este equipo.")).toBeTruthy();
  });
});

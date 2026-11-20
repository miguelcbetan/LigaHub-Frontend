import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TorneoDetailModal } from "./TorneoDetailModal";

const api = vi.hoisted(() => ({ findFases: vi.fn() }));

vi.mock("@/lib/api/business-torneos", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/business-torneos")>()),
  businessTorneosApi: { findFases: api.findFases },
}));

const torneo = {
  id: "t-1",
  nombre: "Torneo Apertura",
  descripcion: "Competencia anual",
  estado: "EN_CURSO" as const,
  max_equipos: 8,
  activo: true,
  deporte_id: "d-1",
};

describe("TorneoDetailModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows tournament information and its phases", async () => {
    api.findFases.mockResolvedValue([
      {
        id: "f-1",
        tipo: "GRUPOS",
        numero_orden: 1,
        estado: "EN_CURSO",
        fecha_inicio: "2026-01-01",
        fecha_fin: "2026-02-01",
      },
    ]);

    render(
      <TorneoDetailModal
        open
        onClose={vi.fn()}
        torneo={torneo}
        deporteNombre="Fútbol"
        canViewFases
      />,
    );

    expect(await screen.findByText("Fase de grupos 1")).toBeTruthy();
    expect(screen.getByText("Competencia anual")).toBeTruthy();
    expect(screen.getByText("Fútbol")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByText("2026-01-01 – 2026-02-01")).toBeTruthy();
    expect(api.findFases).toHaveBeenCalledWith("t-1");
  });

  it("shows an empty state when the tournament has no phases", async () => {
    api.findFases.mockResolvedValue([]);

    render(
      <TorneoDetailModal
        open
        onClose={vi.fn()}
        torneo={torneo}
        deporteNombre="Fútbol"
        canViewFases
      />,
    );

    expect(
      await screen.findByText("Este torneo aún no tiene fases registradas."),
    ).toBeTruthy();
  });

  it("does not request phases without permission", () => {
    render(
      <TorneoDetailModal
        open
        onClose={vi.fn()}
        torneo={torneo}
        deporteNombre="Fútbol"
        canViewFases={false}
      />,
    );

    expect(
      screen.getByText("No tienes permiso para consultar las fases de este torneo."),
    ).toBeTruthy();
    expect(api.findFases).not.toHaveBeenCalled();
  });
});

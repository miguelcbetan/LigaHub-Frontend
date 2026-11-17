import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeporteEquiposModal } from "./DeporteEquiposModal";

const api = vi.hoisted(() => ({ findByDeporte: vi.fn(), findEquipos: vi.fn() }));

vi.mock("@/lib/api/business-equipos-deportes", () => ({
  businessEquiposDeportesApi: { findByDeporte: api.findByDeporte },
}));
vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findAll: api.findEquipos },
}));

const futbol = { id: "d-1", nombre: "Fútbol", descripcion: "", deporte_padre_id: null };

describe("DeporteEquiposModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findEquipos.mockResolvedValue([
      { id: "e-1", nombre: "Tigres", fase_grupos_id: null, activo: true },
      { id: "e-2", nombre: "Leones", fase_grupos_id: null, activo: false },
    ]);
  });

  it("lists only the teams associated with the sport", async () => {
    api.findByDeporte.mockResolvedValue([
      { id: "ed-1", equipo_id: "e-2", deporte_id: "d-1" },
    ]);
    render(<DeporteEquiposModal open onClose={vi.fn()} deporte={futbol} />);

    expect(await screen.findByText("Leones")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
    expect(screen.queryByText("Tigres")).toBeNull();
    expect(api.findByDeporte).toHaveBeenCalledWith("d-1");
  });

  it("shows an empty state when no team plays the sport", async () => {
    api.findByDeporte.mockResolvedValue([]);
    render(<DeporteEquiposModal open onClose={vi.fn()} deporte={futbol} />);

    expect(
      await screen.findByText("Ningún equipo está asociado a este deporte."),
    ).toBeTruthy();
  });

  it("shows the backend error", async () => {
    api.findByDeporte.mockRejectedValue(new Error("Deporte with id d-1 not found"));
    render(<DeporteEquiposModal open onClose={vi.fn()} deporte={futbol} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Deporte with id d-1 not found",
    );
  });
});

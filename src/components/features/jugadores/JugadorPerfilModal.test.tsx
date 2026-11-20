import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JugadorPerfilModal } from "./JugadorPerfilModal";

const api = vi.hoisted(() => ({ findPerfil: vi.fn() }));

vi.mock("@/lib/api/business-jugadores", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/business-jugadores")>()),
  businessJugadoresApi: { findPerfil: api.findPerfil },
}));

const jugador = {
  id: "j-1",
  user_id: 7,
  fecha_nacimiento: "1999-05-10",
  nacionalidad: "Colombiana",
  activo: true,
};

describe("JugadorPerfilModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows basic data, teams, contract state, and assigned skills", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    api.findPerfil.mockResolvedValue({
      jugador,
      equipos: [
        {
          equipo_id: "e-1",
          nombre: "Tigres",
          fecha_inicio: "2026-01-15",
          fecha_fin: null,
          activo: true,
        },
      ],
      habilidades: [
        { habilidad_id: "h-1", habilidad: { id: "h-1", nombre: "Regate" } },
      ],
    });

    render(
      <JugadorPerfilModal
        open
        onClose={vi.fn()}
        jugador={jugador}
        nombreUsuario="Ana Ruiz"
        correoUsuario="ana@liga.test"
      />,
    );

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.getByText("Colombiana")).toBeTruthy();
    expect(screen.getByText("Tigres")).toBeTruthy();
    expect(screen.getByText("Desde 2026-01-15 · sin fecha de fin")).toBeTruthy();
    expect(screen.getByText("Vigente")).toBeTruthy();
    expect(screen.getByText("Regate")).toBeTruthy();
    expect(api.findPerfil).toHaveBeenCalledWith("j-1");
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
      "Each child in a list should have a unique",
    );
  });

  it("explains when the player has no teams or assigned skills", async () => {
    api.findPerfil.mockResolvedValue({ jugador, equipos: [], habilidades: [] });

    render(
      <JugadorPerfilModal
        open
        onClose={vi.fn()}
        jugador={jugador}
        nombreUsuario="Ana Ruiz"
      />,
    );

    expect(await screen.findByText("El jugador no tiene equipos asociados.")).toBeTruthy();
    expect(screen.getByText("El jugador no tiene habilidades registradas.")).toBeTruthy();
  });

  it("shows the profile endpoint error", async () => {
    api.findPerfil.mockRejectedValue(new Error("Jugador no encontrado."));

    render(
      <JugadorPerfilModal
        open
        onClose={vi.fn()}
        jugador={jugador}
        nombreUsuario="Ana Ruiz"
      />,
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Jugador no encontrado.",
    );
  });
});

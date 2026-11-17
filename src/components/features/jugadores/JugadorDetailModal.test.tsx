import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JugadorDetailModal } from "./JugadorDetailModal";

const api = vi.hoisted(() => ({
  findOne: vi.fn(),
  findUser: vi.fn(),
  findByJugador: vi.fn(),
  findEquipos: vi.fn(),
}));

vi.mock("@/lib/api/business-equipo-jugador", () => ({
  businessEquipoJugadorApi: { findByJugador: api.findByJugador },
}));
vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findAll: api.findEquipos },
}));

vi.mock("@/lib/api/business-jugadores", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/business-jugadores")>()),
  businessJugadoresApi: { findOne: api.findOne },
}));
vi.mock("@/lib/api/users", () => ({ usersApi: { findById: api.findUser } }));

const jugador = {
  id: "j-1",
  user_id: 7,
  fecha_nacimiento: "1999-05-10",
  nacionalidad: "Colombiana",
  activo: false,
};

describe("JugadorDetailModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findOne.mockResolvedValue(jugador);
  });

  it("shows the player data together with its platform user", async () => {
    api.findUser.mockResolvedValue({ id: 7, name: "Ana Ruiz", email: "ana@liga.test", active: true });
    render(<JugadorDetailModal open onClose={vi.fn()} jugador={jugador} />);

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.getByText("ana@liga.test")).toBeTruthy();
    expect(screen.getByText("Colombiana")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
    expect(api.findUser).toHaveBeenCalledWith(7);
  });

  it("flags a player whose user no longer exists", async () => {
    api.findUser.mockRejectedValue(new Error("Usuario no encontrado con id: 7"));
    render(<JugadorDetailModal open onClose={vi.fn()} jugador={jugador} />);

    expect(await screen.findByText(/Usuario no encontrado con id: 7/)).toBeTruthy();
  });

  it("lists the current team and the transfer history of the player", async () => {
    api.findUser.mockResolvedValue({ id: 7, name: "Ana Ruiz", email: "ana@liga.test", active: true });
    api.findEquipos.mockResolvedValue([
      { id: "e-1", nombre: "Tigres", fase_grupos_id: null, activo: true },
      { id: "e-2", nombre: "Leones", fase_grupos_id: null, activo: true },
    ]);
    api.findByJugador.mockResolvedValue([
      {
        id: "ej-2",
        equipo_id: "e-2",
        jugador_id: "j-1",
        fecha_inicio: "2026-07-01",
        fecha_fin: null,
        activo: true,
      },
      {
        id: "ej-1",
        equipo_id: "e-1",
        jugador_id: "j-1",
        fecha_inicio: "2026-01-15",
        fecha_fin: "2026-06-30",
        activo: false,
      },
    ]);
    render(<JugadorDetailModal open onClose={vi.fn()} jugador={jugador} canViewEquipos />);

    expect(await screen.findByText("Leones")).toBeTruthy();
    expect(screen.getByText("Vigente")).toBeTruthy();
    expect(screen.getByText("Tigres")).toBeTruthy();
    expect(screen.getByText("Retirado")).toBeTruthy();
    expect(screen.getByText("Desde 2026-01-15 hasta 2026-06-30")).toBeTruthy();
    expect(api.findByJugador).toHaveBeenCalledWith("j-1");
  });

  it("does not query the teams without permission", async () => {
    api.findUser.mockResolvedValue({ id: 7, name: "Ana Ruiz", email: "ana@liga.test", active: true });
    render(<JugadorDetailModal open onClose={vi.fn()} jugador={jugador} />);

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(api.findByJugador).not.toHaveBeenCalled();
    expect(screen.queryByText("Equipos e historial de traspasos")).toBeNull();
  });

  it("reports a missing player", async () => {
    api.findOne.mockRejectedValue(new Error("Jugador with id j-1 not found"));
    render(<JugadorDetailModal open onClose={vi.fn()} jugador={jugador} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Jugador with id j-1 not found",
    );
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HabilidadJugadoresSection } from "./HabilidadJugadoresSection";

const api = vi.hoisted(() => ({
  findByHabilidad: vi.fn(),
  findJugadores: vi.fn(),
  findUsers: vi.fn(),
}));

vi.mock("@/lib/api/business-habilidad-jugador", () => ({
  businessHabilidadJugadorApi: { findByHabilidad: api.findByHabilidad },
}));
vi.mock("@/lib/api/business-jugadores", () => ({
  businessJugadoresApi: { findAll: api.findJugadores },
}));
vi.mock("@/lib/api/users", () => ({ usersApi: { findAll: api.findUsers } }));

const jugador = (id: string, user_id: number, activo = true) => ({
  id,
  user_id,
  fecha_nacimiento: "2000-01-01",
  nacionalidad: "Colombiana",
  activo,
});

describe("HabilidadJugadoresSection", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findJugadores.mockResolvedValue([
      jugador("j-1", 7),
      jugador("j-2", 8, false),
      jugador("j-3", 9),
    ]);
    api.findUsers.mockResolvedValue([
      { id: 7, name: "Ana Ruiz", email: "ana@liga.test", active: true },
      { id: 8, name: "Luis Díaz", email: "luis@liga.test", active: true },
      { id: 9, name: "Sin Habilidad", email: "otro@liga.test", active: true },
    ]);
  });

  it("lists only the jugadores that have the habilidad", async () => {
    api.findByHabilidad.mockResolvedValue([
      { id: "hj-1", habilidad_id: "h-1", jugador_id: "j-1" },
      { id: "hj-2", habilidad_id: "h-1", jugador_id: "j-2" },
    ]);
    render(<HabilidadJugadoresSection habilidadId="h-1" />);

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.getByText("Luis Díaz")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
    expect(screen.queryByText("Sin Habilidad")).toBeNull();
    expect(api.findByHabilidad).toHaveBeenCalledWith("h-1");
  });

  it("explains when no jugador has the habilidad", async () => {
    api.findByHabilidad.mockResolvedValue([]);
    render(<HabilidadJugadoresSection habilidadId="h-1" />);

    expect(await screen.findByText("Ningún jugador tiene esta habilidad.")).toBeTruthy();
  });

  it("falls back to the user id when users cannot be loaded", async () => {
    api.findByHabilidad.mockResolvedValue([
      { id: "hj-1", habilidad_id: "h-1", jugador_id: "j-1" },
    ]);
    api.findUsers.mockRejectedValue(new Error("Sin acceso"));
    render(<HabilidadJugadoresSection habilidadId="h-1" />);

    expect(await screen.findByText("Usuario #7")).toBeTruthy();
  });

  it("reports when the assignments cannot be loaded", async () => {
    api.findByHabilidad.mockRejectedValue(new Error("Servicio no disponible"));
    render(<HabilidadJugadoresSection habilidadId="h-1" />);

    expect((await screen.findByRole("alert")).textContent).toContain("Servicio no disponible");
  });
});

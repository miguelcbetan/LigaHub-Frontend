import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import { EquipoPlantillaModal } from "./EquipoPlantillaModal";

const api = vi.hoisted(() => ({
  findByEquipo: vi.fn(),
  create: vi.fn(),
  retirar: vi.fn(),
  findJugadores: vi.fn(),
  findUsers: vi.fn(),
}));

vi.mock("@/lib/api/business-equipo-jugador", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/business-equipo-jugador")>()),
  businessEquipoJugadorApi: {
    findByEquipo: api.findByEquipo,
    create: api.create,
    retirar: api.retirar,
  },
}));
vi.mock("@/lib/api/business-jugadores", () => ({
  businessJugadoresApi: { findAll: api.findJugadores },
}));
vi.mock("@/lib/api/users", () => ({ usersApi: { findAll: api.findUsers } }));

const equipo = { id: "e-1", nombre: "Tigres", fase_grupos_id: null, activo: true };
const jugadorBase = { fecha_nacimiento: "2000-01-01", nacionalidad: "Colombiana" };
const ana = { id: "j-1", user_id: 1, activo: true, ...jugadorBase };
const luis = { id: "j-2", user_id: 2, activo: true, ...jugadorBase };
const inactivo = { id: "j-3", user_id: 3, activo: false, ...jugadorBase };
const vigente = {
  id: "ej-1",
  equipo_id: "e-1",
  jugador_id: "j-1",
  fecha_inicio: "2026-01-15",
  fecha_fin: null,
  activo: true,
};
const retirado = {
  id: "ej-0",
  equipo_id: "e-1",
  jugador_id: "j-2",
  fecha_inicio: "2025-01-01",
  fecha_fin: "2025-12-31",
  activo: false,
};

function renderPlantilla(permisos = { canAsignar: true, canRetirar: true }) {
  render(
    <ToastProvider>
      <EquipoPlantillaModal open onClose={vi.fn()} equipo={equipo} {...permisos} />
    </ToastProvider>,
  );
}

describe("EquipoPlantillaModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findByEquipo.mockResolvedValue([vigente, retirado]);
    api.findJugadores.mockResolvedValue([ana, luis, inactivo]);
    api.findUsers.mockResolvedValue([
      { id: 1, name: "Ana Ruiz", email: "ana@liga.test", active: true },
      { id: 2, name: "Luis Gómez", email: "luis@liga.test", active: true },
      { id: 3, name: "Pedro Inactivo", email: "pedro@liga.test", active: true },
    ]);
  });

  it("lists the active roster and the transfer history of the team", async () => {
    renderPlantilla();

    expect(await screen.findByText("Plantilla vigente (1)")).toBeTruthy();
    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.getByText("Desde 2026-01-15 · sin fecha de fin")).toBeTruthy();
    expect(screen.getByText("Historial (1)")).toBeTruthy();
    expect(screen.getByText("Desde 2025-01-01 hasta 2025-12-31")).toBeTruthy();
    expect(screen.getByText("Retirado")).toBeTruthy();
    expect(api.findByEquipo).toHaveBeenCalledWith("e-1");
  });

  it("offers only active players and marks those already in the roster", async () => {
    renderPlantilla();

    const enPlantilla = await screen.findByRole("option", { name: "Ana Ruiz (en la plantilla)" });
    expect((enPlantilla as HTMLOptionElement).disabled).toBe(true);
    expect(
      (screen.getByRole("option", { name: "Luis Gómez" }) as HTMLOptionElement).disabled,
    ).toBe(false);
    expect(screen.queryByRole("option", { name: "Pedro Inactivo" })).toBeNull();
  });

  it("assigns a player with contract dates", async () => {
    api.create.mockResolvedValue({
      id: "ej-2",
      equipo_id: "e-1",
      jugador_id: "j-2",
      fecha_inicio: "2026-02-01",
      fecha_fin: "2026-12-31",
      activo: true,
    });
    renderPlantilla();

    const select = await screen.findByRole("combobox", { name: "Asignar jugador *" });
    await screen.findByRole("option", { name: "Luis Gómez" });
    fireEvent.change(select, { target: { value: "j-2" } });
    fireEvent.change(screen.getByLabelText("Inicio del contrato *"), {
      target: { value: "2026-02-01" },
    });
    fireEvent.change(screen.getByLabelText("Fin del contrato"), {
      target: { value: "2026-12-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        equipo_id: "e-1",
        jugador_id: "j-2",
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-12-31",
      }),
    );
    expect(await screen.findByText("Plantilla vigente (2)")).toBeTruthy();
  });

  it("validates the contract dates before calling the API", async () => {
    renderPlantilla();

    const select = await screen.findByRole("combobox", { name: "Asignar jugador *" });
    await screen.findByRole("option", { name: "Luis Gómez" });
    fireEvent.change(select, { target: { value: "j-2" } });
    fireEvent.change(screen.getByLabelText("Inicio del contrato *"), {
      target: { value: "2026-05-01" },
    });
    fireEvent.change(screen.getByLabelText("Fin del contrato"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    expect(
      await screen.findByText("La fecha de fin no puede ser anterior a la de inicio."),
    ).toBeTruthy();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("shows the backend conflict when the player has a contract elsewhere", async () => {
    api.create.mockRejectedValue(
      new Error("Jugador already has an active contract with an equipo; retire it from that equipo first"),
    );
    renderPlantilla();

    const select = await screen.findByRole("combobox", { name: "Asignar jugador *" });
    await screen.findByRole("option", { name: "Luis Gómez" });
    fireEvent.change(select, { target: { value: "j-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "already has an active contract",
    );
    expect(screen.getByText("Plantilla vigente (1)")).toBeTruthy();
  });

  it("retires a player keeping the contract in the history", async () => {
    api.retirar.mockResolvedValue({ ...vigente, activo: false, fecha_fin: "2026-06-30" });
    renderPlantilla();

    fireEvent.click(await screen.findByLabelText("Retirar a Ana Ruiz"));
    expect(api.retirar).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Fecha de salida *"), {
      target: { value: "2026-06-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Retirar del equipo" }));

    await waitFor(() => expect(api.retirar).toHaveBeenCalledWith("ej-1", "2026-06-30"));
    expect(await screen.findByText("Plantilla vigente (0)")).toBeTruthy();
    expect(screen.getByText("Historial (2)")).toBeTruthy();
    expect(screen.getByText("Desde 2026-01-15 hasta 2026-06-30")).toBeTruthy();
  });

  it("rejects a departure date before the contract start", async () => {
    renderPlantilla();

    fireEvent.click(await screen.findByLabelText("Retirar a Ana Ruiz"));
    fireEvent.change(screen.getByLabelText("Fecha de salida *"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Retirar del equipo" }));

    expect(
      await screen.findByText("La fecha de salida no puede ser anterior al inicio del contrato."),
    ).toBeTruthy();
    expect(api.retirar).not.toHaveBeenCalled();
  });

  it("hides assignment and retirement without permissions", async () => {
    renderPlantilla({ canAsignar: false, canRetirar: false });

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Asignar jugador *" })).toBeNull();
    expect(screen.queryByLabelText("Retirar a Ana Ruiz")).toBeNull();
  });

  it("reports when the roster cannot be loaded", async () => {
    api.findByEquipo.mockRejectedValue(new Error("No tiene permiso para acceder a este recurso"));
    renderPlantilla();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No tiene permiso para acceder a este recurso",
    );
  });
});

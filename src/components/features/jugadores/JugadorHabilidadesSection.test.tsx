import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { JugadorHabilidadesSection } from "./JugadorHabilidadesSection";

const api = vi.hoisted(() => ({
  findByJugador: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  findHabilidades: vi.fn(),
  removeHabilidad: vi.fn(),
}));

vi.mock("@/lib/api/business-habilidad-jugador", () => ({
  businessHabilidadJugadorApi: {
    findByJugador: api.findByJugador,
    create: api.create,
    remove: api.remove,
  },
}));
vi.mock("@/lib/api/business-habilidades", () => ({
  businessHabilidadesApi: { findAll: api.findHabilidades, remove: api.removeHabilidad },
}));

const regate = { id: "h-1", nombre: "Regate", descripcion: "Superar rivales" };
const velocidad = { id: "h-2", nombre: "Velocidad", descripcion: "Sprint" };
const asignacion = { id: "hj-1", habilidad_id: "h-1", jugador_id: "j-1" };

function renderSection(permisos = { canAdd: true, canRemove: true }) {
  render(
    <ToastProvider>
      <JugadorHabilidadesSection jugadorId="j-1" {...permisos} />
    </ToastProvider>,
  );
}

async function seleccionar(habilidadId: string) {
  fireEvent.change(await screen.findByRole("combobox", { name: "Asignar habilidad" }), {
    target: { value: habilidadId },
  });
}

describe("JugadorHabilidadesSection", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findByJugador.mockResolvedValue([asignacion]);
    api.findHabilidades.mockResolvedValue([regate, velocidad]);
  });

  it("lists the habilidades of the jugador and blocks repeating them", async () => {
    renderSection();

    expect(await screen.findByRole("button", { name: "Retirar Regate" })).toBeTruthy();
    expect(api.findByJugador).toHaveBeenCalledWith("j-1");
    const opcion = screen.getByRole("option", { name: "Regate (ya asignada)" });
    expect((opcion as HTMLOptionElement).disabled).toBe(true);
  });

  it("explains when the jugador has no habilidades", async () => {
    api.findByJugador.mockResolvedValue([]);
    renderSection();

    expect(await screen.findByText("El jugador no tiene habilidades asignadas.")).toBeTruthy();
  });

  it("assigns another habilidad", async () => {
    api.create.mockResolvedValue({ id: "hj-2", habilidad_id: "h-2", jugador_id: "j-1" });
    renderSection();

    await seleccionar("h-2");
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    expect(await screen.findByRole("button", { name: "Retirar Velocidad" })).toBeTruthy();
    expect(api.create).toHaveBeenCalledWith("h-2", "j-1");
  });

  it("explains a repeated assignment and refreshes the list", async () => {
    api.create.mockRejectedValue(new BusinessApiError(409, "already assigned"));
    renderSection();

    await seleccionar("h-2");
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "El jugador ya tiene esa habilidad.",
    );
    await waitFor(() => expect(api.findByJugador).toHaveBeenCalledTimes(2));
  });

  it("retires a habilidad after confirming, keeping it in the catalog", async () => {
    api.remove.mockResolvedValue(undefined);
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: "Retirar Regate" }));
    fireEvent.click(screen.getByRole("button", { name: "Retirar habilidad" }));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("hj-1"));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Retirar Regate" })).toBeNull(),
    );
    expect(api.removeHabilidad).not.toHaveBeenCalled();
  });

  it("hides the controls without permission", async () => {
    renderSection({ canAdd: false, canRemove: false });

    expect(await screen.findByText("Regate")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Retirar Regate" })).toBeNull();
  });

  it("reports when the habilidades cannot be loaded", async () => {
    api.findByJugador.mockRejectedValue(new Error("Servicio no disponible"));
    renderSection();

    expect((await screen.findByRole("alert")).textContent).toContain("Servicio no disponible");
  });
});

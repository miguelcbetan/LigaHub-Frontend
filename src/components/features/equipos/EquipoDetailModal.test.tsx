import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EquipoDetailModal } from "./EquipoDetailModal";

const api = vi.hoisted(() => ({
  findOne: vi.fn(),
  findByEquipo: vi.fn(),
  createLink: vi.fn(),
  removeLink: vi.fn(),
  findDeportes: vi.fn(),
}));

vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findOne: api.findOne },
}));
vi.mock("@/lib/api/business-equipos-deportes", () => ({
  businessEquiposDeportesApi: {
    findByEquipo: api.findByEquipo,
    create: api.createLink,
    remove: api.removeLink,
  },
}));
vi.mock("@/lib/api/business-deportes", () => ({
  businessDeportesApi: { findAll: api.findDeportes },
}));

const equipo = { id: "e-1", nombre: "Tigres", fase_grupos_id: null, activo: true };
const futbol = { id: "d-1", nombre: "Fútbol", descripcion: "", deporte_padre_id: null };
const baloncesto = { id: "d-2", nombre: "Baloncesto", descripcion: "", deporte_padre_id: null };

function renderDetail() {
  render(
    <EquipoDetailModal
      open
      onClose={vi.fn()}
      equipo={equipo}
      canAddDeporte
      canRemoveDeporte
    />,
  );
}

describe("EquipoDetailModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findOne.mockResolvedValue(equipo);
    api.findByEquipo.mockResolvedValue([
      { id: "ed-1", equipo_id: "e-1", deporte_id: "d-1" },
    ]);
    api.findDeportes.mockResolvedValue([futbol, baloncesto]);
  });

  it("shows the team data and its sports", async () => {
    renderDetail();

    expect(await screen.findByText("Tigres")).toBeTruthy();
    expect(await screen.findByText("Fútbol")).toBeTruthy();
    expect(screen.getByText("Sin asignar")).toBeTruthy();
    expect(api.findByEquipo).toHaveBeenCalledWith("e-1");
  });

  it("adds an available sport and removes an associated one", async () => {
    api.createLink.mockResolvedValue({ id: "ed-2", equipo_id: "e-1", deporte_id: "d-2" });
    api.removeLink.mockResolvedValue(undefined);
    renderDetail();

    const select = await screen.findByRole("combobox", { name: "Agregar deporte" });
    await screen.findByRole("option", { name: "Baloncesto" });
    expect(screen.queryByRole("option", { name: "Fútbol" })).toBeNull();

    fireEvent.change(select, { target: { value: "d-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    await waitFor(() => expect(api.createLink).toHaveBeenCalledWith("e-1", "d-2"));
    expect(await screen.findByLabelText("Quitar Baloncesto")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Quitar Fútbol"));
    await waitFor(() => expect(api.removeLink).toHaveBeenCalledWith("ed-1"));
    await waitFor(() => expect(screen.queryByLabelText("Quitar Fútbol")).toBeNull());
  });

  it("reports a missing team", async () => {
    api.findOne.mockRejectedValue(new Error("Equipo with id e-1 not found"));
    renderDetail();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Equipo with id e-1 not found",
    );
  });
});

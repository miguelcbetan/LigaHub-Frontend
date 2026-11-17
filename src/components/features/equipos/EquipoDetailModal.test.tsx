import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
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
    <ToastProvider>
      <EquipoDetailModal
        open
        onClose={vi.fn()}
        equipo={equipo}
        canAddDeporte
        canRemoveDeporte
      />
    </ToastProvider>,
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
    expect(await screen.findByLabelText("Retirar Fútbol")).toBeTruthy();
    expect(screen.getByText("Sin asignar")).toBeTruthy();
    expect(api.findByEquipo).toHaveBeenCalledWith("e-1");
  });

  it("marks associated sports as unavailable in the selector", async () => {
    renderDetail();

    const asociado = await screen.findByRole("option", { name: "Fútbol (ya asociado)" });
    const disponible = screen.getByRole("option", { name: "Baloncesto" });

    expect((asociado as HTMLOptionElement).disabled).toBe(true);
    expect((disponible as HTMLOptionElement).disabled).toBe(false);
  });

  it("associates an available sport", async () => {
    api.createLink.mockResolvedValue({ id: "ed-2", equipo_id: "e-1", deporte_id: "d-2" });
    renderDetail();

    const select = await screen.findByRole("combobox", { name: "Asociar deporte" });
    await screen.findByRole("option", { name: "Baloncesto" });
    fireEvent.change(select, { target: { value: "d-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Asociar" }));

    await waitFor(() => expect(api.createLink).toHaveBeenCalledWith("e-1", "d-2"));
    expect(await screen.findByLabelText("Retirar Baloncesto")).toBeTruthy();
    expect(
      await screen.findByRole("option", { name: "Baloncesto (ya asociado)" }),
    ).toBeTruthy();
  });

  it("asks for confirmation before removing only the association", async () => {
    api.removeLink.mockResolvedValue(undefined);
    renderDetail();

    fireEvent.click(await screen.findByLabelText("Retirar Fútbol"));
    expect(api.removeLink).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Solo se retira la asociación: el equipo y el deporte se conservan/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retirar asociación" }));

    await waitFor(() => expect(api.removeLink).toHaveBeenCalledWith("ed-1"));
    await waitFor(() => expect(screen.queryByLabelText("Retirar Fútbol")).toBeNull());
  });

  it("keeps the association visible when the removal fails", async () => {
    api.removeLink.mockRejectedValue(new Error("EquipoDeporte with id ed-1 not found"));
    renderDetail();

    fireEvent.click(await screen.findByLabelText("Retirar Fútbol"));
    fireEvent.click(screen.getByRole("button", { name: "Retirar asociación" }));

    await waitFor(() => expect(api.removeLink).toHaveBeenCalled());
    expect(
      (await screen.findAllByText("EquipoDeporte with id ed-1 not found")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Retirar Fútbol")).toBeTruthy();
  });

  it("reports a missing team", async () => {
    api.findOne.mockRejectedValue(new Error("Equipo with id e-1 not found"));
    renderDetail();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Equipo with id e-1 not found",
    );
  });
});

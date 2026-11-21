import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InscripcionFormModal } from "./InscripcionFormModal";

const api = vi.hoisted(() => ({
  findTorneos: vi.fn(),
  findEquipos: vi.fn(),
  findByDeporte: vi.fn(),
  findInscripciones: vi.fn(),
}));

vi.mock("@/lib/api/business-torneos", () => ({
  businessTorneosApi: { findAll: api.findTorneos },
}));
vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findAll: api.findEquipos },
}));
vi.mock("@/lib/api/business-equipos-deportes", () => ({
  businessEquiposDeportesApi: { findByDeporte: api.findByDeporte },
}));
vi.mock("@/lib/api/business-inscripciones", () => ({
  businessInscripcionesApi: { findAll: api.findInscripciones },
}));

describe("InscripcionFormModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findTorneos.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        nombre: "Torneo Apertura",
        descripcion: "Torneo de prueba",
        estado: "PENDIENTE",
        max_equipos: 8,
        activo: true,
        deporte_id: "550e8400-e29b-41d4-a716-446655440020",
      },
    ]);
    api.findEquipos.mockResolvedValue([
      { id: "550e8400-e29b-41d4-a716-446655440010", nombre: "Tigres", activo: true },
      { id: "550e8400-e29b-41d4-a716-446655440011", nombre: "Leones", activo: true },
      { id: "550e8400-e29b-41d4-a716-446655440012", nombre: "Águilas", activo: false },
      { id: "550e8400-e29b-41d4-a716-446655440013", nombre: "Halcones", activo: true },
    ]);
    api.findByDeporte.mockResolvedValue([
      { id: "ed-1", equipo_id: "550e8400-e29b-41d4-a716-446655440010" },
      { id: "ed-2", equipo_id: "550e8400-e29b-41d4-a716-446655440011" },
      { id: "ed-3", equipo_id: "550e8400-e29b-41d4-a716-446655440012" },
    ]);
    api.findInscripciones.mockResolvedValue([]);
  });

  it("lets the user register multiple active teams associated with the tournament sport", async () => {
    const onSubmit = vi.fn();
    render(
      <InscripcionFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        canListTorneos
        canListEquipos
        canListRelaciones
        canCheckDuplicates
      />,
    );

    const tournamentSelect = screen.getByRole("combobox", { name: "Torneo" });
    await screen.findByRole("option", {
      name: "Torneo Apertura · Pendiente",
    });
    fireEvent.change(tournamentSelect, {
      target: { value: "550e8400-e29b-41d4-a716-446655440000" },
    });
    await screen.findByText("Tigres");
    expect(screen.getByText("Leones")).toBeTruthy();
    expect(screen.queryByText("Águilas")).toBeNull();
    expect(screen.queryByText("Halcones")).toBeNull();

    fireEvent.change(screen.getByLabelText("Fecha de inscripción"), {
      target: { value: "2026-11-09" },
    });
    fireEvent.click(screen.getByLabelText("Tigres"));
    fireEvent.click(screen.getByLabelText("Leones"));
    fireEvent.click(screen.getByRole("button", { name: "Inscribir equipos" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([
      {
        fecha_inscripcion: "2026-11-09",
        estado: "PENDIENTE",
        equipo_id: "550e8400-e29b-41d4-a716-446655440010",
        torneo_id: "550e8400-e29b-41d4-a716-446655440000",
      },
      {
        fecha_inscripcion: "2026-11-09",
        estado: "PENDIENTE",
        equipo_id: "550e8400-e29b-41d4-a716-446655440011",
        torneo_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    ]));
  });

  it("hides teams already registered in the selected tournament", async () => {
    api.findInscripciones.mockResolvedValue([
      {
        id: "i-1",
        equipo_id: "550e8400-e29b-41d4-a716-446655440010",
        torneo_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    ]);
    render(
      <InscripcionFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        canListTorneos
        canListEquipos
        canListRelaciones
        canCheckDuplicates
      />,
    );

    await screen.findByRole("option", { name: "Torneo Apertura · Pendiente" });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: "550e8400-e29b-41d4-a716-446655440000" },
    });

    await screen.findByText("Leones");
    expect(screen.queryByText("Tigres")).toBeNull();
  });
});

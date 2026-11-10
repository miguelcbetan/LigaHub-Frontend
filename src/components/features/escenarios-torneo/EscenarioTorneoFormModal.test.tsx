import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EscenarioTorneoFormModal } from "./EscenarioTorneoFormModal";

const { findAll } = vi.hoisted(() => ({ findAll: vi.fn() }));

vi.mock("@/lib/api/business-torneos", () => ({
  businessTorneosApi: { findAll },
}));

describe("EscenarioTorneoFormModal", () => {
  beforeEach(() => {
    findAll.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        nombre: "Torneo Apertura",
        descripcion: "Torneo de prueba",
        estado: "PENDIENTE",
        max_equipos: 8,
        deporte_id: "550e8400-e29b-41d4-a716-446655440020",
      },
    ]);
  });

  it("loads existing tournaments and submits the selected tournament ID", async () => {
    const onSubmit = vi.fn();
    render(
      <EscenarioTorneoFormModal open onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    const tournamentSelect = screen.getByRole("combobox", { name: "Torneo" });
    await screen.findByRole("option", {
      name: "Torneo Apertura — 550e8400-e29b-41d4-a716-446655440000",
    });

    fireEvent.change(screen.getByLabelText("Fecha de asignación"), {
      target: { value: "2026-11-09" },
    });
    fireEvent.change(screen.getByLabelText("ID del escenario"), {
      target: { value: "550e8400-e29b-41d4-a716-446655440030" },
    });
    fireEvent.change(tournamentSelect, {
      target: { value: "550e8400-e29b-41d4-a716-446655440000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar escenario" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        fecha_asignacion: "2026-11-09",
        estado: "ACTIVO",
        escenario_id: "550e8400-e29b-41d4-a716-446655440030",
        torneo_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );
  });
});

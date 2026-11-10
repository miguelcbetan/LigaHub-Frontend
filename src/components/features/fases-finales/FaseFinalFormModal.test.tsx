import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaseFinalFormModal } from "./FaseFinalFormModal";

const { findAll } = vi.hoisted(() => ({ findAll: vi.fn() }));

vi.mock("@/lib/api/business-torneos", () => ({
  businessTorneosApi: { findAll },
}));

const TORNEO_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("FaseFinalFormModal", () => {
  beforeEach(() => {
    findAll.mockResolvedValue([
      {
        id: TORNEO_ID,
        nombre: "Torneo Apertura",
        descripcion: "Torneo de prueba",
        estado: "PENDIENTE",
        max_equipos: 8,
        deporte_id: "550e8400-e29b-41d4-a716-446655440020",
      },
    ]);
  });

  afterEach(cleanup);

  it("has no type selector and submits the final phase fields", async () => {
    const onSubmit = vi.fn();
    render(<FaseFinalFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });
    expect(screen.queryByLabelText(/tipo/i)).toBeNull();

    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2026-11-10" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de fin"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Número de partidos"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Modalidad" }), {
      target: { value: "IDA_Y_VUELTA" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: TORNEO_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase final" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        numero_orden: 3,
        fecha_inicio: "2026-11-10",
        fecha_fin: "2026-11-20",
        estado: "PENDIENTE",
        torneo_id: TORNEO_ID,
        numero_partidos: 2,
        modalidad: "IDA_Y_VUELTA",
      }),
    );
  });

  it("rejects an end date before the start date", async () => {
    const onSubmit = vi.fn();
    render(<FaseFinalFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });

    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de fin"), {
      target: { value: "2026-11-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase final" }));

    expect(
      await screen.findByText(
        "La fecha de fin no puede ser anterior a la fecha de inicio.",
      ),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

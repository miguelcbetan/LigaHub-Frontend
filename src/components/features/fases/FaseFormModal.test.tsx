import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaseFormModal } from "./FaseFormModal";

const api = vi.hoisted(() => ({ findTorneos: vi.fn() }));

vi.mock("@/lib/api/business-torneos", () => ({
  businessTorneosApi: { findAll: api.findTorneos },
}));

const TORNEO_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("FaseFormModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findTorneos.mockResolvedValue([
      {
        id: TORNEO_ID,
        nombre: "Torneo Apertura",
        estado: "PENDIENTE",
        activo: true,
        max_equipos: 8,
        deporte_id: "d-1",
        descripcion: "Torneo de prueba",
      },
    ]);
  });

  it("creates a phase of groups with group configuration", async () => {
    const onSubmit = vi.fn();
    render(
      <FaseFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        canListTorneos
      />,
    );

    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });
    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del grupo"), {
      target: { value: "Grupo A" },
    });
    fireEvent.change(screen.getByLabelText("Cupo de equipos"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: TORNEO_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        tipo: "GRUPOS",
        numero_orden: 1,
        fecha_inicio: expect.any(String),
        fecha_fin: expect.any(String),
        estado: "PENDIENTE",
        torneo_id: TORNEO_ID,
        nombre: "Grupo A",
        cupo_equipos: 4,
      }),
    );
    expect(screen.queryByLabelText("Número de partidos")).toBeNull();
    expect(screen.queryByLabelText("Modalidad")).toBeNull();
  });

  it("translates Business group validation errors into Spanish", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new Error(
        "cupo_equipos must not be less than 2 cupo_equipos must be an integer number",
      ),
    );
    render(
      <FaseFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        canListTorneos
      />,
    );

    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });
    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del grupo"), {
      target: { value: "Grupo A" },
    });
    fireEvent.change(screen.getByLabelText("Cupo de equipos"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: TORNEO_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("El grupo debe admitir al menos 2 equipos.");
    expect(alert.textContent).toContain("El cupo de equipos debe ser un número entero.");
    expect(alert.textContent).not.toContain("must");
  });

  it("requires the final-specific configuration for a final phase", async () => {
    const onSubmit = vi.fn();
    render(
      <FaseFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        canListTorneos
      />,
    );

    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tipo de fase" }), {
      target: { value: "FINAL" },
    });
    expect(screen.getByLabelText("Número de partidos")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Número de partidos"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: TORNEO_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "FINAL",
          numero_orden: 2,
          torneo_id: TORNEO_ID,
          numero_partidos: 1,
          modalidad: "PARTIDO_UNICO",
        }),
      ),
    );
  });

  it("shows Business conflict messages when a phase order is duplicated", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Ya existe una fase con ese orden."));
    render(
      <FaseFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        canListTorneos
      />,
    );

    await screen.findByRole("option", {
      name: `Torneo Apertura — ${TORNEO_ID}`,
    });
    fireEvent.change(screen.getByLabelText("Número de orden"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del grupo"), {
      target: { value: "Grupo A" },
    });
    fireEvent.change(screen.getByLabelText("Cupo de equipos"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Torneo" }), {
      target: { value: TORNEO_ID },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear fase" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Ya existe una fase con ese orden.",
    );
  });
});

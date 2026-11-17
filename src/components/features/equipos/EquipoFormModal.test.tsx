import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EquipoFormModal } from "./EquipoFormModal";

describe("EquipoFormModal", () => {
  afterEach(cleanup);

  it("registers a team with its trimmed name", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<EquipoFormModal open onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nombre *"), {
      target: { value: "  Tigres FC " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar equipo" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ nombre: "Tigres FC" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("loads the current data when editing", () => {
    render(
      <EquipoFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        equipo={{ id: "e-1", nombre: "Leones", fase_grupos_id: null, activo: true }}
      />,
    );

    expect(screen.getByLabelText("Nombre *")).toHaveProperty("value", "Leones");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeTruthy();
  });

  it("requires the name before submitting", () => {
    const onSubmit = vi.fn();
    render(<EquipoFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Registrar equipo" }));

    expect(screen.getByText("El nombre del equipo es obligatorio.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the backend error and keeps the modal open", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("nombre must be a string"));
    render(<EquipoFormModal open onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nombre *"), {
      target: { value: "Tigres" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar equipo" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "nombre must be a string",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

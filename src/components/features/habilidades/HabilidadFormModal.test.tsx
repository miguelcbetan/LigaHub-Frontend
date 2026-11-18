import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { HabilidadFormModal } from "./HabilidadFormModal";

const velocidad = {
  id: "550e8400-e29b-41d4-a716-446655440300",
  nombre: "Velocidad",
  descripcion: "Desplazamiento rápido",
};

function llenar(nombre: string, descripcion: string) {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: nombre } });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: descripcion },
  });
}

describe("HabilidadFormModal", () => {
  afterEach(cleanup);

  it("submits the trimmed values and closes", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<HabilidadFormModal open onClose={onClose} onSubmit={onSubmit} />);

    llenar(" Resistencia ", " Mantiene el esfuerzo ");
    fireEvent.click(screen.getByRole("button", { name: "Crear habilidad" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      nombre: "Resistencia",
      descripcion: "Mantiene el esfuerzo",
    });
  });

  it("loads the current values when editing", () => {
    render(
      <HabilidadFormModal open onClose={vi.fn()} onSubmit={vi.fn()} habilidad={velocidad} />,
    );

    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Velocidad");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeTruthy();
  });

  it("requires name and description before submitting", () => {
    const onSubmit = vi.fn();
    render(<HabilidadFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    llenar("   ", "   ");
    fireEvent.click(screen.getByRole("button", { name: "Crear habilidad" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Completa el nombre y la descripción",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("explains a duplicated name and stays open", async () => {
    const onClose = vi.fn();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new BusinessApiError(409, "already exists"));
    render(<HabilidadFormModal open onClose={onClose} onSubmit={onSubmit} />);

    llenar("Velocidad", "Otra descripción");
    fireEvent.click(screen.getByRole("button", { name: "Crear habilidad" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Ya existe una habilidad con ese nombre.",
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

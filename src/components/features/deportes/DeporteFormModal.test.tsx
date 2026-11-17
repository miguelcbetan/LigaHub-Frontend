import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeporteFormModal } from "./DeporteFormModal";

const futbol = {
  id: "550e8400-e29b-41d4-a716-446655440020",
  nombre: "Fútbol",
  descripcion: "Fútbol once",
  deporte_padre_id: null,
};

function llenar(nombre: string, descripcion: string) {
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: nombre },
  });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: descripcion },
  });
}

describe("DeporteFormModal", () => {
  afterEach(cleanup);

  it("creates a top-level sport without a parent", async () => {
    const onSubmit = vi.fn();
    render(
      <DeporteFormModal open onClose={vi.fn()} onSubmit={onSubmit} deportes={[futbol]} />,
    );

    llenar(" Baloncesto ", "Cinco contra cinco");
    fireEvent.click(screen.getByRole("button", { name: "Crear deporte" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Baloncesto",
        descripcion: "Cinco contra cinco",
        deporte_padre_id: null,
      }),
    );
  });

  it("submits the selected parent sport", async () => {
    const onSubmit = vi.fn();
    render(
      <DeporteFormModal open onClose={vi.fn()} onSubmit={onSubmit} deportes={[futbol]} />,
    );

    llenar("Fútbol 5", "Fútbol sala");
    fireEvent.change(screen.getByRole("combobox", { name: "Deporte padre" }), {
      target: { value: futbol.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear deporte" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Fútbol 5",
        descripcion: "Fútbol sala",
        deporte_padre_id: futbol.id,
      }),
    );
  });

  it("does not offer a sport as its own parent when editing", () => {
    render(
      <DeporteFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        deporte={futbol}
        deportes={[futbol]}
      />,
    );

    expect(screen.queryByRole("option", { name: "Fútbol" })).toBeNull();
  });

  it("requires name and description before submitting", () => {
    const onSubmit = vi.fn();
    render(
      <DeporteFormModal open onClose={vi.fn()} onSubmit={onSubmit} deportes={[]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Crear deporte" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Completa el nombre y la descripción",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

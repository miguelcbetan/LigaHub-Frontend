import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EscenarioDTO } from "@/lib/api/business-escenarios";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { EscenarioFormModal } from "./EscenarioFormModal";

const complejo: EscenarioDTO = {
  id: "e-1",
  nombre: "Complejo Norte",
  direccion: "Calle 1",
  capacidad: 5000,
  escenario_padre_id: null,
};
const cancha: EscenarioDTO = {
  id: "e-2",
  nombre: "Cancha 1",
  direccion: "Calle 1 interior",
  capacidad: 800,
  escenario_padre_id: "e-1",
};
const coliseo: EscenarioDTO = {
  id: "e-3",
  nombre: "Coliseo",
  direccion: "Carrera 9",
  capacidad: 3000,
  escenario_padre_id: null,
};
const escenarios = [complejo, cancha, coliseo];

function llenar(nombre: string, direccion: string, capacidad: string) {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: nombre } });
  fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: direccion } });
  fireEvent.change(screen.getByLabelText("Capacidad"), { target: { value: capacidad } });
}

const opcionesDePadre = () =>
  Array.from((screen.getByLabelText("Escenario padre") as HTMLSelectElement).options).map(
    (option) => option.textContent,
  );

describe("EscenarioFormModal", () => {
  afterEach(cleanup);

  it("crea un escenario con valores recortados y padre opcional", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <EscenarioFormModal open onClose={onClose} onSubmit={onSubmit} escenarios={escenarios} />,
    );

    llenar("  Cancha 2 ", " Calle 1 interior ", "600");
    fireEvent.change(screen.getByLabelText("Escenario padre"), { target: { value: "e-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear escenario" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      nombre: "Cancha 2",
      direccion: "Calle 1 interior",
      capacidad: 600,
      escenario_padre_id: "e-1",
    });
  });

  it("omite el padre al crear un escenario raíz", async () => {
    const onSubmit = vi.fn();
    render(
      <EscenarioFormModal open onClose={vi.fn()} onSubmit={onSubmit} escenarios={escenarios} />,
    );

    llenar("Estadio", "Calle 50", "40000");
    fireEvent.click(screen.getByRole("button", { name: "Crear escenario" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Estadio",
        direccion: "Calle 50",
        capacidad: 40000,
      }),
    );
  });

  it("valida cada campo antes de enviar", () => {
    const onSubmit = vi.fn();
    render(
      <EscenarioFormModal open onClose={vi.fn()} onSubmit={onSubmit} escenarios={escenarios} />,
    );

    llenar("  ", "", "0");
    fireEvent.click(screen.getByRole("button", { name: "Crear escenario" }));

    expect(screen.getByText("Ingresa el nombre del escenario.")).toBeTruthy();
    expect(screen.getByText("Ingresa la dirección del escenario.")).toBeTruthy();
    expect(screen.getByText(/La capacidad debe ser un número entero/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("no ofrece como padre el propio escenario ni sus descendientes", () => {
    render(
      <EscenarioFormModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        escenarios={escenarios}
        escenario={complejo}
      />,
    );

    expect(opcionesDePadre()).toEqual(["Sin escenario padre", "Coliseo"]);
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Complejo Norte");
  });

  it("envía null al quitar el padre en edición", async () => {
    const onSubmit = vi.fn();
    render(
      <EscenarioFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        escenarios={escenarios}
        escenario={cancha}
      />,
    );

    fireEvent.change(screen.getByLabelText("Escenario padre"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Cancha 1",
        direccion: "Calle 1 interior",
        capacidad: 800,
        escenario_padre_id: null,
      }),
    );
  });

  it("muestra el error del servidor y queda abierto", async () => {
    const onClose = vi.fn();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new BusinessApiError(400, "Esta relación crearía un ciclo"));
    render(
      <EscenarioFormModal
        open
        onClose={onClose}
        onSubmit={onSubmit}
        escenarios={escenarios}
        escenario={cancha}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("crearía un ciclo"),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import type { LocalidadDTO } from "@/lib/api/business-localidades";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { EscenarioLocalidadesSection } from "./EscenarioLocalidadesSection";

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() }));

vi.mock("@/lib/api/business-localidades", () => ({
  businessLocalidadesApi: api,
}));

const oriental: LocalidadDTO = {
  id: "l-1",
  nombre: "Oriental",
  capacidad: 500,
  precio: 25000,
  escenario_id: "e-1",
  boletas: [{ id: "b-1" }, { id: "b-2" }],
};

function renderSection({
  localidades = [oriental],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onChange = vi.fn(),
} = {}) {
  render(
    <ToastProvider>
      <EscenarioLocalidadesSection
        escenarioId="e-1"
        localidades={localidades}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onChange={onChange}
      />
    </ToastProvider>,
  );
  return onChange;
}

function llenar(nombre: string, capacidad: string, precio: string) {
  fireEvent.change(screen.getByLabelText("Nombre de la localidad"), {
    target: { value: nombre },
  });
  fireEvent.change(screen.getByLabelText("Capacidad"), { target: { value: capacidad } });
  fireEvent.change(screen.getByLabelText("Precio"), { target: { value: precio } });
}

describe("EscenarioLocalidadesSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it("lista las localidades con su precio y boletas vendidas", () => {
    renderSection();

    expect(screen.getByText("Localidades (1)")).toBeTruthy();
    expect(screen.getByText("Oriental")).toBeTruthy();
    expect(screen.getByText(/2 boletas vendidas/)).toBeTruthy();
  });

  it("crea una localidad en el escenario y avisa del cambio", async () => {
    api.create.mockResolvedValue({ ...oriental, id: "l-2", nombre: "Palco" });
    const onChange = renderSection({ localidades: [] });

    fireEvent.click(screen.getByRole("button", { name: "Nueva localidad" }));
    llenar(" Palco ", "50", "120000.50");
    fireEvent.click(screen.getByRole("button", { name: "Crear localidad" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(api.create).toHaveBeenCalledWith({
      nombre: "Palco",
      capacidad: 50,
      precio: 120000.5,
      escenario_id: "e-1",
    });
  });

  it("rechaza precios con más de 2 decimales y capacidades no enteras", () => {
    renderSection({ localidades: [] });

    fireEvent.click(screen.getByRole("button", { name: "Nueva localidad" }));
    llenar("Palco", "2.5", "10.555");
    fireEvent.click(screen.getByRole("button", { name: "Crear localidad" }));

    expect(screen.getByText("Debe ser un entero mayor o igual a 1.")).toBeTruthy();
    expect(screen.getByText(/máximo 2 decimales/)).toBeTruthy();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("edita una localidad sin cambiar su escenario", async () => {
    api.update.mockResolvedValue({ ...oriental, precio: 30000 });
    const onChange = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Editar localidad Oriental" }));
    fireEvent.change(screen.getByLabelText("Precio"), { target: { value: "30000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar localidad" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(api.update).toHaveBeenCalledWith("l-1", {
      nombre: "Oriental",
      capacidad: 500,
      precio: 30000,
    });
  });

  it("muestra el motivo cuando la localidad tiene boletas y la conserva", async () => {
    const message =
      'La localidad "Oriental" tiene boletas asociadas. Elimine esas boletas primero';
    api.remove.mockRejectedValue(new BusinessApiError(409, message));
    const onChange = renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar localidad Oriental" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain(message));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Oriental")).toBeTruthy();
  });

  it("oculta las acciones sin permisos", () => {
    renderSection({ canCreate: false, canEdit: false, canDelete: false });

    expect(screen.queryByRole("button", { name: "Nueva localidad" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar localidad Oriental" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar localidad Oriental" })).toBeNull();
  });
});

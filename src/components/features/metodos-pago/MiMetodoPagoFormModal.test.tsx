import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { MetodoPagoDisponibleDTO, MiMetodoPagoDTO } from "@/lib/api/business-aficionados";
import { MiMetodoPagoFormModal } from "./MiMetodoPagoFormModal";

afterEach(cleanup);

const catalogo: MetodoPagoDisponibleDTO[] = [{ id: "visa", nombre: "Visa", tipo: "TARJETA_CREDITO" }];
const registro: MiMetodoPagoDTO = {
  id: "registro", referencia: "**** 4242", fecha_registro: "2026-11-01",
  predeterminado: false, estado: "ACTIVO", metodo_pago_id: "visa",
  metodo_pago_nombre: "Visa", metodo_pago_tipo: "TARJETA_CREDITO", tiene_apuestas: false,
};

it("registra un método del catálogo sin enviar aficionado ni estado", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<MiMetodoPagoFormModal open catalogo={catalogo} onSave={onSave} onClose={vi.fn()} />);

  fireEvent.change(screen.getByLabelText("Método de pago"), { target: { value: "visa" } });
  fireEvent.change(screen.getByLabelText("Referencia enmascarada"), { target: { value: "**** 4242" } });
  fireEvent.click(screen.getByLabelText("Predeterminado"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    metodo_pago_id: "visa", referencia: "**** 4242", predeterminado: true,
  }));
});

it("bloquea una referencia sin enmascarar con espacios", () => {
  const onSave = vi.fn();
  render(<MiMetodoPagoFormModal open catalogo={catalogo} onSave={onSave} onClose={vi.fn()} />);

  fireEvent.change(screen.getByLabelText("Método de pago"), { target: { value: "visa" } });
  fireEvent.change(screen.getByLabelText("Referencia enmascarada"), { target: { value: "4111 1111 1111 1111" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText(/usa una referencia enmascarada/i)).toBeTruthy();
});

it("edita el estado sin ofrecer el selector del catálogo", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<MiMetodoPagoFormModal open registro={registro} onSave={onSave} onClose={vi.fn()} />);

  expect(screen.queryByLabelText("Método de pago")).toBeNull();
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "INACTIVO" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    referencia: "**** 4242", predeterminado: false, estado: "INACTIVO",
  }));
});

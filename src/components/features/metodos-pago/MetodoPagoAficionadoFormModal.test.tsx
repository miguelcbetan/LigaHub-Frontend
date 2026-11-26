import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type {
  MetodoPagoAficionadoDTO,
  MetodoPagoCatalogoDTO,
} from "@/lib/api/business-metodos-pago-aficionado";
import { MetodoPagoAficionadoFormModal } from "./MetodoPagoAficionadoFormModal";

afterEach(cleanup);

const aficionados = [{ id: "ana", nombre: "Ana Pérez", documento: "1001" }];
const catalogo: MetodoPagoCatalogoDTO[] = [
  { id: "visa", nombre: "Visa", tipo: "TARJETA_CREDITO", activo: true },
  { id: "pse", nombre: "PSE antiguo", tipo: "PSE", activo: false },
];

it("registra para un aficionado y filtra los métodos inactivos", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <MetodoPagoAficionadoFormModal open aficionados={aficionados} catalogo={catalogo} onClose={vi.fn()} onSave={onSave} />,
  );

  expect(screen.getByRole("option", { name: /Ana Pérez.*1001/ })).toBeTruthy();
  expect(screen.queryByRole("option", { name: /PSE antiguo/ })).toBeNull();
  fireEvent.change(screen.getByLabelText("Aficionado"), { target: { value: "ana" } });
  fireEvent.change(screen.getByLabelText("Método de pago"), { target: { value: "visa" } });
  fireEvent.change(screen.getByLabelText("Referencia enmascarada"), { target: { value: "**** 4242" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    aficionado_id: "ana", metodo_pago_id: "visa", referencia: "**** 4242",
    predeterminado: false, estado: "ACTIVO",
  }));
});

it("edita sin cambiar aficionado ni método de pago", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const registro: MetodoPagoAficionadoDTO = {
    id: "registro", aficionado_id: "ana", metodo_pago_id: "visa", referencia: "**** 4242",
    fecha_registro: "2026-11-01", predeterminado: false, estado: "ACTIVO",
  };
  render(<MetodoPagoAficionadoFormModal open registro={registro} onClose={vi.fn()} onSave={onSave} />);

  expect(screen.queryByLabelText("Aficionado")).toBeNull();
  expect(screen.queryByLabelText("Método de pago")).toBeNull();
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "INACTIVO" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    referencia: "**** 4242", predeterminado: false, estado: "INACTIVO",
  }));
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MiMetodoPagoDTO, PartidoDisponibleDTO } from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { ApostarModal } from "./ApostarModal";

const partido: PartidoDisponibleDTO = {
  id: "p-1",
  fecha_hora: "2026-12-01T20:00:00Z",
  estado: "PROGRAMADO",
  equipo_local_nombre: "Tigres",
  equipo_visitante_nombre: "Leones",
  escenario_id: null,
  escenario_nombre: null,
  localidades: [],
  cuotas: { LOCAL: 2, EMPATE: 3, VISITANTE: 2.5 },
};
const metodo = (id: string, extra: Partial<MiMetodoPagoDTO> = {}): MiMetodoPagoDTO => ({
  id,
  referencia: `**** ${id}`,
  fecha_registro: "2026-11-01T10:00:00Z",
  predeterminado: false,
  estado: "ACTIVO",
  metodo_pago_id: "visa",
  metodo_pago_nombre: "Visa",
  metodo_pago_tipo: "TARJETA_CREDITO",
  tiene_apuestas: false,
  ...extra,
});
const metodos = [
  metodo("1111"),
  metodo("2222", { predeterminado: true }),
  metodo("3333", { estado: "INACTIVO" }),
];

function renderModal(onApostar = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(
    <ApostarModal open onClose={onClose} partidos={[partido]} metodos={metodos} onApostar={onApostar} />,
  );
  return { onApostar, onClose };
}

describe("ApostarModal", () => {
  afterEach(cleanup);

  it("ofrece solo métodos activos y preselecciona el predeterminado", () => {
    renderModal();

    const select = screen.getByLabelText("Método de pago") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["", "1111", "2222"]);
    expect(select.value).toBe("2222");
  });

  it("muestra la cuota del servidor y la ganancia, y no envía cuota ni estado", async () => {
    const { onApostar, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Empate/ }));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "10000" } });

    expect(screen.getByRole("button", { name: /Empate.*3\.00/ })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/30\.000/);

    fireEvent.click(screen.getByRole("button", { name: "Apostar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onApostar).toHaveBeenCalledWith({
      partido_id: "p-1",
      pronostico: "EMPATE",
      monto: 10000,
      metodo_pago_aficionado_id: "2222",
    });
  });

  it("valida pronóstico y monto antes de enviar", () => {
    const { onApostar } = renderModal();

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "10.555" } });
    fireEvent.click(screen.getByRole("button", { name: "Apostar" }));

    expect(screen.getByText("Elige tu pronóstico.")).toBeTruthy();
    expect(screen.getByText(/máximo 2 decimales/)).toBeTruthy();
    expect(onApostar).not.toHaveBeenCalled();
  });

  it("muestra el rechazo del servidor y queda abierto", async () => {
    const { onClose } = renderModal(
      vi.fn().mockRejectedValue(
        new BusinessApiError(400, "Las apuestas solo se pueden registrar en partidos programados"),
      ),
    );

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Gana local/ }));
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Apostar" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("programados"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PartidoDisponibleDTO } from "@/lib/api/business-aficionados";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { ComprarBoletoModal } from "./ComprarBoletoModal";

const cuotas = { LOCAL: 2, EMPATE: 3, VISITANTE: 2.5 };
const clasico: PartidoDisponibleDTO = {
  id: "p-1",
  fecha_hora: "2026-12-01T20:00:00Z",
  estado: "PROGRAMADO",
  equipo_local_nombre: "Tigres",
  equipo_visitante_nombre: "Leones",
  escenario_id: "e-1",
  escenario_nombre: "Estadio",
  localidades: [
    { id: "l-1", nombre: "Oriental", precio: 25000, capacidad: 10, disponibles: 3 },
    { id: "l-2", nombre: "Palco", precio: 90000, capacidad: 2, disponibles: 0 },
  ],
  cuotas,
};
const sinEscenario: PartidoDisponibleDTO = {
  ...clasico,
  id: "p-2",
  equipo_local_nombre: "Pumas",
  escenario_id: null,
  escenario_nombre: null,
  localidades: [],
};

function renderModal(onComprar = vi.fn().mockResolvedValue(undefined), onAgotada = vi.fn()) {
  const onClose = vi.fn();
  render(
    <ComprarBoletoModal
      open
      onClose={onClose}
      partidos={[clasico, sinEscenario]}
      onComprar={onComprar}
      onAgotada={onAgotada}
    />,
  );
  return { onComprar, onAgotada, onClose };
}

describe("ComprarBoletoModal", () => {
  afterEach(cleanup);

  it("ofrece solo partidos con escenario y deshabilita las localidades agotadas", () => {
    renderModal();

    const opciones = Array.from(
      (screen.getByLabelText("Partido") as HTMLSelectElement).options,
    ).map((o) => o.value);
    expect(opciones).toEqual(["", "p-1"]);

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    expect(screen.getByRole("button", { name: /Oriental/ })).toHaveProperty("disabled", false);
    expect(screen.getByRole("button", { name: /Palco.*Agotada/ })).toHaveProperty("disabled", true);
    expect(screen.getByText(/Quedan 3/)).toBeTruthy();
  });

  it("compra en la localidad elegida sin enviar precio ni aficionado", async () => {
    const { onComprar, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Oriental/ }));
    fireEvent.click(screen.getByRole("button", { name: /Comprar por/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onComprar).toHaveBeenCalledWith({ partido_id: "p-1", localidad_id: "l-1" });
  });

  it("muestra el motivo y refresca el cupo si la localidad se agotó", async () => {
    const message = 'La localidad "Oriental" está agotada para este partido';
    const { onAgotada, onClose } = renderModal(
      vi.fn().mockRejectedValue(new BusinessApiError(409, message)),
    );

    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Oriental/ }));
    fireEvent.click(screen.getByRole("button", { name: /Comprar por/ }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("agotada"));
    expect(onAgotada).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

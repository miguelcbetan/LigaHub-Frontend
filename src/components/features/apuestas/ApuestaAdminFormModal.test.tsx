import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MetodoPagoAficionadoDTO } from "@/lib/api/business-metodos-pago-aficionado";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import { ApuestaAdminFormModal } from "./ApuestaAdminFormModal";

const partido = (id: string, estado: PartidoDTO["estado"]): PartidoDTO =>
  ({
    id,
    fecha_hora: "2026-12-01T20:00:00Z",
    estado,
    equipo_local_nombre: "Tigres",
    equipo_visitante_nombre: "Leones",
  }) as PartidoDTO;
const metodo = (id: string, aficionado: string, estado: "ACTIVO" | "INACTIVO" = "ACTIVO") =>
  ({ id, referencia: `**** ${id}`, aficionado_id: aficionado, estado }) as MetodoPagoAficionadoDTO;

function renderModal(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(
    <ApuestaAdminFormModal
      open
      onClose={onClose}
      aficionados={[
        { id: "a-1", nombre: "Ana", documento: "1001" },
        { id: "a-2", nombre: "Beto", documento: "1002" },
      ]}
      partidos={[partido("p-1", "PROGRAMADO"), partido("p-2", "FINALIZADO")]}
      metodos={[metodo("m-1", "a-1"), metodo("m-2", "a-1", "INACTIVO"), metodo("m-3", "a-2")]}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, onClose };
}

const opciones = (label: string) =>
  Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.value);

describe("ApuestaAdminFormModal", () => {
  afterEach(cleanup);

  it("ofrece partidos programados y los métodos activos del aficionado elegido", () => {
    renderModal();

    expect(opciones("Partido")).toEqual(["", "p-1"]);
    fireEvent.change(screen.getByLabelText("Aficionado"), { target: { value: "a-1" } });
    expect(opciones("Método de pago")).toEqual(["", "m-1"]);
  });

  it("propone la cuota de la tabla según el pronóstico y la envía", async () => {
    const { onSubmit, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Aficionado"), { target: { value: "a-1" } });
    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.change(screen.getByLabelText("Pronóstico"), { target: { value: "VISITANTE" } });
    expect((screen.getByLabelText("Cuota") as HTMLInputElement).value).toBe("2.5");
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "8000" } });
    fireEvent.change(screen.getByLabelText("Método de pago"), { target: { value: "m-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar apuesta" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      aficionado_id: "a-1",
      partido_id: "p-1",
      metodo_pago_aficionado_id: "m-1",
      pronostico: "VISITANTE",
      monto: 8000,
      cuota: 2.5,
    });
  });

  it("valida la cuota mínima", () => {
    const { onSubmit } = renderModal();

    fireEvent.change(screen.getByLabelText("Cuota"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar apuesta" }));

    expect(screen.getByText(/mayor o igual a 1/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

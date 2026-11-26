import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocalidadDTO } from "@/lib/api/business-localidades";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { BoletoAdminFormModal } from "./BoletoAdminFormModal";

const partido = (id: string, escenario: string | null): PartidoDTO =>
  ({
    id,
    fecha_hora: "2026-12-01T20:00:00Z",
    estado: "PROGRAMADO",
    equipo_local_id: "t",
    equipo_visitante_id: "l",
    equipo_local_nombre: "Tigres",
    equipo_visitante_nombre: "Leones",
    goles_local: 0,
    goles_visitante: 0,
    escenario_id: escenario,
    escenario_nombre: escenario ? "Estadio" : null,
    fase_id: null,
    fase_tipo: null,
    torneo_id: null,
  }) as PartidoDTO;
const localidades: LocalidadDTO[] = [
  { id: "l-1", nombre: "Oriental", capacidad: 10, precio: 25000, escenario_id: "e-1" },
  { id: "l-9", nombre: "Otra", capacidad: 10, precio: 1000, escenario_id: "e-2" },
];

function renderModal(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(
    <BoletoAdminFormModal
      open
      onClose={onClose}
      aficionados={[{ id: "a-1", nombre: "Ana", documento: "1001" }]}
      partidos={[partido("p-1", "e-1"), partido("p-2", null)]}
      localidades={localidades}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, onClose };
}

const opciones = (label: string) =>
  Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.value);

describe("BoletoAdminFormModal", () => {
  afterEach(cleanup);

  it("ofrece partidos con escenario y solo las localidades de ese escenario", () => {
    renderModal();

    expect(opciones("Partido")).toEqual(["", "p-1"]);
    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    expect(opciones("Localidad")).toEqual(["", "l-1"]);
  });

  it("registra la boleta con el precio de la localidad si se deja vacío", async () => {
    const { onSubmit, onClose } = renderModal();

    fireEvent.change(screen.getByLabelText("Aficionado"), { target: { value: "a-1" } });
    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.change(screen.getByLabelText("Localidad"), { target: { value: "l-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar boleta" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      aficionado_id: "a-1",
      partido_id: "p-1",
      localidad_id: "l-1",
    });
  });

  it("muestra el 409 de cupo y queda abierto", async () => {
    const { onClose } = renderModal(
      vi.fn().mockRejectedValue(new BusinessApiError(409, "La localidad está agotada")),
    );

    fireEvent.change(screen.getByLabelText("Aficionado"), { target: { value: "a-1" } });
    fireEvent.change(screen.getByLabelText("Partido"), { target: { value: "p-1" } });
    fireEvent.change(screen.getByLabelText("Localidad"), { target: { value: "l-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar boleta" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("agotada"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import { MisEquiposPanel } from "./MisEquiposPanel";

const api = vi.hoisted(() => ({ asociar: vi.fn(), retirar: vi.fn() }));

vi.mock("@/lib/api/business-aficionados", () => ({
  miAficionadoApi: { asociarEquipo: api.asociar, retirarEquipo: api.retirar },
}));

const tigres = { asociacion_id: "r-1", equipo_id: "e-1", nombre: "Tigres", activo: true };
const aficionado = {
  id: "a-1",
  user_id: 7,
  nombre: "Ana Ruiz",
  documento: "1001",
  email: "ana@liga.test",
  telefono: null,
  equipos: [tigres],
};
const disponibles = [
  { id: "e-1", nombre: "Tigres" },
  { id: "e-2", nombre: "Leones" },
];

function renderPanel(onChange = vi.fn()) {
  render(
    <ToastProvider>
      <MisEquiposPanel
        aficionado={aficionado}
        disponibles={disponibles}
        canAsociar
        canRetirar
        onChange={onChange}
      />
    </ToastProvider>,
  );
  return onChange;
}

describe("MisEquiposPanel", () => {
  afterEach(cleanup);
  beforeEach(() => vi.resetAllMocks());

  it("follows a new equipo and marks the ones already followed", async () => {
    api.asociar.mockResolvedValue({
      asociacion_id: "r-2",
      equipo_id: "e-2",
      nombre: "Leones",
      activo: true,
    });
    const onChange = renderPanel();

    expect(screen.getByRole("option", { name: "Tigres (ya lo sigues)" })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.change(screen.getByLabelText("Seguir otro equipo"), { target: { value: "e-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));

    await waitFor(() => expect(api.asociar).toHaveBeenCalledWith("e-2"));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ nombre: "Leones" }), tigres]);
  });

  it("withdraws only the association after confirming", async () => {
    api.retirar.mockResolvedValue(undefined);
    const onChange = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Dejar de seguir" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Dejar de seguir" }));

    await waitFor(() => expect(api.retirar).toHaveBeenCalledWith("e-1"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

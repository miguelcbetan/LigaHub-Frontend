import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JugadorFormModal } from "./JugadorFormModal";

const usuarios = [
  { id: 7, name: "Ana Ruiz", email: "ana@liga.test", active: true },
  { id: 8, name: "Luis Gómez", email: "luis@liga.test", active: true },
];
const existente = {
  id: "j-1",
  user_id: 8,
  fecha_nacimiento: "1995-03-20",
  nacionalidad: "Peruana",
  activo: true,
};

function renderForm(props: Partial<Parameters<typeof JugadorFormModal>[0]> = {}) {
  const handlers = { onCreate: vi.fn(), onUpdate: vi.fn(), onClose: vi.fn() };
  render(
    <JugadorFormModal
      open
      usuarios={usuarios}
      loadingUsuarios={false}
      usuariosError=""
      jugadores={[existente]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("JugadorFormModal", () => {
  afterEach(cleanup);

  it("registers a player for a user that is not a player yet", async () => {
    const { onCreate, onClose } = renderForm();

    fireEvent.change(screen.getByRole("combobox", { name: "Usuario *" }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento *"), {
      target: { value: "2001-08-15" },
    });
    fireEvent.change(screen.getByLabelText("Nacionalidad *"), {
      target: { value: " Colombiana " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar jugador" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        user_id: 7,
        fecha_nacimiento: "2001-08-15",
        nacionalidad: "Colombiana",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("marks users that are already players as unavailable", () => {
    renderForm();

    const ocupado = screen.getByRole("option", {
      name: "Luis Gómez — luis@liga.test (ya es jugador)",
    }) as HTMLOptionElement;
    expect(ocupado.disabled).toBe(true);
  });

  it("validates required fields and future dates before submitting", () => {
    const { onCreate } = renderForm();

    fireEvent.change(screen.getByLabelText("Fecha de nacimiento *"), {
      target: { value: "2999-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar jugador" }));

    expect(screen.getByText("Selecciona el usuario del jugador.")).toBeTruthy();
    expect(screen.getByText("La fecha de nacimiento no puede ser futura.")).toBeTruthy();
    expect(screen.getByText("La nacionalidad es obligatoria.")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("edits sports data without allowing the user to change", async () => {
    const { onUpdate } = renderForm({ jugador: existente });

    expect(screen.queryByRole("combobox", { name: "Usuario *" })).toBeNull();
    expect(screen.getByText("Luis Gómez — luis@liga.test")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nacionalidad *"), {
      target: { value: "Chilena" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith({
        fecha_nacimiento: "1995-03-20",
        nacionalidad: "Chilena",
      }),
    );
  });

  it("shows the backend duplicate error and keeps the modal open", async () => {
    const { onClose } = renderForm({
      onCreate: vi.fn().mockRejectedValue(new Error("A jugador for user 7 already exists")),
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Usuario *" }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento *"), {
      target: { value: "2001-08-15" },
    });
    fireEvent.change(screen.getByLabelText("Nacionalidad *"), {
      target: { value: "Colombiana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar jugador" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "A jugador for user 7 already exists",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

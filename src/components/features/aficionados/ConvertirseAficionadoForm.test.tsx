import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BusinessApiError } from "@/lib/api/business-torneos";
import { ConvertirseAficionadoForm } from "./ConvertirseAficionadoForm";

const equipos = [
  { id: "e-1", nombre: "Tigres" },
  { id: "e-2", nombre: "Leones" },
];

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ConvertirseAficionadoForm
      equipos={equipos}
      nombreInicial="Ana Ruiz"
      emailInicial="ana@liga.test"
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("ConvertirseAficionadoForm", () => {
  afterEach(cleanup);

  it("prefills the session data and sends the chosen equipos", async () => {
    const onSubmit = renderForm();

    expect(screen.getByLabelText("Nombre")).toHaveProperty("value", "Ana Ruiz");
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "1001" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Tigres" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Leones" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Leones" }));
    fireEvent.click(screen.getByRole("button", { name: "Convertirme en aficionado" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: "Ana Ruiz",
        documento: "1001",
        email: "ana@liga.test",
        equipo_ids: ["e-1"],
      }),
    );
  });

  it("requires the documento before submitting", async () => {
    const onSubmit = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Convertirme en aficionado" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Completa tu nombre, documento y correo.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the conflict message from the backend", async () => {
    renderForm(
      vi.fn().mockRejectedValue(
        new BusinessApiError(409, "Ya existe un aficionado con el documento 1001"),
      ),
    );

    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "1001" } });
    fireEvent.click(screen.getByRole("button", { name: "Convertirme en aficionado" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Ya existe un aficionado con el documento 1001",
    );
  });
});

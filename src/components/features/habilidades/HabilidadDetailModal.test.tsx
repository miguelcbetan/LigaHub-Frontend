import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessHabilidadesApi } from "@/lib/api/business-habilidades";
import { HabilidadDetailModal } from "./HabilidadDetailModal";

const velocidad = {
  id: "550e8400-e29b-41d4-a716-446655440300",
  nombre: "Velocidad",
  descripcion: "Desplazamiento rápido",
};

describe("HabilidadDetailModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the detail returned by the API", async () => {
    const findOne = vi
      .spyOn(businessHabilidadesApi, "findOne")
      .mockResolvedValue(velocidad);

    render(<HabilidadDetailModal open onClose={vi.fn()} habilidad={velocidad} />);

    expect(await screen.findByText("Desplazamiento rápido")).toBeTruthy();
    expect(findOne).toHaveBeenCalledWith(velocidad.id);
  });

  it("shows the error when the habilidad cannot be loaded", async () => {
    vi.spyOn(businessHabilidadesApi, "findOne").mockRejectedValue(
      new Error("Habilidad no encontrada"),
    );

    render(<HabilidadDetailModal open onClose={vi.fn()} habilidad={velocidad} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Habilidad no encontrada",
    );
  });
});

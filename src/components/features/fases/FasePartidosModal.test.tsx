import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FaseDTO } from "@/lib/api/business-fases";
import { FasePartidosModal } from "./FasePartidosModal";

const api = vi.hoisted(() => ({
  findPartidos: vi.fn(),
  findEquipos: vi.fn(),
}));

vi.mock("@/lib/api/business-fases", () => ({
  businessFasesApi: { findPartidos: api.findPartidos },
}));

vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findAll: api.findEquipos },
}));

const fase: FaseDTO = {
  id: "f-1",
  tipo: "FINAL",
  numero_orden: 2,
  fecha_inicio: "2026-11-10",
  fecha_fin: "2026-11-20",
  estado: "EN_CURSO",
  torneo_id: "t-1",
  numero_partidos: 2,
  modalidad: "IDA_Y_VUELTA",
};

describe("FasePartidosModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findEquipos.mockResolvedValue([
      { id: "e-1", nombre: "Once Caldas" },
      { id: "e-2", nombre: "Deportes Tolima" },
    ]);
  });

  it("lists the matches of the final phase with team names", async () => {
    api.findPartidos.mockResolvedValue([
      {
        id: "p-1",
        fecha_hora: "2026-11-12T19:30:00.000Z",
        estado: "FINALIZADO",
        equipo_local_id: "e-1",
        equipo_visitante_id: "e-2",
        goles_local: 2,
        goles_visitante: 1,
        escenario_id: "s-1",
        fase_id: "f-1",
        fase_tipo: "FINAL",
      },
    ]);

    render(
      <FasePartidosModal
        open
        onClose={vi.fn()}
        fase={fase}
        torneoNombre="Apertura"
        canListEquipos
      />,
    );

    expect(
      await screen.findByText("Once Caldas 2 - 1 Deportes Tolima"),
    ).toBeTruthy();
    expect(screen.getByText("Fase final")).toBeTruthy();
    expect(screen.getByText("Finalizado")).toBeTruthy();
    expect(api.findPartidos).toHaveBeenCalledWith("f-1");
  });

  it("shows an empty message when the phase has no matches", async () => {
    api.findPartidos.mockResolvedValue([]);

    render(
      <FasePartidosModal
        open
        onClose={vi.fn()}
        fase={fase}
        canListEquipos={false}
      />,
    );

    expect(
      await screen.findByText(
        "Esta fase final aún no tiene partidos registrados.",
      ),
    ).toBeTruthy();
    expect(api.findEquipos).not.toHaveBeenCalled();
  });

  it("shows the Business error message", async () => {
    api.findPartidos.mockRejectedValue(new Error("La fase no fue encontrada"));

    render(
      <FasePartidosModal
        open
        onClose={vi.fn()}
        fase={fase}
        canListEquipos={false}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "La fase no fue encontrada",
    );
  });
});

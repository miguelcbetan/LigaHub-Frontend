import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { businessFasesApi } from "@/lib/api/business-fases";
import { businessInscripcionesApi } from "@/lib/api/business-inscripciones";
import { businessTorneosApi } from "@/lib/api/business-torneos";
import { EquipoGrupoModal } from "./EquipoGrupoModal";

vi.mock("@/lib/api/business-fases", () => ({
  businessFasesApi: { findAll: vi.fn() },
}));
vi.mock("@/lib/api/business-inscripciones", () => ({
  businessInscripcionesApi: { findAll: vi.fn() },
}));
vi.mock("@/lib/api/business-torneos", () => ({
  businessTorneosApi: { findAll: vi.fn() },
}));

const equipo = { id: "e-1", nombre: "Tigres", fase_grupos_id: null, activo: true };

describe("EquipoGrupoModal", () => {
  beforeEach(() => {
    vi.mocked(businessInscripcionesApi.findAll).mockResolvedValue([
      { id: "i-1", fecha_inscripcion: "2026-11-01", estado: "ACEPTADA", equipo_id: "e-1", torneo_id: "t-1" },
      { id: "i-2", fecha_inscripcion: "2026-11-01", estado: "RECHAZADA", equipo_id: "e-1", torneo_id: "t-2" },
    ]);
    vi.mocked(businessFasesApi.findAll).mockResolvedValue([
      {
        id: "f-1",
        tipo: "GRUPOS",
        numero_orden: 1,
        fecha_inicio: "2026-11-10",
        fecha_fin: "2026-11-20",
        estado: "PENDIENTE",
        torneo_id: "t-1",
        fase_grupos_id: "g-1",
        nombre: "Grupo A",
        cupo_equipos: 4,
      },
    ]);
    vi.mocked(businessTorneosApi.findAll).mockResolvedValue([
      { id: "t-1", nombre: "Copa Apertura" } as never,
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("only loads groups of tournaments where the team is accepted", async () => {
    render(<EquipoGrupoModal open onClose={vi.fn()} equipo={equipo} onSubmit={vi.fn()} />);

    await screen.findByRole("option", { name: "Grupo A — Copa Apertura (cupo 4)" });
    expect(businessFasesApi.findAll).toHaveBeenCalledTimes(1);
    expect(businessFasesApi.findAll).toHaveBeenCalledWith({ tipo: "GRUPOS", torneo_id: "t-1" });
  });

  it("submits the selected group id", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<EquipoGrupoModal open onClose={onClose} equipo={equipo} onSubmit={onSubmit} />);

    await screen.findByRole("option", { name: "Grupo A — Copa Apertura (cupo 4)" });
    fireEvent.change(screen.getByRole("combobox", { name: "Grupo" }), {
      target: { value: "g-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("g-1"));
    expect(onClose).toHaveBeenCalled();
  });

  it("submits null to leave the team without a group", async () => {
    const onSubmit = vi.fn();
    render(
      <EquipoGrupoModal
        open
        onClose={vi.fn()}
        equipo={{ ...equipo, fase_grupos_id: "g-1" }}
        onSubmit={onSubmit}
      />,
    );

    await screen.findByRole("option", { name: "Grupo A — Copa Apertura (cupo 4)" });
    fireEvent.change(screen.getByRole("combobox", { name: "Grupo" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(null));
  });

  it("shows the backend error when the group is full", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('El grupo "Grupo A" ya completó su cupo de 4 equipos'));
    render(<EquipoGrupoModal open onClose={vi.fn()} equipo={equipo} onSubmit={onSubmit} />);

    await screen.findByRole("option", { name: "Grupo A — Copa Apertura (cupo 4)" });
    fireEvent.change(screen.getByRole("combobox", { name: "Grupo" }), {
      target: { value: "g-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "ya completó su cupo de 4 equipos",
    );
  });
});

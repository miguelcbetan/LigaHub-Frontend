import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import type { FaseDTO } from "@/lib/api/business-fases";
import { GrupoEquiposModal } from "./GrupoEquiposModal";

const api = vi.hoisted(() => ({
  findEquiposGrupo: vi.fn(),
  asignarEquiposGrupo: vi.fn(),
  quitarEquipoGrupo: vi.fn(),
  findEquipos: vi.fn(),
  findInscripciones: vi.fn(),
}));

vi.mock("@/lib/api/business-fases", () => ({
  businessFasesApi: {
    findEquiposGrupo: api.findEquiposGrupo,
    asignarEquiposGrupo: api.asignarEquiposGrupo,
    quitarEquipoGrupo: api.quitarEquipoGrupo,
  },
}));
vi.mock("@/lib/api/business-equipos", () => ({
  businessEquiposApi: { findAll: api.findEquipos },
}));
vi.mock("@/lib/api/business-inscripciones", () => ({
  businessInscripcionesApi: { findAll: api.findInscripciones },
}));

const grupo: FaseDTO = {
  id: "f-1",
  tipo: "GRUPOS",
  numero_orden: 1,
  fecha_inicio: "2026-03-01",
  fecha_fin: "2026-03-15",
  estado: "PENDIENTE",
  torneo_id: "t-1",
  fase_grupos_id: "g-1",
  nombre: "Grupo A",
  cupo_equipos: 3,
};

const tigres = { id: "e-1", nombre: "Tigres", fase_grupos_id: "g-1", activo: true };
const leones = { id: "e-2", nombre: "Leones", fase_grupos_id: null, activo: true };
const pumas = { id: "e-3", nombre: "Pumas", fase_grupos_id: null, activo: true };
const otroGrupo = { id: "e-4", nombre: "Osos", fase_grupos_id: "g-9", activo: true };
const inactivo = { id: "e-5", nombre: "Lobos", fase_grupos_id: null, activo: false };
const sinInscripcion = { id: "e-6", nombre: "Halcones", fase_grupos_id: null, activo: true };

const aceptada = (equipo_id: string) => ({
  id: `i-${equipo_id}`,
  fecha_inscripcion: "2026-02-01",
  estado: "ACEPTADA",
  equipo_id,
  torneo_id: "t-1",
});

function renderModal(props: { canAssign?: boolean; canRemove?: boolean } = {}) {
  return render(
    <ToastProvider>
      <GrupoEquiposModal
        open
        onClose={vi.fn()}
        grupo={grupo}
        torneoNombre="Copa Caldas"
        canAssign={props.canAssign ?? true}
        canRemove={props.canRemove ?? true}
      />
    </ToastProvider>,
  );
}

describe("GrupoEquiposModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findEquiposGrupo.mockResolvedValue([tigres]);
    api.findEquipos.mockResolvedValue([
      tigres,
      leones,
      pumas,
      otroGrupo,
      inactivo,
      sinInscripcion,
    ]);
    api.findInscripciones.mockResolvedValue([
      aceptada("e-1"),
      aceptada("e-2"),
      aceptada("e-3"),
      aceptada("e-4"),
      aceptada("e-5"),
      { ...aceptada("e-6"), estado: "PENDIENTE" },
    ]);
  });

  it("lists the teams of the group and its capacity", async () => {
    renderModal();

    expect(await screen.findByText("Tigres")).toBeTruthy();
    expect(screen.getByText("1 / 3 equipos")).toBeTruthy();
    expect(screen.getByText("Copa Caldas · Fase 1")).toBeTruthy();
    expect(api.findEquiposGrupo).toHaveBeenCalledWith("f-1");
  });

  it("only offers active, accepted teams without a group", async () => {
    renderModal();

    expect(await screen.findByRole("checkbox", { name: /Leones/ })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: /Pumas/ })).toBeTruthy();
    expect(screen.queryByText("Osos")).toBeNull();
    expect(screen.queryByText("Lobos")).toBeNull();
    expect(screen.queryByText("Halcones")).toBeNull();
    expect(api.findInscripciones).toHaveBeenCalledWith({ torneo_id: "t-1" });
  });

  it("assigns several teams at once", async () => {
    api.asignarEquiposGrupo.mockResolvedValue([
      tigres,
      { ...leones, fase_grupos_id: "g-1" },
      { ...pumas, fase_grupos_id: "g-1" },
    ]);
    renderModal();

    fireEvent.click(await screen.findByRole("checkbox", { name: /Leones/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Pumas/ }));
    fireEvent.click(screen.getByRole("button", { name: "Asignar 2 equipos" }));

    await waitFor(() =>
      expect(api.asignarEquiposGrupo).toHaveBeenCalledWith("f-1", ["e-2", "e-3"]),
    );
    expect(await screen.findByText("3 / 3 equipos")).toBeTruthy();
    expect(screen.getByText("No hay equipos disponibles para asignar.")).toBeTruthy();
  });

  it("shows the backend error when the assignment is rejected", async () => {
    api.asignarEquiposGrupo.mockRejectedValue(
      new Error('El equipo "Leones" ya está asignado al grupo "Grupo B"'),
    );
    renderModal();

    fireEvent.click(await screen.findByRole("checkbox", { name: /Leones/ }));
    fireEvent.click(screen.getByRole("button", { name: "Asignar 1 equipo" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "ya está asignado al grupo",
    );
  });

  it("removes a team from the group", async () => {
    api.quitarEquipoGrupo.mockResolvedValue({ message: "ok" });
    renderModal();

    fireEvent.click(
      await screen.findByRole("button", { name: "Quitar Tigres del grupo" }),
    );

    await waitFor(() =>
      expect(api.quitarEquipoGrupo).toHaveBeenCalledWith("f-1", "e-1"),
    );
    expect(await screen.findByText("Este grupo aún no tiene equipos asignados.")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: /Tigres/ })).toBeTruthy();
  });

  it("hides the management actions without permissions", async () => {
    renderModal({ canAssign: false, canRemove: false });

    expect(await screen.findByText("Tigres")).toBeTruthy();
    expect(screen.queryByText("Agregar equipos")).toBeNull();
    expect(screen.queryByRole("button", { name: /Quitar/ })).toBeNull();
    expect(api.findEquipos).not.toHaveBeenCalled();
  });
});

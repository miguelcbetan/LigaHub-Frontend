import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TorneosTable } from "./TorneosTable";

const torneo = {
  id: "t-1",
  nombre: "Apertura",
  descripcion: "Competencia anual",
  estado: "EN_CURSO" as const,
  max_equipos: 8,
  activo: true,
  deporte_id: "d-1",
};

const props = {
  torneos: [torneo],
  deportes: new Map([["d-1", "Fútbol"]]),
  canView: false,
  canEdit: false,
  canDelete: false,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onToggleActivo: vi.fn(),
  onDelete: vi.fn(),
};

describe("TorneosTable", () => {
  afterEach(cleanup);

  it("enlaza a la vista de desarrollo del torneo cuando hay permiso", () => {
    render(<TorneosTable {...props} canViewDesarrollo />);
    const enlace = screen.getByRole("link", { name: "Ver desarrollo de Apertura" });
    expect(enlace.getAttribute("href")).toBe("/torneos/t-1");
  });

  it("oculta el botón de desarrollo sin permiso", () => {
    render(<TorneosTable {...props} />);
    expect(screen.queryByRole("link", { name: /desarrollo/i })).toBeNull();
  });
});

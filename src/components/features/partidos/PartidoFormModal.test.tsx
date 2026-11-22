import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import { PartidoFormModal } from "./PartidoFormModal";
import type { PartidoCatalogos } from "./partido-utils";

const catalogos: PartidoCatalogos = {
  torneos: [
    { id: "t-1", nombre: "Copa Caldas", descripcion: "", estado: "EN_CURSO", max_equipos: 8, activo: true, deporte_id: "d-1" },
    { id: "t-2", nombre: "Copa Cerrada", descripcion: "", estado: "FINALIZADO", max_equipos: 8, activo: true, deporte_id: "d-1" },
  ],
  fases: [
    { id: "f-1", tipo: "GRUPOS", numero_orden: 1, fecha_inicio: "2026-12-01", fecha_fin: "2026-12-20", estado: "EN_CURSO", torneo_id: "t-1", fase_grupos_id: "g-1", nombre: "Grupo A" },
    { id: "f-2", tipo: "FINAL", numero_orden: 2, fecha_inicio: "2026-12-21", fecha_fin: "2026-12-30", estado: "FINALIZADA", torneo_id: "t-1" },
  ],
  equipos: [
    { id: "e-1", nombre: "Once Caldas", activo: true, fase_grupos_id: "g-1" },
    { id: "e-2", nombre: "Manizales FC", activo: true, fase_grupos_id: "g-1" },
    { id: "e-3", nombre: "Inactivo FC", activo: false, fase_grupos_id: "g-1" },
    { id: "e-4", nombre: "Sin inscripción", activo: true, fase_grupos_id: "g-1" },
    { id: "e-5", nombre: "Otro grupo", activo: true, fase_grupos_id: "g-2" },
  ],
  inscripciones: [
    { id: "i-1", fecha_inscripcion: "2026-11-01", estado: "ACEPTADA", equipo_id: "e-1", torneo_id: "t-1" },
    { id: "i-2", fecha_inscripcion: "2026-11-01", estado: "ACEPTADA", equipo_id: "e-2", torneo_id: "t-1" },
    { id: "i-3", fecha_inscripcion: "2026-11-01", estado: "ACEPTADA", equipo_id: "e-3", torneo_id: "t-1" },
    { id: "i-4", fecha_inscripcion: "2026-11-01", estado: "PENDIENTE", equipo_id: "e-4", torneo_id: "t-1" },
    { id: "i-5", fecha_inscripcion: "2026-11-01", estado: "ACEPTADA", equipo_id: "e-5", torneo_id: "t-1" },
  ],
  escenarios: [
    { id: "s-1", nombre: "Estadio Palogrande", direccion: "Cra 23", capacidad: 36000 },
    { id: "s-2", nombre: "Cancha ajena", direccion: "Calle 1", capacidad: 100 },
  ],
  escenariosTorneo: [
    { id: "et-1", fecha_asignacion: "2026-11-01", estado: "ACTIVO", escenario_id: "s-1", torneo_id: "t-1" },
  ],
};

function renderModal(props: Partial<Parameters<typeof PartidoFormModal>[0]> = {}) {
  const onSubmit = vi.fn();
  render(
    <PartidoFormModal open onClose={vi.fn()} onSubmit={onSubmit} catalogos={catalogos} {...props} />,
  );
  return onSubmit;
}

const select = (name: string) => screen.getByRole("combobox", { name });
const optionLabels = (name: string) =>
  Array.from((select(name) as HTMLSelectElement).options).map((option) => option.text);

describe("PartidoFormModal", () => {
  afterEach(cleanup);

  it("solo ofrece torneos abiertos, fases sin finalizar, equipos habilitados y escenarios del torneo", () => {
    renderModal();

    expect(optionLabels("Torneo")).not.toContain("Copa Cerrada");
    fireEvent.change(select("Torneo"), { target: { value: "t-1" } });
    expect(optionLabels("Fase")).toEqual(["Selecciona una fase", "Etapa 1 · Grupo A"]);

    fireEvent.change(select("Fase"), { target: { value: "f-1" } });
    expect(optionLabels("Equipo local")).toEqual([
      "Selecciona el equipo local",
      "Once Caldas",
      "Manizales FC",
    ]);
    expect(optionLabels("Escenario (opcional)")).toEqual(["Por definir", "Estadio Palogrande"]);
  });

  it("registra un partido sin escenario", async () => {
    const onSubmit = renderModal();

    fireEvent.change(select("Torneo"), { target: { value: "t-1" } });
    fireEvent.change(select("Fase"), { target: { value: "f-1" } });
    fireEvent.change(select("Equipo local"), { target: { value: "e-1" } });
    fireEvent.change(select("Equipo visitante"), { target: { value: "e-2" } });
    fireEvent.change(screen.getByLabelText("Fecha y hora"), {
      target: { value: "2026-12-05T20:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar partido" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      fecha_hora: new Date("2026-12-05T20:00").toISOString(),
      equipo_local_id: "e-1",
      equipo_visitante_id: "e-2",
      fase_id: "f-1",
    });
  });

  it("exige fecha antes de enviar", async () => {
    const onSubmit = renderModal();

    fireEvent.change(select("Torneo"), { target: { value: "t-1" } });
    fireEvent.change(select("Fase"), { target: { value: "f-1" } });
    fireEvent.change(select("Equipo local"), { target: { value: "e-1" } });
    fireEvent.change(select("Equipo visitante"), { target: { value: "e-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar partido" }));

    expect(await screen.findByText("Indica la fecha y hora del partido.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("en un partido en juego solo deja editar marcador y estado", async () => {
    const partido: PartidoDTO = {
      id: "p-1",
      fecha_hora: "2026-12-06T01:00:00.000Z",
      estado: "EN_JUEGO",
      equipo_local_id: "e-1",
      equipo_visitante_id: "e-2",
      equipo_local_nombre: "Once Caldas",
      equipo_visitante_nombre: "Manizales FC",
      goles_local: 0,
      goles_visitante: 0,
      escenario_id: "s-1",
      escenario_nombre: "Estadio Palogrande",
      fase_id: "f-1",
      fase_tipo: "GRUPOS",
      torneo_id: "t-1",
    };
    const onSubmit = renderModal({ partido });

    expect((select("Torneo") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("Fecha y hora") as HTMLInputElement).disabled).toBe(true);
    expect(optionLabels("Estado")).not.toContain("Programado");

    fireEvent.change(screen.getByLabelText("Goles local"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ goles_local: 2, estado: "EN_JUEGO", escenario_id: "s-1" }),
    );
  });
});

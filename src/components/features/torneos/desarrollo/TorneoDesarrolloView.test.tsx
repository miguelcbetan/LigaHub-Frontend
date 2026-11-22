import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type {
  PartidoDesarrolloDTO,
  TorneoDesarrolloDTO,
} from "@/lib/api/business-torneos";
import { TorneoDesarrolloView } from "./TorneoDesarrolloView";

const A = { id: "a", nombre: "Águilas" };
const B = { id: "b", nombre: "Búhos" };
const fase = {
  numero_orden: 1,
  fecha_inicio: "2026-03-01",
  fecha_fin: "2026-03-15",
  estado: "EN_CURSO" as const,
};

const jugado: PartidoDesarrolloDTO = {
  id: "p-1",
  fecha_hora: "2026-03-02T20:00:00.000Z",
  estado: "FINALIZADO",
  equipo_local: A,
  equipo_visitante: B,
  escenario_nombre: "Estadio Palogrande",
  goles_local: 2,
  goles_visitante: 1,
  con_resultado: true,
  anotaciones: [
    { id: "g-1", minuto: 12, descripcion: "De cabeza", jugador_id: "j-1", jugador_user_id: 7, equipo_id: "a" },
  ],
};

const pendiente: PartidoDesarrolloDTO = {
  ...jugado,
  id: "p-2",
  estado: "PROGRAMADO",
  equipo_local: B,
  equipo_visitante: A,
  goles_local: 0,
  goles_visitante: 0,
  con_resultado: false,
  anotaciones: [],
};

const desarrollo: TorneoDesarrolloDTO = {
  torneo: {
    id: "t-1",
    nombre: "Apertura",
    descripcion: "Competencia anual",
    estado: "EN_CURSO",
    max_equipos: 8,
    activo: true,
    deporte_id: "d-1",
    deporte_nombre: "Fútbol",
  },
  resumen: { total_fases: 2, total_partidos: 3, partidos_con_resultado: 2, partidos_pendientes: 1 },
  etapas: [
    {
      numero_orden: 1,
      tipo: "GRUPOS",
      grupos: [
        {
          fase: { ...fase, id: "f-1" },
          nombre: "Grupo A",
          cupo_equipos: 4,
          equipos: [A, B],
          tabla_posiciones: [
            { posicion: 1, equipo: A, pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 1, dg: 1, pts: 3 },
            { posicion: 2, equipo: B, pj: 1, pg: 0, pe: 0, pp: 1, gf: 1, gc: 2, dg: -1, pts: 0 },
          ],
          partidos: [jugado, pendiente],
        },
      ],
      finales: [],
    },
    {
      numero_orden: 2,
      tipo: "FINAL",
      grupos: [],
      finales: [
        {
          fase: { ...fase, id: "f-2", numero_orden: 2 },
          modalidad: "PARTIDO_UNICO",
          numero_partidos: 1,
          llaves: [
            {
              equipo_a: A,
              equipo_b: B,
              goles_a: 2,
              goles_b: 1,
              ganador_id: "a",
              partidos: [{ ...jugado, id: "p-3" }],
            },
          ],
        },
      ],
    },
  ],
};

const nombreJugador = (userId: number | null) => (userId === 7 ? "Juan Pérez" : "Desconocido");

describe("TorneoDesarrolloView", () => {
  afterEach(cleanup);

  it("muestra información general, grupos con posiciones y llaves", () => {
    render(<TorneoDesarrolloView desarrollo={desarrollo} nombreJugador={nombreJugador} />);

    expect(screen.getByText("Competencia anual")).toBeTruthy();
    expect(screen.getByText("Fútbol")).toBeTruthy();
    expect(screen.getByText("Etapa 1 · Fase de grupos")).toBeTruthy();

    const grupo = screen.getByRole("region", { name: "Grupo A" });
    const filas = within(grupo).getAllByRole("row");
    expect(filas[1].textContent).toContain("Águilas");
    expect(filas[1].textContent).toContain("+1");

    const final = screen.getByRole("region", { name: "Etapa 2" });
    expect(within(final).getByText("Final")).toBeTruthy();
    expect(within(final).getByText("Definida")).toBeTruthy();
    expect(within(final).getByLabelText("Ganador de la llave")).toBeTruthy();
  });

  it("distingue partidos con resultado y pendientes y muestra sus anotaciones", () => {
    render(<TorneoDesarrolloView desarrollo={desarrollo} nombreJugador={nombreJugador} />);
    const grupo = screen.getByRole("region", { name: "Grupo A" });

    expect(within(grupo).getByText("Con resultado")).toBeTruthy();
    expect(within(grupo).getByText("Pendiente · Programado")).toBeTruthy();
    expect(within(grupo).getByText("2 - 1")).toBeTruthy();

    const [botonJugado, botonPendiente] = within(grupo).getAllByRole("button", {
      name: /Anotaciones/,
    });
    fireEvent.click(botonJugado);
    expect(within(grupo).getByText("Juan Pérez")).toBeTruthy();
    expect(within(grupo).getByText("— De cabeza")).toBeTruthy();

    fireEvent.click(botonPendiente);
    expect(within(grupo).getByText("Sin anotaciones registradas.")).toBeTruthy();
  });

  it("muestra un estado vacío si el torneo no tiene fases", () => {
    render(
      <TorneoDesarrolloView
        desarrollo={{ ...desarrollo, etapas: [] }}
        nombreJugador={nombreJugador}
      />,
    );
    expect(screen.getByText("El torneo aún no tiene fases")).toBeTruthy();
  });
});

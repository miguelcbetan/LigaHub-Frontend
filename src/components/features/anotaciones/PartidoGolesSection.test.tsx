import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/context/ToastContext";
import type { PartidoDTO } from "@/lib/api/business-partidos";
import { PartidoGolesSection } from "./PartidoGolesSection";
import { marcadorDe } from "./anotacion-utils";

const api = vi.hoisted(() => ({
  findByPartido: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findByEquipo: vi.fn(),
  findJugadores: vi.fn(),
  findUsers: vi.fn(),
}));

vi.mock("@/lib/api/business-anotaciones", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/business-anotaciones")>()),
  businessAnotacionesApi: {
    findByPartido: api.findByPartido,
    create: api.create,
    update: api.update,
    remove: api.remove,
  },
}));
vi.mock("@/lib/api/business-equipo-jugador", () => ({
  businessEquipoJugadorApi: { findByEquipo: api.findByEquipo },
}));
vi.mock("@/lib/api/business-jugadores", () => ({
  businessJugadoresApi: { findAll: api.findJugadores },
}));
vi.mock("@/lib/api/users", () => ({ usersApi: { findAll: api.findUsers } }));

const partido: PartidoDTO = {
  id: "p-1",
  fecha_hora: "2026-12-06T01:00:00.000Z",
  estado: "EN_JUEGO",
  equipo_local_id: "e-1",
  equipo_visitante_id: "e-2",
  equipo_local_nombre: "Once Caldas",
  equipo_visitante_nombre: "Manizales FC",
  goles_local: 1,
  goles_visitante: 0,
  escenario_id: null,
  escenario_nombre: null,
  fase_id: "f-1",
  fase_tipo: "GRUPOS",
  torneo_id: "t-1",
};

const jugadorBase = { fecha_nacimiento: "2000-01-01", nacionalidad: "Colombiana", activo: true };
const contrato = (id: string, equipo_id: string, jugador_id: string, activo = true) => ({
  id,
  equipo_id,
  jugador_id,
  fecha_inicio: "2026-01-01",
  fecha_fin: activo ? null : "2026-06-30",
  activo,
});
const golAna = {
  id: "a-1",
  minuto: 30,
  descripcion: "De cabeza",
  partido_id: "p-1",
  jugador_id: "j-1",
  equipo_id: "e-1",
};

const todos = { canCreate: true, canEdit: true, canDelete: true };

function renderSection(props: Partial<Parameters<typeof PartidoGolesSection>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <ToastProvider>
      <PartidoGolesSection partido={partido} {...todos} onChange={onChange} {...props} />
    </ToastProvider>,
  );
  return onChange;
}

describe("PartidoGolesSection", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
    api.findByPartido.mockResolvedValue([golAna]);
    api.findByEquipo.mockImplementation(async (equipoId: string) =>
      equipoId === "e-1"
        ? [contrato("ej-1", "e-1", "j-1"), contrato("ej-3", "e-1", "j-3", false)]
        : [contrato("ej-2", "e-2", "j-2")],
    );
    api.findJugadores.mockResolvedValue([
      { id: "j-1", user_id: 1, ...jugadorBase },
      { id: "j-2", user_id: 2, ...jugadorBase },
      { id: "j-3", user_id: 3, ...jugadorBase },
    ]);
    api.findUsers.mockResolvedValue([
      { id: 1, name: "Ana Ruiz", email: "ana@liga.test", active: true },
      { id: 2, name: "Luis Gómez", email: "luis@liga.test", active: true },
      { id: 3, name: "Pedro Retirado", email: "pedro@liga.test", active: true },
    ]);
  });

  it("lista los goles con goleador, equipo y minuto", async () => {
    renderSection();

    expect(await screen.findByText("Ana Ruiz")).toBeTruthy();
    expect(api.findByPartido).toHaveBeenCalledWith("p-1");
    const fila = screen.getByText("Ana Ruiz").closest("li")!;
    expect(within(fila).getByText("30'")).toBeTruthy();
    expect(within(fila).getByText("· Once Caldas")).toBeTruthy();
    expect(within(fila).getByText("De cabeza")).toBeTruthy();
  });

  it("registra un gol solo con jugadores vigentes de los dos equipos", async () => {
    const created = { ...golAna, id: "a-2", minuto: 75, descripcion: null, jugador_id: "j-2", equipo_id: "e-2" };
    api.create.mockResolvedValue(created);
    const onChange = renderSection();
    await screen.findByText("Ana Ruiz");

    fireEvent.click(screen.getByRole("button", { name: "Registrar gol" }));
    const form = screen.getByRole("form", { name: "Registrar gol" });
    const jugador = within(form).getByRole("combobox", { name: "Jugador" }) as HTMLSelectElement;
    await waitFor(() =>
      expect(Array.from(jugador.options).map((option) => option.text)).toEqual([
        "Selecciona el goleador",
        "Ana Ruiz · Once Caldas",
        "Luis Gómez · Manizales FC",
      ]),
    );

    fireEvent.change(jugador, { target: { value: "j-2" } });
    fireEvent.change(within(form).getByLabelText("Minuto"), { target: { value: "75" } });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar gol" }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        partido_id: "p-1",
        jugador_id: "j-2",
        minuto: 75,
        descripcion: null,
      }),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([golAna, created]));
    expect(await screen.findByText(/Se notificará por correo/)).toBeTruthy();
  });

  it("valida el jugador y el minuto antes de enviar", async () => {
    renderSection();
    await screen.findByText("Ana Ruiz");

    fireEvent.click(screen.getByRole("button", { name: "Registrar gol" }));
    const form = screen.getByRole("form", { name: "Registrar gol" });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar gol" }));
    expect(await within(form).findByText("Selecciona el jugador que anotó el gol.")).toBeTruthy();

    fireEvent.change(within(form).getByRole("combobox", { name: "Jugador" }), {
      target: { value: "j-1" },
    });
    fireEvent.change(within(form).getByLabelText("Minuto"), { target: { value: "200" } });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar gol" }));
    expect(await within(form).findByText(/entre 0 y 130/)).toBeTruthy();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("edita y elimina un gol", async () => {
    api.update.mockResolvedValue({ ...golAna, minuto: 31 });
    api.remove.mockResolvedValue({ message: "ok" });
    const onChange = renderSection();
    await screen.findByText("Ana Ruiz");

    fireEvent.click(screen.getByRole("button", { name: "Editar gol" }));
    const form = screen.getByRole("form", { name: "Editar gol" });
    fireEvent.change(within(form).getByLabelText("Minuto"), { target: { value: "31" } });
    fireEvent.click(within(form).getByRole("button", { name: "Guardar gol" }));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith("a-1", {
        jugador_id: "j-1",
        minuto: 31,
        descripcion: "De cabeza",
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar gol" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("a-1"));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([]));
  });

  it("en un partido programado no permite registrar goles", async () => {
    renderSection({ partido: { ...partido, estado: "PROGRAMADO" } });
    await screen.findByText("Ana Ruiz");

    expect(screen.getByText("Los goles se registran cuando el partido esté en juego.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Registrar gol" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar gol" })).toBeNull();
  });

  it("en un partido finalizado avisa que los cambios son correcciones sin correo", async () => {
    renderSection({ partido: { ...partido, estado: "FINALIZADO" } });
    await screen.findByText("Ana Ruiz");

    expect(screen.getByText(/no envían correo/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrar gol" })).toBeTruthy();
  });

  it("sin permisos solo muestra los goles", async () => {
    renderSection({ canCreate: false, canEdit: false, canDelete: false });
    await screen.findByText("Ana Ruiz");

    expect(screen.queryByRole("button", { name: "Registrar gol" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar gol" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar gol" })).toBeNull();
  });
});

describe("marcadorDe", () => {
  it("cuenta los goles de cada equipo", () => {
    expect(
      marcadorDe(partido, [
        { equipo_id: "e-1" },
        { equipo_id: "e-2" },
        { equipo_id: "e-1" },
      ]),
    ).toEqual({ goles_local: 2, goles_visitante: 1 });
  });
});

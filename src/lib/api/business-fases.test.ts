import { afterEach, describe, expect, it, vi } from "vitest";
import { businessFasesApi } from "./business-fases";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business phases API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("supports filtering by phase type and tournament", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesApi.findAll({
      tipo: "GRUPOS",
      torneo_id: "t-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/fases?tipo=GRUPOS&torneo_id=t-1",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("creates a phase with the selected type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      tipo: "GRUPOS" as const,
      numero_orden: 1,
      fecha_inicio: "2026-11-10",
      fecha_fin: "2026-11-20",
      estado: "PENDIENTE" as const,
      torneo_id: "t-1",
      nombre: "Grupo A",
      cupo_equipos: 4,
    };

    await businessFasesApi.create(input);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/fases",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  });

  it("preserves the server conflict message for duplicate phase order", async () => {
    const message = "Ya existe una fase con ese orden en el torneo.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message }, 409)));

    await expect(
      businessFasesApi.create({
        tipo: "FINAL",
        numero_orden: 1,
        fecha_inicio: "2026-11-10",
        fecha_fin: "2026-11-20",
        estado: "PENDIENTE",
        torneo_id: "t-1",
        numero_partidos: 1,
        modalidad: "PARTIDO_UNICO",
      }),
    ).rejects.toEqual(new BusinessApiError(409, message));
  });

  it("omits the phase type when updating and preserves duplicate-order conflicts", async () => {
    const message = "Ya existe una fase con ese orden en el torneo.";
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message }, 409));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      businessFasesApi.update("f-1", { numero_orden: 2 }),
    ).rejects.toEqual(new BusinessApiError(409, message));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/fases/f-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ numero_orden: 2 }),
      }),
    );
  });

  it("preserves the server conflict message when deleting a phase with assignments", async () => {
    const message = "Reasigna los equipos antes de eliminar esta fase.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message }, 409)));

    await expect(businessFasesApi.remove("f-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });

  it("filters the groups of a stage by order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesApi.findAll({ torneo_id: "t-1", numero_orden: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/fases?torneo_id=t-1&numero_orden=1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists, assigns and removes the teams of a group", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesApi.findEquiposGrupo("f-1");
    await businessFasesApi.asignarEquiposGrupo("f-1", ["e-1", "e-2"]);
    await businessFasesApi.quitarEquipoGrupo("f-1", "e-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/business/fases/f-1/equipos",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/business/fases/f-1/equipos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ equipo_ids: ["e-1", "e-2"] }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/business/fases/f-1/equipos/e-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("lists the matches of a final phase", async () => {
    const partidos = [{ id: "p-1", fase_id: "f-1", fase_tipo: "FINAL" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(partidos));
    vi.stubGlobal("fetch", fetchMock);

    await expect(businessFasesApi.findPartidos("f-1")).resolves.toEqual(
      partidos,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/fases/f-1/partidos",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

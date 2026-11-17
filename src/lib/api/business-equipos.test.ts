import { afterEach, describe, expect, it, vi } from "vitest";
import { businessEquiposApi } from "./business-equipos";
import { businessEquiposDeportesApi } from "./business-equipos-deportes";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business teams API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("calls the team CRUD through the same-origin proxy", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await businessEquiposApi.findAll();
    await businessEquiposApi.findOne("e-1");
    await businessEquiposApi.create({ nombre: "Tigres" });
    await businessEquiposApi.update("e-1", { activo: false });
    await businessEquiposApi.remove("e-1");

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["/api/business/equipos", "GET", undefined],
      ["/api/business/equipos/e-1", "GET", undefined],
      ["/api/business/equipos", "POST", JSON.stringify({ nombre: "Tigres" })],
      ["/api/business/equipos/e-1", "PATCH", JSON.stringify({ activo: false })],
      ["/api/business/equipos/e-1", "DELETE", undefined],
    ]);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer security-session-token",
    });
  });

  it("surfaces the conflict when a team still has related records", async () => {
    const message =
      "Equipo #e-1 has jugadores, inscripciones, partidos, aficionado preferences or deportes; delete or reassign them first, or deactivate it instead";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ statusCode: 409, message }, 409)),
    );

    await expect(businessEquiposApi.remove("e-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });

  it("manages the sports of a team", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessEquiposDeportesApi.findByEquipo("e-1");
    await businessEquiposDeportesApi.create("e-1", "d-1");
    await businessEquiposDeportesApi.remove("ed-1");

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["/api/business/equipos-deportes?equipo_id=e-1", "GET", undefined],
      [
        "/api/business/equipos-deportes",
        "POST",
        JSON.stringify({ equipo_id: "e-1", deporte_id: "d-1" }),
      ],
      ["/api/business/equipos-deportes/ed-1", "DELETE", undefined],
    ]);
  });
});

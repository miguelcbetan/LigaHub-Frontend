import { afterEach, describe, expect, it, vi } from "vitest";
import { businessPartidosApi } from "./business-partidos";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("business partidos API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("lista los partidos filtrando por torneo con el token de seguridad", async () => {
    configureHttp({ getToken: () => "token", onUnauthorized: () => undefined });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessPartidosApi.findAll({ torneo_id: "t-1" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/business/partidos?torneo_id=t-1");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual(
      expect.objectContaining({ Authorization: expect.any(String) }),
    );
  });

  it("envía escenario_id null para quitar el escenario", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "p-1" }));
    vi.stubGlobal("fetch", fetchMock);

    await businessPartidosApi.update("p-1", { escenario_id: null });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/business/partidos/p-1");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ escenario_id: null }),
      }),
    );
  });

  it("expone el mensaje de error de Business", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: "Un equipo no puede jugar contra sí mismo: elija equipos distintos" },
          400,
        ),
      ),
    );

    const error = await businessPartidosApi
      .create({
        fecha_hora: "2026-12-06T01:00:00.000Z",
        equipo_local_id: "e-1",
        equipo_visitante_id: "e-1",
        fase_id: "f-1",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BusinessApiError);
    expect((error as Error).message).toContain("contra sí mismo");
  });
});

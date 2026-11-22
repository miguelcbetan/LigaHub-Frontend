import { afterEach, describe, expect, it, vi } from "vitest";
import { businessAnotacionesApi } from "./business-anotaciones";
import { configureHttp } from "./http";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business anotaciones (goles) API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("lista, registra, corrige y elimina goles por el proxy del mismo origen", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    const input = { partido_id: "p-1", jugador_id: "j-1", minuto: 23, descripcion: null };

    await businessAnotacionesApi.findByPartido("p-1");
    await businessAnotacionesApi.create(input);
    await businessAnotacionesApi.update("a-1", { minuto: 45 });
    await businessAnotacionesApi.remove("a-1");

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["/api/business/anotaciones?partido_id=p-1", "GET", undefined],
      ["/api/business/anotaciones", "POST", JSON.stringify(input)],
      ["/api/business/anotaciones/a-1", "PATCH", JSON.stringify({ minuto: 45 })],
      ["/api/business/anotaciones/a-1", "DELETE", undefined],
    ]);
  });
});

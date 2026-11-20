import { afterEach, describe, expect, it, vi } from "vitest";
import { businessTorneosApi, BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

describe("business tournament API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("sends the active security token through the same-origin proxy", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(businessTorneosApi.findAll()).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/torneos",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer security-session-token" },
        cache: "no-store",
      }),
    );
  });

  it("closes the active session when Business rejects the token", async () => {
    const onUnauthorized = vi.fn();
    configureHttp({ getToken: () => "expired-token", onUnauthorized });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(businessTorneosApi.findAll()).rejects.toBeInstanceOf(
      BusinessApiError,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("deactivates a tournament with a partial update", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "t-1", activo: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await businessTorneosApi.update("t-1", { activo: false });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/torneos/t-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ activo: false }),
      }),
    );
  });

  it("loads the phases associated with a tournament", async () => {
    const fases = [{ id: "f-1", tipo: "GRUPOS", numero_orden: 1 }];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fases), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(businessTorneosApi.findFases("t-1")).resolves.toEqual(fases);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/torneos/t-1/fases",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("localizes the conflict when a tournament has dependencies", async () => {
    const message =
      "Torneo #t-1 has fases, inscripciones or escenarios; delete them first or deactivate it instead";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 409, message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(businessTorneosApi.remove("t-1")).rejects.toEqual(
      new BusinessApiError(
        409,
        "No se puede eliminar el torneo porque tiene fases, partidos, inscripciones o escenarios asociados. Desactívalo en su lugar.",
      ),
    );
  });
});

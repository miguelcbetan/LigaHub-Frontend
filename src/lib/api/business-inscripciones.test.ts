import { afterEach, describe, expect, it, vi } from "vitest";
import {
  businessInscripcionesApi,
  BusinessInscripcionesApiError,
} from "./business-inscripciones";
import { configureHttp } from "./http";

describe("business inscription API", () => {
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

    await expect(businessInscripcionesApi.findAll()).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/business/inscripciones");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual(
      expect.objectContaining({ Authorization: expect.any(String) }),
    );
  });

  it("closes the active session when Business rejects the token", async () => {
    const onUnauthorized = vi.fn();
    configureHttp({ getToken: () => "expired-token", onUnauthorized });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(businessInscripcionesApi.findAll()).rejects.toBeInstanceOf(
      BusinessInscripcionesApiError,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("queries registrations by tournament and team", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await businessInscripcionesApi.findAll({
      torneo_id: "t-1",
      equipo_id: "e-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/inscripciones?torneo_id=t-1&equipo_id=e-1",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("preserves the server conflict message when an inscription cannot be withdrawn", async () => {
    const message = "No se puede retirar la inscripción porque el torneo ya inició.";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(businessInscripcionesApi.remove("i-1")).rejects.toEqual(
      new BusinessInscripcionesApiError(409, message),
    );
  });
});

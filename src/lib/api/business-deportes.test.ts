import { afterEach, describe, expect, it, vi } from "vitest";
import { businessDeportesApi } from "./business-deportes";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

describe("business sports API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("lists the registered sports through the same-origin proxy", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const deportes = [
      {
        id: "550e8400-e29b-41d4-a716-446655440020",
        nombre: "Fútbol",
        descripcion: "Fútbol once",
        deporte_padre_id: null,
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(deportes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(businessDeportesApi.findAll()).resolves.toEqual(deportes);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/deportes",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer security-session-token" },
      }),
    );
  });

  it("surfaces the Business error message when access is denied", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            statusCode: 403,
            message: "No tiene permiso para acceder a este recurso",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(businessDeportesApi.findAll()).rejects.toEqual(
      new BusinessApiError(403, "No tiene permiso para acceder a este recurso"),
    );
  });

  it("creates, updates and deletes sports through the proxy", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ id: "d-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await businessDeportesApi.create({
      nombre: "Fútbol",
      descripcion: "Fútbol once",
      deporte_padre_id: null,
    });
    await businessDeportesApi.update("d-1", { deporte_padre_id: null });
    await businessDeportesApi.remove("d-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      [
        "/api/business/deportes",
        "POST",
        JSON.stringify({
          nombre: "Fútbol",
          descripcion: "Fútbol once",
          deporte_padre_id: null,
        }),
      ],
      [
        "/api/business/deportes/d-1",
        "PATCH",
        JSON.stringify({ deporte_padre_id: null }),
      ],
      ["/api/business/deportes/d-1", "DELETE", undefined],
    ]);
  });

  it("surfaces the conflict when a sport still has relations", async () => {
    const message =
      "Deporte #d-1 has torneos, equipos or child deportes; remove those relations first";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 409, message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(businessDeportesApi.remove("d-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { equipoAficionadosApi, miAficionadoApi } from "./business-aficionados";
import { BusinessApiError } from "./business-torneos";

const ok = () =>
  new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("business aficionados API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the same-origin proxy and never sends the user id", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      nombre: "Ana",
      documento: "1001",
      email: "ana@liga.test",
      equipo_ids: ["e-1"],
    };

    await miAficionadoApi.findMine();
    await miAficionadoApi.convertirse(input);
    await miAficionadoApi.findEquiposDisponibles();
    await miAficionadoApi.asociarEquipo("e-2");
    await miAficionadoApi.retirarEquipo("e-2");
    await equipoAficionadosApi.findByEquipo("e-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/aficionados/me", "GET", undefined],
      ["/api/business/aficionados/me", "POST", JSON.stringify(input)],
      ["/api/business/aficionados/me/equipos-disponibles", "GET", undefined],
      ["/api/business/aficionados/me/equipos", "POST", JSON.stringify({ equipo_id: "e-2" })],
      ["/api/business/aficionados/me/equipos/e-2", "DELETE", undefined],
      ["/api/business/equipos/e-1/aficionados", "GET", undefined],
    ]);
  });

  it("exposes the 404 of a user that is not an aficionado yet", async () => {
    const message = "Tu usuario todavía no es aficionado";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 404, message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(miAficionadoApi.findMine()).rejects.toEqual(
      new BusinessApiError(404, message),
    );
  });
});

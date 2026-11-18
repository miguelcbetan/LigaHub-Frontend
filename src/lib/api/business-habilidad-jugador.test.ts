import { afterEach, describe, expect, it, vi } from "vitest";
import { businessHabilidadJugadorApi } from "./business-habilidad-jugador";
import { BusinessApiError } from "./business-torneos";

describe("business habilidad-jugador API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the same-origin proxy for every operation", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await businessHabilidadJugadorApi.findByJugador("j-1");
    await businessHabilidadJugadorApi.findByHabilidad("h-1");
    await businessHabilidadJugadorApi.create("h-1", "j-1");
    await businessHabilidadJugadorApi.remove("hj-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/habilidad-jugador?jugador_id=j-1", "GET", undefined],
      ["/api/business/habilidad-jugador?habilidad_id=h-1", "GET", undefined],
      [
        "/api/business/habilidad-jugador",
        "POST",
        JSON.stringify({ habilidad_id: "h-1", jugador_id: "j-1" }),
      ],
      ["/api/business/habilidad-jugador/hj-1", "DELETE", undefined],
    ]);
  });

  it("surfaces the conflict status of a repeated assignment", async () => {
    const message = "This habilidad is already assigned to this jugador";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 409, message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(businessHabilidadJugadorApi.create("h-1", "j-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });
});

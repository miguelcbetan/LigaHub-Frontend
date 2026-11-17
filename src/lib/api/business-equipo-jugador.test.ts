import { afterEach, describe, expect, it, vi } from "vitest";
import { businessEquipoJugadorApi, hoyComoFecha } from "./business-equipo-jugador";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business team roster API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("queries, assigns and retires players through the same-origin proxy", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      equipo_id: "e-1",
      jugador_id: "j-1",
      fecha_inicio: "2026-01-15",
      fecha_fin: null,
    };

    await businessEquipoJugadorApi.findByEquipo("e-1");
    await businessEquipoJugadorApi.findByJugador("j-1");
    await businessEquipoJugadorApi.create(input);
    await businessEquipoJugadorApi.retirar("ej-1", "2026-06-30");

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["/api/business/equipo-jugador?equipo_id=e-1", "GET", undefined],
      ["/api/business/equipo-jugador?jugador_id=j-1", "GET", undefined],
      ["/api/business/equipo-jugador", "POST", JSON.stringify(input)],
      [
        "/api/business/equipo-jugador/ej-1/retiro",
        "PATCH",
        JSON.stringify({ fecha_fin: "2026-06-30" }),
      ],
    ]);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer security-session-token",
    });
  });

  it("surfaces the conflict when the player already has an active contract", async () => {
    const message =
      "Jugador already has an active contract with an equipo; retire it from that equipo first";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ statusCode: 409, message }, 409)),
    );

    await expect(
      businessEquipoJugadorApi.create({
        equipo_id: "e-1",
        jugador_id: "j-1",
        fecha_inicio: "2026-01-15",
      }),
    ).rejects.toEqual(new BusinessApiError(409, message));
  });

  it("formats today's local date for date inputs", () => {
    expect(hoyComoFecha(new Date(2026, 10, 7, 23, 30))).toBe("2026-11-07");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { businessJugadoresApi, edadDesde } from "./business-jugadores";
import { BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business players API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("calls the player CRUD through the same-origin proxy", async () => {
    configureHttp({ getToken: () => "token", onUnauthorized: () => undefined });
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const nuevo = { user_id: 7, fecha_nacimiento: "1999-05-10", nacionalidad: "Colombiana" };

    await businessJugadoresApi.findAll();
    await businessJugadoresApi.findOne("j-1");
    await businessJugadoresApi.create(nuevo);
    await businessJugadoresApi.update("j-1", { activo: false });
    await businessJugadoresApi.remove("j-1");

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["/api/business/jugadores", "GET", undefined],
      ["/api/business/jugadores/j-1", "GET", undefined],
      ["/api/business/jugadores", "POST", JSON.stringify(nuevo)],
      ["/api/business/jugadores/j-1", "PATCH", JSON.stringify({ activo: false })],
      ["/api/business/jugadores/j-1", "DELETE", undefined],
    ]);
  });

  it("surfaces the duplicate player message from Business", async () => {
    const message = "A jugador for user 7 already exists";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ statusCode: 409, message }, 409)),
    );

    await expect(
      businessJugadoresApi.create({
        user_id: 7,
        fecha_nacimiento: "1999-05-10",
        nacionalidad: "Colombiana",
      }),
    ).rejects.toEqual(new BusinessApiError(409, message));
  });

  it("computes the age from the birth date", () => {
    const hoy = new Date(2026, 10, 17);

    expect(edadDesde("2000-11-17", hoy)).toBe(26);
    expect(edadDesde("2000-11-18", hoy)).toBe(25);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { businessLocalidadesApi } from "./business-localidades";
import { BusinessApiError } from "./business-torneos";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business localidades API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa el proxy del mismo origen en cada operación", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ id: "l-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const nueva = { nombre: "Oriental", capacidad: 500, precio: 25000, escenario_id: "e-1" };

    await businessLocalidadesApi.findAll();
    await businessLocalidadesApi.findOne("l-1");
    await businessLocalidadesApi.create(nueva);
    await businessLocalidadesApi.update("l-1", { precio: 30000.5 });
    await businessLocalidadesApi.remove("l-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/localidades", "GET", undefined],
      ["/api/business/localidades/l-1", "GET", undefined],
      ["/api/business/localidades", "POST", JSON.stringify(nueva)],
      ["/api/business/localidades/l-1", "PATCH", JSON.stringify({ precio: 30000.5 })],
      ["/api/business/localidades/l-1", "DELETE", undefined],
    ]);
  });

  it("propaga el conflicto de una localidad con boletas", async () => {
    const message = 'La localidad "Oriental" tiene boletas asociadas. Elimine esas boletas primero';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ statusCode: 409, message }, 409)));

    await expect(businessLocalidadesApi.remove("l-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });
});

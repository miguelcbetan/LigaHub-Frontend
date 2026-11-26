import { afterEach, describe, expect, it, vi } from "vitest";
import { businessEscenariosApi } from "./business-escenarios";
import { BusinessApiError } from "./business-torneos";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("business escenarios API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa el proxy del mismo origen en cada operación", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ id: "e-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const nuevo = { nombre: "Estadio", direccion: "Calle 1", capacidad: 100 };

    await businessEscenariosApi.findAll();
    await businessEscenariosApi.findOne("e-1");
    await businessEscenariosApi.create(nuevo);
    await businessEscenariosApi.update("e-1", { escenario_padre_id: null });
    await businessEscenariosApi.remove("e-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/escenarios", "GET", undefined],
      ["/api/business/escenarios/e-1", "GET", undefined],
      ["/api/business/escenarios", "POST", JSON.stringify(nuevo)],
      ["/api/business/escenarios/e-1", "PATCH", JSON.stringify({ escenario_padre_id: null })],
      ["/api/business/escenarios/e-1", "DELETE", undefined],
    ]);
  });

  it("propaga el motivo cuando la eliminación se bloquea por dependencias", async () => {
    const message = 'El escenario "Estadio" tiene partidos asociados. Reasigne o elimine esos partidos primero';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ statusCode: 409, message }, 409)));

    await expect(businessEscenariosApi.remove("e-1")).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });

  it("propaga el error de ciclo en la jerarquía", async () => {
    const message = "Un escenario no puede ser su propio escenario padre";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ statusCode: 400, message }, 400)));

    await expect(
      businessEscenariosApi.update("e-1", { escenario_padre_id: "e-1" }),
    ).rejects.toEqual(new BusinessApiError(400, message));
  });
});

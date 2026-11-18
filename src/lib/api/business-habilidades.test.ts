import { afterEach, describe, expect, it, vi } from "vitest";
import { businessHabilidadesApi } from "./business-habilidades";
import { BusinessApiError } from "./business-torneos";

describe("business habilidades API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the same-origin proxy for every operation", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ id: "h-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const nueva = { nombre: "Velocidad", descripcion: "Desplazamiento rápido" };

    await businessHabilidadesApi.findAll();
    await businessHabilidadesApi.findOne("h-1");
    await businessHabilidadesApi.create(nueva);
    await businessHabilidadesApi.update("h-1", { descripcion: "Nueva" });
    await businessHabilidadesApi.remove("h-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/habilidades", "GET", undefined],
      ["/api/business/habilidades/h-1", "GET", undefined],
      ["/api/business/habilidades", "POST", JSON.stringify(nueva)],
      ["/api/business/habilidades/h-1", "PATCH", JSON.stringify({ descripcion: "Nueva" })],
      ["/api/business/habilidades/h-1", "DELETE", undefined],
    ]);
  });

  it("surfaces the conflict status of a duplicated habilidad", async () => {
    const message = 'A habilidad named "Velocidad" already exists';
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 409, message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      businessHabilidadesApi.create({ nombre: "Velocidad", descripcion: "Rápido" }),
    ).rejects.toEqual(new BusinessApiError(409, message));
  });
});

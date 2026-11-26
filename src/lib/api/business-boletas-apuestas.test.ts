import { afterEach, describe, expect, it, vi } from "vitest";
import { businessApuestasApi } from "./business-apuestas";
import { businessBoletasApi } from "./business-boletas";
import { BusinessApiError } from "./business-torneos";

const ok = () =>
  new Response(JSON.stringify({ id: "x" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("clientes de administración de boletas y apuestas", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa el proxy del mismo origen en cada operación", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const boleta = { aficionado_id: "a-1", partido_id: "p-1", localidad_id: "l-1" };
    const apuesta = {
      aficionado_id: "a-1",
      partido_id: "p-1",
      metodo_pago_aficionado_id: "m-1",
      pronostico: "LOCAL",
      monto: 5000,
      cuota: 2,
    } as const;

    await businessBoletasApi.findAll();
    await businessBoletasApi.create(boleta);
    await businessBoletasApi.update("b-1", { estado: "USADA" });
    await businessBoletasApi.remove("b-1");
    await businessApuestasApi.findAll();
    await businessApuestasApi.create(apuesta);
    await businessApuestasApi.update("ap-1", { estado: "GANADA" });
    await businessApuestasApi.remove("ap-1");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      ["/api/business/boletas", "GET", undefined],
      ["/api/business/boletas", "POST", JSON.stringify(boleta)],
      ["/api/business/boletas/b-1", "PATCH", JSON.stringify({ estado: "USADA" })],
      ["/api/business/boletas/b-1", "DELETE", undefined],
      ["/api/business/apuestas", "GET", undefined],
      ["/api/business/apuestas", "POST", JSON.stringify(apuesta)],
      ["/api/business/apuestas/ap-1", "PATCH", JSON.stringify({ estado: "GANADA" })],
      ["/api/business/apuestas/ap-1", "DELETE", undefined],
    ]);
  });

  it("propaga el 409 de cupo al reactivar una boleta", async () => {
    const message = 'La localidad "Oriental" está agotada para este partido';
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 409, message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(businessBoletasApi.update("b-1", { estado: "ACTIVA" })).rejects.toEqual(
      new BusinessApiError(409, message),
    );
  });
});

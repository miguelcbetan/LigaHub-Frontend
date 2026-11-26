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

  it("uses the session routes and only sends payment fields", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const base = "/api/business/aficionados/me/metodos-pago";
    const alta = { metodo_pago_id: "visa", referencia: "**** 4242" };
    const cambio = { estado: "INACTIVO" } as const;

    await miAficionadoApi.misMetodosPago();
    await miAficionadoApi.registrarMetodoPago(alta);
    await miAficionadoApi.actualizarMetodoPago("registro/1", cambio);
    await miAficionadoApi.eliminarMetodoPago("registro/1");
    await miAficionadoApi.metodosPagoDisponibles();

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      [base, "GET", undefined],
      [base, "POST", JSON.stringify(alta)],
      [base + "/registro%2F1", "PATCH", JSON.stringify(cambio)],
      [base + "/registro%2F1", "DELETE", undefined],
      [base + "-disponibles", "GET", undefined],
    ]);
  });

  it("compra boletas y apuesta por las rutas de la sesión sin enviar aficionado, precio ni cuota", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    const base = "/api/business/aficionados/me";
    const compra = { partido_id: "p-1", localidad_id: "l-1" };
    const apuesta = {
      partido_id: "p-1",
      pronostico: "EMPATE",
      monto: 10000,
      metodo_pago_aficionado_id: "m-1",
    } as const;

    await miAficionadoApi.partidosDisponibles();
    await miAficionadoApi.misBoletas();
    await miAficionadoApi.comprarBoleta(compra);
    await miAficionadoApi.misApuestas();
    await miAficionadoApi.apostar(apuesta);

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      [base + "/partidos-disponibles", "GET", undefined],
      [base + "/boletas", "GET", undefined],
      [base + "/boletas", "POST", JSON.stringify(compra)],
      [base + "/apuestas", "GET", undefined],
      [base + "/apuestas", "POST", JSON.stringify(apuesta)],
    ]);
  });

  it("propaga el 409 de una localidad agotada", async () => {
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

    await expect(
      miAficionadoApi.comprarBoleta({ partido_id: "p-1", localidad_id: "l-1" }),
    ).rejects.toEqual(new BusinessApiError(409, message));
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

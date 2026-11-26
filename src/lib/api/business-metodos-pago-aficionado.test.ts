import { afterEach, expect, it, vi } from "vitest";
import { businessMetodosPagoAficionadoApi as api } from "./business-metodos-pago-aficionado";
import { BusinessApiError } from "./business-torneos";

afterEach(() => vi.unstubAllGlobals());

it("llama al CRUD y a los catálogos de administración por el proxy", async () => {
  const fetchMock = vi.fn().mockImplementation(async () => Response.json({}));
  vi.stubGlobal("fetch", fetchMock);
  const alta = {
    aficionado_id: "ana", metodo_pago_id: "visa", referencia: "**** 4242", predeterminado: true,
  };
  const cambio = { estado: "INACTIVO" } as const;
  const base = "/api/business/metodos-pago-aficionado";

  await api.findAll();
  await api.findOne("registro/1");
  await api.create(alta);
  await api.update("registro/1", cambio);
  await api.remove("registro/1");
  await api.findCatalogo();
  await api.findAficionados();

  expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
    [base, "GET", undefined],
    [base + "/registro%2F1", "GET", undefined],
    [base, "POST", JSON.stringify(alta)],
    [base + "/registro%2F1", "PATCH", JSON.stringify(cambio)],
    [base + "/registro%2F1", "DELETE", undefined],
    ["/api/business/metodos-pago", "GET", undefined],
    ["/api/business/aficionados", "GET", undefined],
  ]);
});

it("conserva el error 409 con la sugerencia de desactivar el método", async () => {
  const message = "El método tiene apuestas asociadas. Cámbielo a INACTIVO.";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message }, { status: 409 })));

  await expect(api.remove("registro")).rejects.toEqual(new BusinessApiError(409, message));
});

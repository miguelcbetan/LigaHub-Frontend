import { afterEach, expect, it, vi } from "vitest";
import { GET as getCatalogo } from "../metodos-pago-disponibles/route";
import { DELETE, PATCH } from "./[id]/route";
import { GET, POST } from "./route";

afterEach(() => vi.unstubAllGlobals());

it("reenvía las operaciones del aficionado con token, cuerpo e identificador", async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const url = "http://localhost/api/business/aficionados/me/metodos-pago";
  const headers = { Authorization: "Bearer token", "Content-Type": "application/json" };
  const alta = JSON.stringify({ metodo_pago_id: "visa", referencia: "**** 4242" });
  const cambio = JSON.stringify({ predeterminado: true });
  const context = { params: Promise.resolve({ id: "registro/1" }) };

  await GET(new Request(url, { headers }));
  await POST(new Request(url, { method: "POST", headers, body: alta }));
  await PATCH(new Request(url, { method: "PATCH", headers, body: cambio }), context);
  await DELETE(new Request(url, { method: "DELETE", headers }), context);
  await getCatalogo(new Request(url + "-disponibles", { headers }));

  const base = "/aficionados/me/metodos-pago";
  expect(fetchMock.mock.calls.map(([target, init]) => [
    new URL(target).pathname, init.method, init.body, init.headers.get("Authorization"),
  ])).toEqual([
    [base, "GET", undefined, "Bearer token"],
    [base, "POST", alta, "Bearer token"],
    [base + "/registro%2F1", "PATCH", cambio, "Bearer token"],
    [base + "/registro%2F1", "DELETE", "", "Bearer token"],
    [base + "-disponibles", "GET", undefined, "Bearer token"],
  ]);
});

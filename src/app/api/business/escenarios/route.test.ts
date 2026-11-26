import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { DELETE, PATCH } from "./[id]/route";

describe("business escenarios proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reenvía el listado con el token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/business/escenarios", {
        headers: { Authorization: "Bearer token" },
      }),
    );

    expect(response.status).toBe(200);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3030/escenarios");
    expect(options.method).toBe("GET");
    expect(options.headers.get("Authorization")).toBe("Bearer token");
  });

  it("reenvía la creación con su cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = JSON.stringify({ nombre: "Estadio", direccion: "Calle 1", capacidad: 100 });

    const response = await POST(
      new Request("http://localhost/api/business/escenarios", {
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body,
      }),
    );

    expect(response.status).toBe(201);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3030/escenarios");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(body);
  });

  it("reenvía edición y eliminación al escenario indicado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const context = { params: Promise.resolve({ id: "e-1" }) };

    await PATCH(
      new Request("http://localhost/api/business/escenarios/e-1", {
        method: "PATCH",
        body: JSON.stringify({ capacidad: 5 }),
      }),
      context,
    );
    await DELETE(
      new Request("http://localhost/api/business/escenarios/e-1", { method: "DELETE" }),
      context,
    );

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["http://localhost:3030/escenarios/e-1", "PATCH"],
      ["http://localhost:3030/escenarios/e-1", "DELETE"],
    ]);
  });

  it("responde 502 si el servicio de negocio no está disponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const response = await GET(new Request("http://localhost/api/business/escenarios"));

    expect(response.status).toBe(502);
  });
});

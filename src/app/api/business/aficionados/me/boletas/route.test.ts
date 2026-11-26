import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getApuestas, POST as postApuesta } from "../apuestas/route";
import { GET as getPartidos } from "../partidos-disponibles/route";
import { GET, POST } from "./route";

describe("proxies del aficionado para boletas y apuestas", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reenvía método, token y cuerpo a las rutas de la sesión", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = JSON.stringify({ partido_id: "p-1", localidad_id: "l-1" });
    const conToken = (method: string, withBody = false) =>
      new Request("http://localhost/api/business/x", {
        method,
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: withBody ? body : undefined,
      });

    await GET(conToken("GET"));
    await POST(conToken("POST", true));
    await getApuestas(conToken("GET"));
    await postApuesta(conToken("POST", true));
    await getPartidos(conToken("GET"));

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method, init.body]),
    ).toEqual([
      ["http://localhost:3030/aficionados/me/boletas", "GET", undefined],
      ["http://localhost:3030/aficionados/me/boletas", "POST", body],
      ["http://localhost:3030/aficionados/me/apuestas", "GET", undefined],
      ["http://localhost:3030/aficionados/me/apuestas", "POST", body],
      ["http://localhost:3030/aficionados/me/partidos-disponibles", "GET", undefined],
    ]);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.get("Authorization")).toBe("Bearer token");
    }
  });
});

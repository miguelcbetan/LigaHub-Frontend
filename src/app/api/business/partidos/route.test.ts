import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("business partidos proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reenvía los filtros admitidos y descarta los desconocidos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request(
      "http://localhost/api/business/partidos?torneo_id=t-1&fase_id=f-1&otro=x",
      { headers: { Authorization: "Bearer token" } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3030/partidos?fase_id=f-1&torneo_id=t-1");
    expect(options.headers.get("Authorization")).toBe("Bearer token");
  });
});

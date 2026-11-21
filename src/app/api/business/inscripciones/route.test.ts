import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("business inscription proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the supported filters and excludes unknown query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request(
      "http://localhost/api/business/inscripciones?torneo_id=t-1&equipo_id=e-1&otro=ignorar",
      { headers: { Authorization: "Bearer token" } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "http://localhost:3030/inscripciones?torneo_id=t-1&equipo_id=e-1",
    );
    expect(options.method).toBe("GET");
    expect(options.headers.get("Authorization")).toBe("Bearer token");
  });
});

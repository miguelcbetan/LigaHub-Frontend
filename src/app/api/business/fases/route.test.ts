import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("business phases proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the valid type and tournament filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request(
        "http://localhost/api/business/fases?tipo=GRUPOS&torneo_id=t-1&otro=x",
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:3030/fases?tipo=GRUPOS&torneo_id=t-1",
    );
  });

  it("omits an unsupported type filter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await GET(new Request("http://localhost/api/business/fases?tipo=INVALID"));

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3030/fases");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("business phase matches proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the request to the phase matches endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/business/fases/f-1/partidos"),
      { params: Promise.resolve({ id: "f-1" }) },
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:3030/fases/f-1/partidos",
    );
  });
});

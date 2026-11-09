import { afterEach, describe, expect, it, vi } from "vitest";
import { businessTorneosApi, BusinessApiError } from "./business-torneos";
import { configureHttp } from "./http";

describe("business tournament API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("sends the active security token through the same-origin proxy", async () => {
    configureHttp({
      getToken: () => "security-session-token",
      onUnauthorized: () => undefined,
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(businessTorneosApi.findAll()).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/business/torneos",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer security-session-token" },
        cache: "no-store",
      }),
    );
  });

  it("closes the active session when Business rejects the token", async () => {
    const onUnauthorized = vi.fn();
    configureHttp({ getToken: () => "expired-token", onUnauthorized });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(businessTorneosApi.findAll()).rejects.toBeInstanceOf(
      BusinessApiError,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});

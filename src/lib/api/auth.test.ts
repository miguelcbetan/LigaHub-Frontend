import { afterEach, describe, expect, it, vi } from "vitest";
import { authApi } from "./auth";
import { apiBaseUrl } from "./http";

describe("password recovery API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the email to the public recovery endpoint and returns its message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Consulta tu correo." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(authApi.requestPasswordRecovery("capitan@futbolapp.co")).resolves.toEqual({
      message: "Consulta tu correo.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/api/auth/password-recovery`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "capitan@futbolapp.co" }),
      }),
    );
  });

  it("posts the reset token and password without requiring authentication", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authApi.resetPassword("reset-token", "Cancha2026!")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/api/auth/password-reset`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "reset-token", password: "Cancha2026!" }),
      }),
    );
  });
});

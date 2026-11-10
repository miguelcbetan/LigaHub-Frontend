import { afterEach, describe, expect, it, vi } from "vitest";
import { businessFasesFinalesApi } from "./business-fases-finales";
import { configureHttp } from "./http";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("business final phase API", () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined });
    vi.unstubAllGlobals();
  });

  it("asks Business only for FINAL phases", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesFinalesApi.findAll();

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/business/fases?tipo=FINAL");
  });

  it("always creates the phase with type FINAL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesFinalesApi.create({
      numero_orden: 2,
      fecha_inicio: "2026-11-10",
      fecha_fin: "2026-11-20",
      estado: "PENDIENTE",
      torneo_id: "550e8400-e29b-41d4-a716-446655440000",
      numero_partidos: 2,
      modalidad: "IDA_Y_VUELTA",
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(
      expect.objectContaining({ tipo: "FINAL", numero_partidos: 2 }),
    );
  });

  it("does not send the type when updating", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await businessFasesFinalesApi.update("abc", { modalidad: "PARTIDO_UNICO" });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/business/fases/abc");
    expect(JSON.parse(init.body as string)).not.toHaveProperty("tipo");
  });
});

import { describe, expect, it } from "vitest";
import { buildAccess } from "./access";
import { canAccessPath, visibleNavSections } from "./navigation";

const etiquetas = (access: ReturnType<typeof buildAccess>) =>
  visibleNavSections(access).flatMap(({ items }) =>
    items.map(({ label }) => label),
  );

describe("sports navigation", () => {
  it("shows sports management to roles that can list sports", () => {
    const access = buildAccess([
      { method: "GET", url: "/deportes", model: "Deporte" },
    ]);

    expect(etiquetas(access)).toContain("Deportes");
    expect(canAccessPath("/deportes", access)).toBe(true);
  });

  it("hides sports management from roles without sports permissions", () => {
    const access = buildAccess([
      { method: "GET", url: "/torneos", model: "Torneo" },
    ]);

    expect(etiquetas(access)).not.toContain("Deportes");
    expect(canAccessPath("/deportes", access)).toBe(false);
  });

  it("shows Mis equipos to users that can become aficionados", () => {
    const allowed = buildAccess([
      { method: "GET", url: "/aficionados/me", model: "Aficionado" },
    ]);
    const denied = buildAccess([
      { method: "GET", url: "/api/profile/me", model: "Profile" },
    ]);

    expect(etiquetas(allowed)).toContain("Mis equipos");
    expect(canAccessPath("/mis-equipos", allowed)).toBe(true);
    expect(etiquetas(denied)).not.toContain("Mis equipos");
    expect(canAccessPath("/mis-equipos", denied)).toBe(false);
  });

  it("shows Mis métodos de pago only with the payment list permission", () => {
    const url = "/aficionados/me/metodos-pago";
    const allowed = buildAccess([{ method: "GET", url, model: "Aficionado" }]);
    const denied = buildAccess([{ method: "POST", url, model: "Aficionado" }]);

    expect(etiquetas(allowed)).toContain("Mis métodos de pago");
    expect(canAccessPath("/mis-metodos-pago", allowed)).toBe(true);
    expect(etiquetas(denied)).not.toContain("Mis métodos de pago");
    expect(canAccessPath("/mis-metodos-pago", denied)).toBe(false);
  });

  it("shows payment administration only with the administrative list permission", () => {
    const allowed = buildAccess([
      { method: "GET", url: "/metodos-pago-aficionado", model: "MetodoPagoAficionado" },
    ]);
    const fan = buildAccess([
      { method: "GET", url: "/aficionados/me/metodos-pago", model: "Aficionado" },
    ]);

    expect(etiquetas(allowed)).toContain("Métodos de pago de aficionados");
    expect(canAccessPath("/metodos-pago-aficionado", allowed)).toBe(true);
    expect(etiquetas(fan)).not.toContain("Métodos de pago de aficionados");
    expect(canAccessPath("/metodos-pago-aficionado", fan)).toBe(false);
  });

  it("shows habilidades only to roles that can list them", () => {
    const allowed = buildAccess([
      { method: "GET", url: "/habilidades", model: "Habilidad" },
    ]);
    const denied = buildAccess([
      { method: "GET", url: "/deportes", model: "Deporte" },
    ]);

    expect(etiquetas(allowed)).toContain("Habilidades");
    expect(canAccessPath("/habilidades", allowed)).toBe(true);
    expect(etiquetas(denied)).not.toContain("Habilidades");
    expect(canAccessPath("/habilidades", denied)).toBe(false);
  });
  it("shows Escenarios only to roles that can list escenarios", () => {
    const allowed = buildAccess([
      { method: "GET", url: "/escenarios", model: "Escenario" },
    ]);
    const denied = buildAccess([
      { method: "GET", url: "/escenarios-torneo", model: "EscenarioTorneo" },
    ]);

    expect(etiquetas(allowed)).toContain("Escenarios");
    expect(canAccessPath("/escenarios", allowed)).toBe(true);
    expect(etiquetas(denied)).not.toContain("Escenarios");
    expect(canAccessPath("/escenarios", denied)).toBe(false);
    // La ruta de asignaciones a torneo no depende del permiso de escenarios.
    expect(canAccessPath("/escenarios-torneo", denied)).toBe(true);
  });

  it("muestra Mis boletos y Mis apuestas solo a quien tiene las rutas de la sesión", () => {
    const aficionado = buildAccess([
      { method: "GET", url: "/aficionados/me/boletas", model: "Aficionado" },
      { method: "GET", url: "/aficionados/me/apuestas", model: "Aficionado" },
    ]);
    const sinPermiso = buildAccess([
      { method: "GET", url: "/aficionados/me", model: "Aficionado" },
    ]);

    expect(etiquetas(aficionado)).toEqual(expect.arrayContaining(["Mis boletos", "Mis apuestas"]));
    expect(canAccessPath("/mis-boletos", aficionado)).toBe(true);
    expect(canAccessPath("/mis-apuestas", aficionado)).toBe(true);
    expect(etiquetas(sinPermiso)).not.toContain("Mis boletos");
    expect(canAccessPath("/mis-boletos", sinPermiso)).toBe(false);
    expect(canAccessPath("/mis-apuestas", sinPermiso)).toBe(false);
    // Las rutas del aficionado no dan acceso a la gestión general.
    expect(canAccessPath("/boletos", aficionado)).toBe(false);
    expect(canAccessPath("/apuestas", aficionado)).toBe(false);
  });

  it("muestra Boletos y Apuestas solo al rol que los gestiona", () => {
    const gestor = buildAccess([
      { method: "GET", url: "/boletas", model: "Boleta" },
      { method: "GET", url: "/apuestas", model: "Apuesta" },
    ]);

    expect(etiquetas(gestor)).toEqual(expect.arrayContaining(["Boletos", "Apuestas"]));
    expect(canAccessPath("/boletos", gestor)).toBe(true);
    expect(canAccessPath("/apuestas", gestor)).toBe(true);
    expect(canAccessPath("/mis-boletos", gestor)).toBe(false);
  });
});

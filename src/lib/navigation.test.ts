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
});

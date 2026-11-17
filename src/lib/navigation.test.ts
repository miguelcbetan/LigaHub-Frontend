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
});

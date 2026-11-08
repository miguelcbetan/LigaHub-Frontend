import { describe, expect, it } from "vitest";
import { isPasswordValid } from "./password";

describe("isPasswordValid", () => {
  it("accepts passwords that satisfy the backend policy", () => {
    expect(isPasswordValid("Cancha2026!")).toBe(true);
    expect(isPasswordValid("A1bcdef@$")).toBe(true);
  });

  it("rejects passwords outside the length limits", () => {
    expect(isPasswordValid("A1bc!de")).toBe(false);
    expect(isPasswordValid(`A1${"a".repeat(69)}!`)).toBe(true);
    expect(isPasswordValid(`A1${"a".repeat(70)}!`)).toBe(false);
  });

  it("requires upper/lowercase, a number, one permitted symbol, and no whitespace", () => {
    expect(isPasswordValid("abcdefg1!")).toBe(false);
    expect(isPasswordValid("ABCDEFG1!")).toBe(false);
    expect(isPasswordValid("Abcdefgh!")).toBe(false);
    expect(isPasswordValid("Abcdefg1#")).toBe(false);
    expect(isPasswordValid("Abc def1!")).toBe(false);
  });
});

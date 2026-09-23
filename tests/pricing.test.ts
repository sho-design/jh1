import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { quote, PRICING_VERSION, MIN_ORDER, type Geometry } from "@/lib/pricing";
import { parseStl } from "@/lib/stl";

/**
 * Pricing regression suite. If a rate changes, these locked prices move and
 * CI fails. Bump PRICING_VERSION and update the locked values in the same PR.
 */
const raw = readFileSync("public/sample-bracket.stl");
const bracket = parseStl(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer);

describe("STL parser", () => {
  it("reads the sample bracket", () => {
    expect(bracket.triangles).toBe(20);
    expect(bracket.volumeCm3).toBeCloseTo(16.92, 2);
    expect(bracket.bbox).toEqual([60, 30, 40]);
  });
});

describe("pricing regression", () => {
  it("is on the locked version", () => {
    expect(PRICING_VERSION).toBe("2026-09-23.1");
  });

  const cases: Array<[string, Parameters<typeof quote>[0], number]> = [
    ["bracket PLA raw standard x1", { geometry: bracket, materialId: "pla", finish: "raw", speed: "standard", quantity: 1 }, 25],
    ["bracket PETG raw standard x10", { geometry: bracket, materialId: "petg", finish: "raw", speed: "standard", quantity: 10 }, 66.4],
    ["bracket std resin primed expedited x2", { geometry: bracket, materialId: "std-resin", finish: "primed", speed: "expedited", quantity: 2 }, 142.28],
  ];

  it.each(cases)("%s", (_name, input, expected) => {
    expect(quote(input).subtotal).toBe(expected);
  });

  it("never quotes below the minimum order", () => {
    const tiny: Geometry = { volumeCm3: 0.2, areaCm2: 2, bbox: [8, 8, 4] };
    expect(quote({ geometry: tiny, materialId: "pla", finish: "raw", speed: "economy", quantity: 1 }).subtotal).toBe(MIN_ORDER);
  });

  it("charges more for expedited than standard", () => {
    const base = { geometry: bracket, materialId: "petg", finish: "raw" as const, quantity: 20 };
    expect(quote({ ...base, speed: "expedited" }).subtotal).toBeGreaterThan(quote({ ...base, speed: "standard" }).subtotal);
  });

  it("flags parts larger than the build volume", () => {
    const big: Geometry = { volumeCm3: 900, areaCm2: 800, bbox: [300, 120, 90] };
    expect(quote({ geometry: big, materialId: "pla", finish: "raw", speed: "standard", quantity: 1 }).flags.length).toBeGreaterThan(0);
  });
});

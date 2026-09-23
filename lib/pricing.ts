/**
 * Pricing engine. Every change to any rate below is a new PRICING_VERSION.
 * The regression test in tests/pricing.test.ts locks reference prices, so a
 * rate change without a version bump fails CI.
 *
 * SAMPLE RATES. Replace with the client's real costs from the discovery brief
 * (Section 5) before launch.
 */

export const PRICING_VERSION = "2026-09-23.1";

export type ProcessId = "fdm" | "sla";
export type SpeedId = "economy" | "standard" | "expedited";
export type FinishId = "raw" | "sanded" | "primed" | "painted";

export interface Material {
  id: string;
  name: string;
  process: ProcessId;
  /** grams per cm3 */
  density: number;
  /** CAD per gram, material cost including waste */
  costPerGram: number;
  note: string;
}

export const MATERIALS: Material[] = [
  { id: "pla", name: "PLA", process: "fdm", density: 1.24, costPerGram: 0.06, note: "Fast, stiff prototypes" },
  { id: "petg", name: "PETG", process: "fdm", density: 1.27, costPerGram: 0.07, note: "Tougher, some heat resistance" },
  { id: "asa", name: "ASA", process: "fdm", density: 1.07, costPerGram: 0.09, note: "UV stable, outdoor parts" },
  { id: "pa-cf", name: "Nylon CF", process: "fdm", density: 1.2, costPerGram: 0.22, note: "Stiff, strong functional parts" },
  { id: "std-resin", name: "Standard resin", process: "sla", density: 1.15, costPerGram: 0.16, note: "Fine detail, smooth surface" },
  { id: "tough-resin", name: "Tough resin", process: "sla", density: 1.14, costPerGram: 0.24, note: "Snap fits, impact resistance" },
];

export const PROCESS = {
  fdm: {
    name: "FDM",
    /** CAD per machine hour */
    machineRate: 6,
    /** printed cm3 per hour at standard settings (with ~20% infill factor applied below) */
    throughput: 14,
    /** share of solid volume actually printed (walls + infill) */
    fillFactor: 0.45,
    minFeatureMm: 0.8,
  },
  sla: {
    name: "SLA",
    machineRate: 9,
    /** vertical build speed, mm of height per hour */
    zSpeed: 18,
    fillFactor: 1,
    minFeatureMm: 0.3,
  },
} as const;

export const FINISHES: Record<FinishId, { name: string; perPart: number; perCm2: number }> = {
  raw: { name: "Raw, supports off", perPart: 0, perCm2: 0 },
  sanded: { name: "Sanded", perPart: 4, perCm2: 0.02 },
  primed: { name: "Sanded and primed", perPart: 8, perCm2: 0.04 },
  painted: { name: "Painted, one colour", perPart: 18, perCm2: 0.07 },
};

export const SPEEDS: Record<SpeedId, { name: string; multiplier: number; days: string }> = {
  economy: { name: "Economy", multiplier: 0.85, days: "5 to 7 business days" },
  standard: { name: "Standard", multiplier: 1, days: "3 to 4 business days" },
  expedited: { name: "Expedited", multiplier: 1.6, days: "24 to 72 hours" },
};

export const SETUP_FEE = 12;
export const MIN_ORDER = 25;
/** HST in Ontario. Stripe Tax computes the real rate at checkout by province. */
export const DISPLAY_TAX_RATE = 0.13;

export interface Geometry {
  /** solid volume in cm3 */
  volumeCm3: number;
  /** surface area in cm2 */
  areaCm2: number;
  /** bounding box in mm */
  bbox: [number, number, number];
}

export interface QuoteInput {
  geometry: Geometry;
  materialId: string;
  finish: FinishId;
  speed: SpeedId;
  quantity: number;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  version: string;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
  lines: QuoteLine[];
  grams: number;
  machineHours: number;
  flags: string[];
  lead: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const BUILD_VOLUME: Record<ProcessId, [number, number, number]> = {
  fdm: [250, 250, 250],
  sla: [145, 145, 185],
};

export function getMaterial(id: string): Material {
  const m = MATERIALS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown material: ${id}`);
  return m;
}

export function printabilityFlags(g: Geometry, process: ProcessId): string[] {
  const flags: string[] = [];
  const vol = BUILD_VOLUME[process];
  const dims = [...g.bbox].sort((a, b) => b - a);
  const cap = [...vol].sort((a, b) => b - a);
  if (dims.some((d, i) => d > cap[i])) {
    flags.push(`Part is larger than the ${PROCESS[process].name} build volume (${vol.join(" × ")} mm). It will be split or routed to a partner.`);
  }
  if (g.volumeCm3 < 0.05) flags.push("Very small part. An engineer will confirm the smallest features print cleanly.");
  if (g.bbox.some((d) => d < PROCESS[process].minFeatureMm)) {
    flags.push(`A dimension is thinner than ${PROCESS[process].minFeatureMm} mm, the minimum for ${PROCESS[process].name}.`);
  }
  return flags;
}

export function quote(input: QuoteInput): Quote {
  const { geometry: g, finish, speed } = input;
  const quantity = Math.max(1, Math.min(500, Math.floor(input.quantity || 1)));
  const material = getMaterial(input.materialId);
  const proc = material.process;

  const printedCm3 = g.volumeCm3 * PROCESS[proc].fillFactor;
  const grams = printedCm3 * material.density;

  let hours: number;
  if (proc === "fdm") {
    hours = printedCm3 / PROCESS.fdm.throughput + 0.25;
  } else {
    hours = g.bbox[2] / PROCESS.sla.zSpeed + 0.5;
  }

  const materialCost = grams * material.costPerGram;
  const machineCost = hours * PROCESS[proc].machineRate;
  const f = FINISHES[finish];
  const finishCost = f.perPart + f.perCm2 * g.areaCm2;

  const unitBase = materialCost + machineCost + finishCost;
  const mult = SPEEDS[speed].multiplier;
  const unitPrice = round2(unitBase * mult);
  const setup = round2(SETUP_FEE * mult);

  let subtotal = round2(unitPrice * quantity + setup);
  const lines: QuoteLine[] = [
    { label: `${material.name}, ${round2(grams)} g`, amount: round2(materialCost * mult * quantity) },
    { label: `${PROCESS[proc].name} machine time, ${round2(hours)} h`, amount: round2(machineCost * mult * quantity) },
  ];
  if (finishCost > 0) lines.push({ label: f.name, amount: round2(finishCost * mult * quantity) });
  lines.push({ label: "Setup and engineer review", amount: setup });

  if (subtotal < MIN_ORDER) {
    lines.push({ label: "Minimum order top-up", amount: round2(MIN_ORDER - subtotal) });
    subtotal = MIN_ORDER;
  }

  const tax = round2(subtotal * DISPLAY_TAX_RATE);
  return {
    version: PRICING_VERSION,
    unitPrice,
    subtotal,
    tax,
    total: round2(subtotal + tax),
    lines,
    grams: round2(grams),
    machineHours: round2(hours),
    flags: printabilityFlags(g, proc),
    lead: SPEEDS[speed].days,
  };
}

export const cad = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

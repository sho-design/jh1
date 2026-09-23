export interface ProcessPage {
  slug: string;
  name: string;
  lane: "in_house" | "partner";
  title: string;
  answer: string;
  bestFor: string[];
  materials: string[];
  limits: string[];
}

export const PROCESS_PAGES: ProcessPage[] = [
  {
    slug: "fdm",
    name: "FDM",
    lane: "in_house",
    title: "FDM 3D printing in Toronto and the GTA",
    answer: "FDM prints parts layer by layer from plastic filament. It is the fastest and lowest-cost way to get functional prototypes, jigs and fixtures, and we print it in our own Mississauga shop with Expedited delivery in 24 to 72 hours.",
    bestFor: ["Functional prototypes", "Jigs, fixtures and brackets", "Large parts up to 250 mm per side", "Short runs of end-use parts"],
    materials: ["PLA", "PETG", "ASA", "Nylon carbon fibre"],
    limits: ["Visible layer lines unless sanded or primed", "Minimum wall about 0.8 mm", "Strength is lower between layers than along them"],
  },
  {
    slug: "sla",
    name: "SLA",
    lane: "in_house",
    title: "SLA resin 3D printing in Toronto and the GTA",
    answer: "SLA cures liquid resin with light to make smooth, highly detailed parts. It suits cosmetic prototypes, small precise features and moulding masters, and we print it in-house for fast turnaround.",
    bestFor: ["Cosmetic and presentation models", "Small parts with fine detail", "Snap fits in tough resin", "Masters for casting and moulding"],
    materials: ["Standard resin", "Tough resin"],
    limits: ["Build volume up to 145 × 145 × 185 mm", "Standard resin is brittle under impact", "Parts can yellow in direct sunlight"],
  },
  {
    slug: "sls",
    name: "SLS",
    lane: "partner",
    title: "SLS nylon 3D printing, delivered in Ontario",
    answer: "SLS fuses nylon powder with a laser and needs no supports, so it handles complex, interlocking and production parts. We route SLS to vetted Ontario partner shops, inspect every part, and ship it to you under one order.",
    bestFor: ["Strong, durable end-use parts", "Complex geometry with no support marks", "Batches of small parts"],
    materials: ["Nylon PA12"],
    limits: ["Grainy surface unless dyed or tumbled", "Longer lead times than in-house FDM and SLA"],
  },
  {
    slug: "mjf",
    name: "MJF",
    lane: "partner",
    title: "MJF 3D printing for production nylon parts",
    answer: "Multi Jet Fusion produces dense nylon parts with consistent strength, well suited to production runs. We route MJF to partner shops and check the parts before they reach you.",
    bestFor: ["Production runs of nylon parts", "Housings and enclosures", "Parts that need consistent strength"],
    materials: ["Nylon PA12"],
    limits: ["Grey finish by default, dyed black on request", "Priced by quote while partner rates are connected"],
  },
  {
    slug: "metal",
    name: "Metal",
    lane: "partner",
    title: "Metal 3D printing in stainless steel and aluminium",
    answer: "Metal printing builds fully dense parts from powder for high-strength and high-temperature uses. We route metal work to specialist partners and review the parts and paperwork before delivery.",
    bestFor: ["Tooling inserts", "Complex brackets and manifolds", "Low-volume metal parts"],
    materials: ["Stainless steel 316L", "Aluminium AlSi10Mg"],
    limits: ["Requires support removal and machining for tight tolerances", "Priced by engineer quote"],
  },
];

export const getProcess = (slug: string) => PROCESS_PAGES.find((p) => p.slug === slug);

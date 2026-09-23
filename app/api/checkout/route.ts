import { NextResponse } from "next/server";
import Stripe from "stripe";
import { quote, MATERIALS, FINISHES, SPEEDS, type FinishId, type SpeedId, type Geometry } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

/**
 * Creates a Stripe Checkout Session in CAD. The price is recomputed on the
 * server from the geometry, never trusted from the browser.
 * Week 1: geometry comes from the stored file (Vercel Blob + geometry worker),
 * not the request body, and the quote is written to Postgres first.
 */
export async function POST(req: Request) {
  let body: {
    fileName?: string; geometry?: Geometry; materialId?: string; finish?: FinishId;
    speed?: SpeedId; quantity?: number; poNumber?: string;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }

  const g = body.geometry;
  const valid =
    g && [g.volumeCm3, g.areaCm2, ...(g.bbox ?? [])].every((n) => typeof n === "number" && isFinite(n) && n >= 0) &&
    g.bbox?.length === 3 &&
    MATERIALS.some((m) => m.id === body.materialId) &&
    body.finish && body.finish in FINISHES &&
    body.speed && body.speed in SPEEDS;
  if (!valid) return NextResponse.json({ message: "The quote is incomplete. Reload the page and try again." }, { status: 400 });

  const q = quote({ geometry: g!, materialId: body.materialId!, finish: body.finish!, speed: body.speed!, quantity: body.quantity ?? 1 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({
      demo: true,
      message: `Demo mode: checkout is not connected yet. This order would be charged ${q.subtotal.toFixed(2)} CAD before tax (pricing ${q.version}). Add STRIPE_SECRET_KEY in Vercel to take real payments.`,
    });
  }

  const stripe = new Stripe(key);
  const site = siteUrl(new URL(req.url).origin);
  const material = MATERIALS.find((m) => m.id === body.materialId)!;
  const qty = Math.max(1, Math.min(500, Math.floor(body.quantity ?? 1)));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "cad",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: Math.round(q.subtotal * 100),
        tax_behavior: "exclusive",
        product_data: {
          name: `${body.fileName ?? "Part"} × ${qty}`,
          description: `${material.name}, ${FINISHES[body.finish!].name}, ${SPEEDS[body.speed!].name} (${q.lead})`,
        },
      },
    }],
    automatic_tax: { enabled: process.env.STRIPE_TAX === "on" },
    shipping_address_collection: { allowed_countries: ["CA"] },
    phone_number_collection: { enabled: true },
    metadata: {
      pricing_version: q.version,
      material: material.id,
      finish: body.finish!,
      speed: body.speed!,
      quantity: String(qty),
      po_number: body.poNumber?.slice(0, 40) ?? "",
    },
    success_url: `${site}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/quote`,
  });

  return NextResponse.json({ url: session.url });
}

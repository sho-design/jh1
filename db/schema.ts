/**
 * Database schema (Neon Postgres via the Vercel Marketplace, Drizzle ORM).
 * Week 0 ships the schema; week 1 wires quotes and orders to it.
 */
import { pgTable, pgEnum, text, integer, numeric, timestamp, jsonb, uuid, boolean } from "drizzle-orm/pg-core";

export const speed = pgEnum("speed", ["economy", "standard", "expedited"]);
export const orderStatus = pgEnum("order_status", [
  "quoted", "paid", "dfm_review", "queued", "printing", "post_processing", "qa", "shipped", "picked_up", "cancelled",
]);
export const lane = pgEnum("lane", ["in_house", "partner"]);
export const printerState = pgEnum("printer_state", ["idle", "printing", "paused", "error", "offline", "maintenance"]);

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  pricingVersion: text("pricing_version").notNull(),
  speed: speed("speed").notNull(),
  subtotalCad: numeric("subtotal_cad", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parts = pgTable("parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").references(() => quotes.id).notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  materialId: text("material_id").notNull(),
  finish: text("finish").notNull(),
  quantity: integer("quantity").notNull(),
  volumeCm3: numeric("volume_cm3", { precision: 12, scale: 3 }).notNull(),
  areaCm2: numeric("area_cm2", { precision: 12, scale: 3 }).notNull(),
  bboxMm: jsonb("bbox_mm").$type<[number, number, number]>().notNull(),
  flags: jsonb("flags").$type<string[]>().default([]).notNull(),
  unitPriceCad: numeric("unit_price_cad", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").references(() => quotes.id).notNull(),
  stripeSessionId: text("stripe_session_id").unique(),
  poNumber: text("po_number"),
  status: orderStatus("status").default("paid").notNull(),
  lane: lane("lane").default("in_house").notNull(),
  shipToProvince: text("ship_to_province"),
  pickup: boolean("pickup").default(false).notNull(),
  trackingUrl: text("tracking_url"),
  totalCad: numeric("total_cad", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const printers = pgTable("printers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  process: text("process").notNull(),
  model: text("model").notNull(),
  /** klipper | octoprint | bambu | prusa | formlabs */
  firmware: text("firmware").notNull(),
  endpoint: text("endpoint"),
  state: printerState("state").default("offline").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  partId: uuid("part_id").references(() => parts.id).notNull(),
  printerId: uuid("printer_id").references(() => printers.id),
  partnerId: text("partner_id"),
  status: orderStatus("status").default("queued").notNull(),
  dfmApprovedBy: text("dfm_approved_by"),
  qaPhotoUrls: jsonb("qa_photo_urls").$type<string[]>().default([]).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  processes: jsonb("processes").$type<string[]>().notNull(),
  contactEmail: text("contact_email").notNull(),
  onTimeRate: numeric("on_time_rate", { precision: 5, scale: 4 }),
  ndaSigned: boolean("nda_signed").default(false).notNull(),
});

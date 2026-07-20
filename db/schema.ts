import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  raHours: real("ra_hours").notNull(),
  decDeg: real("dec_deg").notNull(),
  predictedRa: real("predicted_ra").notNull(),
  predictedDec: real("predicted_dec").notNull(),
  distancePc: real("distance_pc").notNull(),
  periodDays: real("period_days").notNull(),
  minimumMassJupiter: real("minimum_mass_jupiter").notNull(),
  radiusEarth: real("radius_earth").notNull(),
  semiMajorAu: real("semi_major_au").notNull(),
  angularSeparationMas: real("angular_separation_mas").notNull(),
  equilibriumTemp: real("equilibrium_temp").notNull(),
  type: text("type").notNull(),
  confidence: integer("confidence").notNull(),
  probabilitiesJson: text("probabilities_json").notNull(),
});

export const starSystems = sqliteTable("star_systems", {
  id: text("id").primaryKey(),
  designation: text("designation").notNull(),
  displayName: text("display_name"),
  classification: text("classification").notNull(),
  raHours: real("ra_hours").notNull(),
  decDeg: real("dec_deg").notNull(),
  distancePc: real("distance_pc").notNull(),
  starMass: real("star_mass").notNull(),
  starRadius: real("star_radius").notNull(),
  temperatureK: integer("temperature_k").notNull(),
  luminosity: real("luminosity").notNull(),
  ageByr: real("age_byr").notNull(),
  metallicity: real("metallicity").notNull(),
  status: text("status").notNull().default("candidate"),
  confidence: integer("confidence").notNull(),
  summary: text("summary").notNull(),
  epochAt: text("epoch_at").notNull(),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const planets = sqliteTable("planets", {
  id: text("id").primaryKey(),
  systemId: text("system_id").notNull(),
  code: text("code").notNull(),
  displayName: text("display_name"),
  type: text("type").notNull(),
  massEarth: real("mass_earth").notNull(),
  radiusEarth: real("radius_earth").notNull(),
  periodDays: real("period_days").notNull(),
  semiMajorAu: real("semi_major_au").notNull(),
  eccentricity: real("eccentricity").notNull(),
  equilibriumTemp: integer("equilibrium_temp").notNull(),
  epochAngleDeg: real("epoch_angle_deg").notNull(),
  orbitColor: text("orbit_color").notNull(),
  compositionJson: text("composition_json").notNull(),
  atmosphere: text("atmosphere").notNull(),
  state: text("state").notNull(),
  bioScore: integer("bio_score").notNull(),
  bioPrediction: text("bio_prediction").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const namingPackages = sqliteTable("naming_packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceTwd: integer("price_twd").notNull(),
  description: text("description").notNull(),
  featuresJson: text("features_json").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const namingOrders = sqliteTable("naming_orders", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  candidateId: text("candidate_id").notNull(),
  systemId: text("system_id"),
  planetId: text("planet_id"),
  desiredName: text("desired_name").notNull(),
  purchaserName: text("purchaser_name"),
  ownerName: text("owner_name"),
  recipientEmail: text("recipient_email"),
  dedication: text("dedication"),
  email: text("email").notNull(),
  packageName: text("package_name").notNull(),
  amountTwd: integer("amount_twd").notNull(),
  status: text("status").notNull().default("pending"),
  registryCode: text("registry_code"),
  animationTheme: text("animation_theme").default("amber"),
  confirmedAt: text("confirmed_at"),
  paymentProvider: text("payment_provider").default("ecpay"),
  paymentTradeNo: text("payment_trade_no").unique(),
  paymentTradeId: text("payment_trade_id"),
  paymentType: text("payment_type"),
  paymentMessage: text("payment_message"),
  paymentToken: text("payment_token").unique(),
  paymentUpdatedAt: text("payment_updated_at"),
  paidAt: text("paid_at"),
  simulatedPayment: integer("simulated_payment", { mode: "boolean" }).notNull().default(false),
});

export const researchUpdates = sqliteTable("research_updates", {
  id: text("id").primaryKey(),
  systemId: text("system_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  observingNote: text("observing_note").notNull(),
  symbolicMeaning: text("symbolic_meaning").notNull(),
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const inferenceRuns = sqliteTable("inference_runs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  generatedSystemId: text("generated_system_id"),
  notes: text("notes").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
});

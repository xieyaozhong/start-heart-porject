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

export const namingOrders = sqliteTable("naming_orders", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  candidateId: text("candidate_id").notNull(),
  desiredName: text("desired_name").notNull(),
  email: text("email").notNull(),
  packageName: text("package_name").notNull(),
  amountTwd: integer("amount_twd").notNull(),
  status: text("status").notNull().default("test_order"),
});

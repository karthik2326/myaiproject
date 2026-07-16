import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { claimsTable } from "./claims";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().references(() => claimsTable.id),
  cropType: text("crop_type").notNull(),
  damageType: text("damage_type").notNull(),
  severityPct: numeric("severity_pct", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }).notNull(),
  flagForManualReview: boolean("flag_for_manual_review").notNull().default(false),
  modelVersion: text("model_version").notNull().default("v1.0.0"),
  processingTimeMs: integer("processing_time_ms"),
  rawOutput: text("raw_output"),
  weatherCorroborated: boolean("weather_corroborated").notNull().default(false),
  anomalyDetected: boolean("anomaly_detected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;

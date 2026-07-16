import { pgTable, text, serial, integer, boolean, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { claimsTable } from "./claims";

export const inspectionsTable = pgTable("inspections", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().references(() => claimsTable.id),
  staffName: text("staff_name").notNull(),
  staffId: integer("staff_id"),
  status: text("status").notNull().default("scheduled"),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  completedDate: text("completed_date"),
  verifiedCrop: text("verified_crop"),
  verifiedDamage: text("verified_damage"),
  verifiedSeverity: numeric("verified_severity", { precision: 5, scale: 2 }),
  aiOverridden: boolean("ai_overridden").notNull().default(false),
  overrideReason: text("override_reason"),
  notes: text("notes"),
  gpsLat: numeric("gps_lat", { precision: 10, scale: 6 }),
  gpsLng: numeric("gps_lng", { precision: 10, scale: 6 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInspectionSchema = createInsertSchema(inspectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspectionsTable.$inferSelect;

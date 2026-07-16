import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";
import { fieldsTable } from "./fields";

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  fieldId: integer("field_id").notNull().references(() => fieldsTable.id),
  cropType: text("crop_type").notNull(),
  damageType: text("damage_type").notNull(),
  severityPct: numeric("severity_pct", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }).notNull().default("0"),
  status: text("status").notNull().default("pending"),
  imageUrl: text("image_url").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
  district: text("district"),
  state: text("state"),
  estimatedLoss: numeric("estimated_loss", { precision: 12, scale: 2 }),
  compensationSlab: text("compensation_slab"),
  notes: text("notes"),
  flagReason: text("flag_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, createdAt: true, updatedAt: true, submittedAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;

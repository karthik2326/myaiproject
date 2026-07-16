import { pgTable, text, serial, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dataCollectionsTable = pgTable("data_collections", {
  id: serial("id").primaryKey(),
  collectedBy: text("collected_by").notNull(),
  cropType: text("crop_type").notNull(),
  imageUrl: text("image_url").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  annotated: boolean("annotated").notNull().default(false),
  damageType: text("damage_type"),
  severityLabel: text("severity_label"),
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }),
  notes: text("notes"),
  collectionMethod: text("collection_method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDataCollectionSchema = createInsertSchema(dataCollectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataCollection = z.infer<typeof insertDataCollectionSchema>;
export type DataCollection = typeof dataCollectionsTable.$inferSelect;

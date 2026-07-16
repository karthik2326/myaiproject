import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const fieldsTable = pgTable("fields", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  surveyNumber: text("survey_number"),
  areaHectares: numeric("area_hectares", { precision: 10, scale: 2 }).notNull(),
  cropType: text("crop_type").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  village: text("village"),
  season: text("season").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  soilType: text("soil_type"),
  irrigationType: text("irrigation_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFieldSchema = createInsertSchema(fieldsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertField = z.infer<typeof insertFieldSchema>;
export type Field = typeof fieldsTable.$inferSelect;

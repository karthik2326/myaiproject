import { pgTable, text, serial, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weatherEventsTable = pgTable("weather_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  endDate: text("end_date"),
  severity: text("severity").notNull(),
  description: text("description"),
  ndviIndex: numeric("ndvi_index", { precision: 5, scale: 4 }),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWeatherEventSchema = createInsertSchema(weatherEventsTable).omit({ id: true, createdAt: true });
export type InsertWeatherEvent = z.infer<typeof insertWeatherEventSchema>;
export type WeatherEvent = typeof weatherEventsTable.$inferSelect;

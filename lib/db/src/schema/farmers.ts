import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmersTable = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  pmfbyId: text("pmfby_id").notNull().unique(),
  aadhaarLast4: text("aadhaar_last4"),
  state: text("state").notNull(),
  district: text("district").notNull(),
  village: text("village"),
  bankAccount: text("bank_account"),
  bankIfsc: text("bank_ifsc"),
  landHolding: numeric("land_holding", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmersTable.$inferSelect;

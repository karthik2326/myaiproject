import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, weatherEventsTable } from "@workspace/db";
import {
  ListWeatherEventsQueryParams,
  CreateWeatherEventBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeWeatherEvent = (w: any) => ({
  ...w,
  ndviIndex: w.ndviIndex !== null ? parseFloat(w.ndviIndex) : null,
  createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : w.createdAt,
});

router.get("/weather-events", async (req, res): Promise<void> => {
  const query = ListWeatherEventsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { district, state, eventType, fromDate, toDate, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (district) conditions.push(eq(weatherEventsTable.district, district));
  if (state) conditions.push(eq(weatherEventsTable.state, state));
  if (eventType) conditions.push(eq(weatherEventsTable.eventType, eventType));
  if (fromDate) conditions.push(gte(weatherEventsTable.eventDate, fromDate));
  if (toDate) conditions.push(lte(weatherEventsTable.eventDate, toDate));

  const events = await db
    .select()
    .from(weatherEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(weatherEventsTable.eventDate);

  res.json(events.map(serializeWeatherEvent));
});

router.post("/weather-events", async (req, res): Promise<void> => {
  const parsed = CreateWeatherEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(weatherEventsTable).values(parsed.data).returning();
  res.status(201).json(serializeWeatherEvent(event));
});

export default router;

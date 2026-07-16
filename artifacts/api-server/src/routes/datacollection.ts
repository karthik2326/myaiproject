import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dataCollectionsTable } from "@workspace/db";
import {
  ListDataCollectionsQueryParams,
  CreateDataCollectionBody,
  GetDataCollectionParams,
  UpdateDataCollectionParams,
  UpdateDataCollectionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeDataCollection = (d: any) => ({
  ...d,
  latitude: parseFloat(d.latitude),
  longitude: parseFloat(d.longitude),
  qualityScore: d.qualityScore !== null ? parseFloat(d.qualityScore) : null,
  createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
});

router.get("/data-collection", async (req, res): Promise<void> => {
  const query = ListDataCollectionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { cropType, annotated, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (cropType) conditions.push(eq(dataCollectionsTable.cropType, cropType));
  if (annotated !== undefined) conditions.push(eq(dataCollectionsTable.annotated, annotated));

  const records = await db
    .select()
    .from(dataCollectionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(dataCollectionsTable.createdAt);

  res.json(records.map(serializeDataCollection));
});

router.post("/data-collection", async (req, res): Promise<void> => {
  const parsed = CreateDataCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [record] = await db.insert(dataCollectionsTable).values(parsed.data).returning();
  res.status(201).json(serializeDataCollection(record));
});

router.get("/data-collection/:id", async (req, res): Promise<void> => {
  const params = GetDataCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db
    .select()
    .from(dataCollectionsTable)
    .where(eq(dataCollectionsTable.id, params.data.id));

  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }
  res.json(serializeDataCollection(record));
});

router.patch("/data-collection/:id", async (req, res): Promise<void> => {
  const params = UpdateDataCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDataCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [record] = await db
    .update(dataCollectionsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(dataCollectionsTable.id, params.data.id))
    .returning();
  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }
  res.json(serializeDataCollection(record));
});

export default router;

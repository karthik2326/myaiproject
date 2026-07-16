import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, inspectionsTable } from "@workspace/db";
import {
  ListInspectionsQueryParams,
  CreateInspectionBody,
  GetInspectionParams,
  UpdateInspectionParams,
  UpdateInspectionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeInspection = (i: any) => ({
  ...i,
  verifiedSeverity: i.verifiedSeverity !== null ? parseFloat(i.verifiedSeverity) : null,
  gpsLat: i.gpsLat !== null ? parseFloat(i.gpsLat) : null,
  gpsLng: i.gpsLng !== null ? parseFloat(i.gpsLng) : null,
  createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
});

router.get("/inspections", async (req, res): Promise<void> => {
  const query = ListInspectionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { claimId, staffId, status, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (claimId) conditions.push(eq(inspectionsTable.claimId, claimId));
  if (staffId) conditions.push(eq(inspectionsTable.staffId, staffId));
  if (status) conditions.push(eq(inspectionsTable.status, status));

  const inspections = await db
    .select()
    .from(inspectionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(inspectionsTable.scheduledDate);

  res.json(inspections.map(serializeInspection));
});

router.post("/inspections", async (req, res): Promise<void> => {
  const parsed = CreateInspectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [inspection] = await db.insert(inspectionsTable).values({
    ...parsed.data,
    status: "scheduled",
  }).returning();
  res.status(201).json(serializeInspection(inspection));
});

router.get("/inspections/:id", async (req, res): Promise<void> => {
  const params = GetInspectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [inspection] = await db
    .select()
    .from(inspectionsTable)
    .where(eq(inspectionsTable.id, params.data.id));

  if (!inspection) {
    res.status(404).json({ error: "Inspection not found" });
    return;
  }
  res.json(serializeInspection(inspection));
});

router.patch("/inspections/:id", async (req, res): Promise<void> => {
  const params = UpdateInspectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInspectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [inspection] = await db
    .update(inspectionsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(inspectionsTable.id, params.data.id))
    .returning();
  if (!inspection) {
    res.status(404).json({ error: "Inspection not found" });
    return;
  }
  res.json(serializeInspection(inspection));
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, anomaliesTable } from "@workspace/db";
import {
  ListAnomaliesQueryParams,
  GetAnomalyParams,
  ResolveAnomalyParams,
  ResolveAnomalyBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeAnomaly = (a: any) => ({
  ...a,
  createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  resolvedAt: a.resolvedAt instanceof Date ? a.resolvedAt.toISOString() : a.resolvedAt ?? null,
});

router.get("/anomalies", async (req, res): Promise<void> => {
  const query = ListAnomaliesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { claimId, anomalyType, resolved, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (claimId) conditions.push(eq(anomaliesTable.claimId, claimId));
  if (anomalyType) conditions.push(eq(anomaliesTable.anomalyType, anomalyType));
  if (resolved !== undefined) conditions.push(eq(anomaliesTable.resolved, resolved));

  const anomalies = await db
    .select()
    .from(anomaliesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(anomaliesTable.createdAt);

  res.json(anomalies.map(serializeAnomaly));
});

router.get("/anomalies/:id", async (req, res): Promise<void> => {
  const params = GetAnomalyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [anomaly] = await db
    .select()
    .from(anomaliesTable)
    .where(eq(anomaliesTable.id, params.data.id));

  if (!anomaly) {
    res.status(404).json({ error: "Anomaly not found" });
    return;
  }
  res.json(serializeAnomaly(anomaly));
});

router.post("/anomalies/:id/resolve", async (req, res): Promise<void> => {
  const params = ResolveAnomalyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ResolveAnomalyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [anomaly] = await db
    .update(anomaliesTable)
    .set({
      resolved: true,
      resolvedBy: parsed.data.resolvedBy,
      resolvedAt: new Date(),
      resolution: parsed.data.resolution,
    })
    .where(eq(anomaliesTable.id, params.data.id))
    .returning();
  if (!anomaly) {
    res.status(404).json({ error: "Anomaly not found" });
    return;
  }
  res.json(serializeAnomaly(anomaly));
});

export default router;

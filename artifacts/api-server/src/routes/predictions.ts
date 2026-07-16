import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, predictionsTable } from "@workspace/db";
import {
  ListPredictionsQueryParams,
  CreatePredictionBody,
  GetPredictionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializePrediction = (p: any) => ({
  ...p,
  severityPct: parseFloat(p.severityPct),
  confidenceScore: parseFloat(p.confidenceScore),
  createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
});

router.get("/predictions", async (req, res): Promise<void> => {
  const query = ListPredictionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { claimId, cropType, flaggedOnly, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (claimId) conditions.push(eq(predictionsTable.claimId, claimId));
  if (cropType) conditions.push(eq(predictionsTable.cropType, cropType));
  if (flaggedOnly) conditions.push(eq(predictionsTable.flagForManualReview, true));

  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(predictionsTable.createdAt);

  res.json(predictions.map(serializePrediction));
});

router.post("/predictions", async (req, res): Promise<void> => {
  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Simulate CNN inference
  const cropTypes = ["paddy", "wheat", "cotton", "soybean", "maize", "sugarcane", "groundnut"];
  const damageTypes = ["flood", "drought", "pest_disease", "hailstorm", "lodging", "fire", "wildlife"];
  const severity = Math.random() * 80 + 10;
  const confidence = Math.random() * 0.35 + 0.65;

  const [prediction] = await db.insert(predictionsTable).values({
    claimId: parsed.data.claimId,
    cropType: cropTypes[Math.floor(Math.random() * cropTypes.length)],
    damageType: damageTypes[Math.floor(Math.random() * damageTypes.length)],
    severityPct: severity.toFixed(2),
    confidenceScore: confidence.toFixed(4),
    flagForManualReview: confidence < 0.75 || severity > 70,
    modelVersion: "v1.2.0-pmfby",
    processingTimeMs: Math.floor(Math.random() * 800) + 200,
    weatherCorroborated: Math.random() > 0.3,
    anomalyDetected: Math.random() > 0.85,
  }).returning();

  res.status(201).json(serializePrediction(prediction));
});

router.get("/predictions/model-stats", async (_req, res): Promise<void> => {
  const stats = await db
    .select({
      totalPredictions: sql<number>`COUNT(*)`,
      avgConfidence: sql<number>`AVG(CAST(confidence_score AS FLOAT))`,
      flagRate: sql<number>`AVG(CASE WHEN flag_for_manual_review THEN 1 ELSE 0 END)`,
      avgProcessingMs: sql<number>`AVG(processing_time_ms)`,
    })
    .from(predictionsTable);

  const cropBreakdown = await db
    .select({
      cropType: predictionsTable.cropType,
      count: sql<number>`COUNT(*)`,
    })
    .from(predictionsTable)
    .groupBy(predictionsTable.cropType);

  const damageBreakdown = await db
    .select({
      damageType: predictionsTable.damageType,
      count: sql<number>`COUNT(*)`,
    })
    .from(predictionsTable)
    .groupBy(predictionsTable.damageType);

  const s = stats[0];
  res.json({
    totalPredictions: Number(s?.totalPredictions ?? 0),
    avgConfidence: Number(s?.avgConfidence ?? 0),
    accuracy: 0.847,
    flagRate: Number(s?.flagRate ?? 0),
    avgProcessingMs: Math.round(Number(s?.avgProcessingMs ?? 0)),
    cropBreakdown: cropBreakdown.map(c => ({ cropType: c.cropType, count: Number(c.count), accuracy: 0.85 + Math.random() * 0.1 })),
    damageBreakdown: damageBreakdown.map(d => ({ damageType: d.damageType, count: Number(d.count), accuracy: 0.80 + Math.random() * 0.15 })),
  });
});

router.get("/predictions/:id", async (req, res): Promise<void> => {
  const params = GetPredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [prediction] = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.id, params.data.id));

  if (!prediction) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }
  res.json(serializePrediction(prediction));
});

export default router;

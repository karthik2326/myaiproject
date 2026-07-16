import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, claimsTable, farmersTable, activityEventsTable } from "@workspace/db";
import {
  ListClaimsQueryParams,
  CreateClaimBody,
  GetClaimParams,
  UpdateClaimParams,
  UpdateClaimBody,
  ApproveClaimParams,
  ApproveClaimBody,
  RejectClaimParams,
  RejectClaimBody,
  FlagClaimParams,
  FlagClaimBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeClaim = (c: any, farmerName?: string | null) => ({
  ...c,
  farmerName: farmerName ?? null,
  severityPct: parseFloat(c.severityPct),
  confidenceScore: parseFloat(c.confidenceScore),
  latitude: parseFloat(c.latitude),
  longitude: parseFloat(c.longitude),
  estimatedLoss: c.estimatedLoss !== null ? parseFloat(c.estimatedLoss) : null,
  submittedAt: c.submittedAt instanceof Date ? c.submittedAt.toISOString() : c.submittedAt,
  createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  reviewedAt: c.reviewedAt instanceof Date ? c.reviewedAt.toISOString() : c.reviewedAt ?? null,
});

async function logActivity(eventType: string, description: string, entityId: number, actorName?: string) {
  await db.insert(activityEventsTable).values({
    eventType,
    description,
    entityType: "claim",
    entityId,
    actorName: actorName ?? null,
  });
}

router.get("/claims", async (req, res): Promise<void> => {
  const query = ListClaimsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { status, district, cropType, damageType, fromDate, toDate, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (status) conditions.push(eq(claimsTable.status, status));
  if (district) conditions.push(eq(claimsTable.district, district));
  if (cropType) conditions.push(eq(claimsTable.cropType, cropType));
  if (damageType) conditions.push(eq(claimsTable.damageType, damageType));
  if (fromDate) conditions.push(gte(claimsTable.submittedAt, new Date(fromDate)));
  if (toDate) conditions.push(lte(claimsTable.submittedAt, new Date(toDate)));

  const claims = await db
    .select({
      id: claimsTable.id,
      farmerId: claimsTable.farmerId,
      farmerName: farmersTable.name,
      fieldId: claimsTable.fieldId,
      cropType: claimsTable.cropType,
      damageType: claimsTable.damageType,
      severityPct: claimsTable.severityPct,
      confidenceScore: claimsTable.confidenceScore,
      status: claimsTable.status,
      imageUrl: claimsTable.imageUrl,
      latitude: claimsTable.latitude,
      longitude: claimsTable.longitude,
      district: claimsTable.district,
      state: claimsTable.state,
      estimatedLoss: claimsTable.estimatedLoss,
      compensationSlab: claimsTable.compensationSlab,
      notes: claimsTable.notes,
      flagReason: claimsTable.flagReason,
      reviewedBy: claimsTable.reviewedBy,
      reviewedAt: claimsTable.reviewedAt,
      submittedAt: claimsTable.submittedAt,
      createdAt: claimsTable.createdAt,
    })
    .from(claimsTable)
    .leftJoin(farmersTable, eq(claimsTable.farmerId, farmersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(claimsTable.submittedAt);

  res.json(claims.map(c => serializeClaim(c, c.farmerName)));
});

router.post("/claims", async (req, res): Promise<void> => {
  const parsed = CreateClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [claim] = await db.insert(claimsTable).values({
    ...parsed.data,
    status: "pending",
  }).returning();

  await logActivity("claim_submitted", `New claim submitted for ${parsed.data.cropType} - ${parsed.data.damageType} damage`, claim.id);
  res.status(201).json(serializeClaim(claim));
});

router.get("/claims/:id", async (req, res): Promise<void> => {
  const params = GetClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [claim] = await db
    .select({
      id: claimsTable.id,
      farmerId: claimsTable.farmerId,
      farmerName: farmersTable.name,
      fieldId: claimsTable.fieldId,
      cropType: claimsTable.cropType,
      damageType: claimsTable.damageType,
      severityPct: claimsTable.severityPct,
      confidenceScore: claimsTable.confidenceScore,
      status: claimsTable.status,
      imageUrl: claimsTable.imageUrl,
      latitude: claimsTable.latitude,
      longitude: claimsTable.longitude,
      district: claimsTable.district,
      state: claimsTable.state,
      estimatedLoss: claimsTable.estimatedLoss,
      compensationSlab: claimsTable.compensationSlab,
      notes: claimsTable.notes,
      flagReason: claimsTable.flagReason,
      reviewedBy: claimsTable.reviewedBy,
      reviewedAt: claimsTable.reviewedAt,
      submittedAt: claimsTable.submittedAt,
      createdAt: claimsTable.createdAt,
    })
    .from(claimsTable)
    .leftJoin(farmersTable, eq(claimsTable.farmerId, farmersTable.id))
    .where(eq(claimsTable.id, params.data.id));

  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  res.json(serializeClaim(claim, claim.farmerName));
});

router.patch("/claims/:id", async (req, res): Promise<void> => {
  const params = UpdateClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [claim] = await db
    .update(claimsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(claimsTable.id, params.data.id))
    .returning();
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  res.json(serializeClaim(claim));
});

router.post("/claims/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ApproveClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [claim] = await db
    .update(claimsTable)
    .set({
      status: "approved",
      reviewedBy: parsed.data.reviewedBy,
      notes: parsed.data.notes,
      estimatedLoss: parsed.data.estimatedLoss?.toString(),
      compensationSlab: parsed.data.compensationSlab,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(claimsTable.id, params.data.id))
    .returning();
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  await logActivity("claim_approved", `Claim approved by ${parsed.data.reviewedBy}`, params.data.id, parsed.data.reviewedBy);
  res.json(serializeClaim(claim));
});

router.post("/claims/:id/reject", async (req, res): Promise<void> => {
  const params = RejectClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RejectClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [claim] = await db
    .update(claimsTable)
    .set({
      status: "rejected",
      reviewedBy: parsed.data.reviewedBy,
      notes: parsed.data.notes,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(claimsTable.id, params.data.id))
    .returning();
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  await logActivity("claim_rejected", `Claim rejected by ${parsed.data.reviewedBy}`, params.data.id, parsed.data.reviewedBy);
  res.json(serializeClaim(claim));
});

router.post("/claims/:id/flag", async (req, res): Promise<void> => {
  const params = FlagClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = FlagClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [claim] = await db
    .update(claimsTable)
    .set({
      status: "flagged",
      flagReason: parsed.data.flagReason,
      reviewedBy: parsed.data.reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(claimsTable.id, params.data.id))
    .returning();
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  await logActivity("claim_flagged", `Claim flagged: ${parsed.data.flagReason}`, params.data.id, parsed.data.reviewedBy);
  res.json(serializeClaim(claim));
});

export default router;

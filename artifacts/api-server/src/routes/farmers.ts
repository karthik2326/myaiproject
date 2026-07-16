import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, farmersTable, claimsTable } from "@workspace/db";
import {
  ListFarmersQueryParams,
  CreateFarmerBody,
  GetFarmerParams,
  UpdateFarmerParams,
  UpdateFarmerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/farmers", async (req, res): Promise<void> => {
  const query = ListFarmersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { district, state, search, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (district) conditions.push(eq(farmersTable.district, district));
  if (state) conditions.push(eq(farmersTable.state, state));
  if (search) conditions.push(ilike(farmersTable.name, `%${search}%`));

  const farmers = await db
    .select({
      id: farmersTable.id,
      name: farmersTable.name,
      phone: farmersTable.phone,
      email: farmersTable.email,
      pmfbyId: farmersTable.pmfbyId,
      aadhaarLast4: farmersTable.aadhaarLast4,
      state: farmersTable.state,
      district: farmersTable.district,
      village: farmersTable.village,
      bankAccount: farmersTable.bankAccount,
      bankIfsc: farmersTable.bankIfsc,
      landHolding: farmersTable.landHolding,
      createdAt: farmersTable.createdAt,
      totalClaims: sql<number>`(SELECT COUNT(*) FROM claims WHERE claims.farmer_id = ${farmersTable.id})`,
    })
    .from(farmersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(farmersTable.createdAt);

  res.json(farmers.map(f => ({
    ...f,
    landHolding: f.landHolding !== null ? parseFloat(f.landHolding) : null,
    totalClaims: Number(f.totalClaims),
    createdAt: f.createdAt.toISOString(),
  })));
});

router.post("/farmers", async (req, res): Promise<void> => {
  const parsed = CreateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [farmer] = await db.insert(farmersTable).values(parsed.data).returning();
  res.status(201).json({
    ...farmer,
    landHolding: farmer.landHolding !== null ? parseFloat(farmer.landHolding) : null,
    totalClaims: 0,
    createdAt: farmer.createdAt.toISOString(),
  });
});

router.get("/farmers/:id", async (req, res): Promise<void> => {
  const params = GetFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [farmer] = await db
    .select({
      id: farmersTable.id,
      name: farmersTable.name,
      phone: farmersTable.phone,
      email: farmersTable.email,
      pmfbyId: farmersTable.pmfbyId,
      aadhaarLast4: farmersTable.aadhaarLast4,
      state: farmersTable.state,
      district: farmersTable.district,
      village: farmersTable.village,
      bankAccount: farmersTable.bankAccount,
      bankIfsc: farmersTable.bankIfsc,
      landHolding: farmersTable.landHolding,
      createdAt: farmersTable.createdAt,
      totalClaims: sql<number>`(SELECT COUNT(*) FROM claims WHERE claims.farmer_id = ${farmersTable.id})`,
    })
    .from(farmersTable)
    .where(eq(farmersTable.id, params.data.id));

  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }
  res.json({
    ...farmer,
    landHolding: farmer.landHolding !== null ? parseFloat(farmer.landHolding) : null,
    totalClaims: Number(farmer.totalClaims),
    createdAt: farmer.createdAt.toISOString(),
  });
});

router.patch("/farmers/:id", async (req, res): Promise<void> => {
  const params = UpdateFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [farmer] = await db
    .update(farmersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(farmersTable.id, params.data.id))
    .returning();
  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }
  res.json({
    ...farmer,
    landHolding: farmer.landHolding !== null ? parseFloat(farmer.landHolding) : null,
    totalClaims: 0,
    createdAt: farmer.createdAt.toISOString(),
  });
});

router.get("/farmers/:id/claims", async (req, res): Promise<void> => {
  const params = GetFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const claims = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.farmerId, params.data.id))
    .orderBy(claimsTable.createdAt);

  res.json(claims.map(c => ({
    ...c,
    severityPct: parseFloat(c.severityPct),
    confidenceScore: parseFloat(c.confidenceScore),
    latitude: parseFloat(c.latitude),
    longitude: parseFloat(c.longitude),
    estimatedLoss: c.estimatedLoss !== null ? parseFloat(c.estimatedLoss) : null,
    submittedAt: c.submittedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
    farmerName: null,
  })));
});

export default router;

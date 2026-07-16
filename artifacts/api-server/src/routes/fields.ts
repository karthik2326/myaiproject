import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, fieldsTable, farmersTable } from "@workspace/db";
import {
  ListFieldsQueryParams,
  CreateFieldBody,
  GetFieldParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeField = (f: any, farmerName?: string | null) => ({
  ...f,
  farmerName: farmerName ?? null,
  areaHectares: parseFloat(f.areaHectares),
  latitude: f.latitude !== null ? parseFloat(f.latitude) : null,
  longitude: f.longitude !== null ? parseFloat(f.longitude) : null,
  createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
});

router.get("/fields", async (req, res): Promise<void> => {
  const query = ListFieldsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { farmerId, district, cropType, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (farmerId) conditions.push(eq(fieldsTable.farmerId, farmerId));
  if (district) conditions.push(eq(fieldsTable.district, district));
  if (cropType) conditions.push(eq(fieldsTable.cropType, cropType));

  const fields = await db
    .select({
      id: fieldsTable.id,
      farmerId: fieldsTable.farmerId,
      farmerName: farmersTable.name,
      surveyNumber: fieldsTable.surveyNumber,
      areaHectares: fieldsTable.areaHectares,
      cropType: fieldsTable.cropType,
      state: fieldsTable.state,
      district: fieldsTable.district,
      village: fieldsTable.village,
      season: fieldsTable.season,
      latitude: fieldsTable.latitude,
      longitude: fieldsTable.longitude,
      soilType: fieldsTable.soilType,
      irrigationType: fieldsTable.irrigationType,
      createdAt: fieldsTable.createdAt,
    })
    .from(fieldsTable)
    .leftJoin(farmersTable, eq(fieldsTable.farmerId, farmersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  res.json(fields.map(f => serializeField(f, f.farmerName)));
});

router.post("/fields", async (req, res): Promise<void> => {
  const parsed = CreateFieldBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [field] = await db.insert(fieldsTable).values(parsed.data).returning();
  res.status(201).json(serializeField(field));
});

router.get("/fields/:id", async (req, res): Promise<void> => {
  const params = GetFieldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [result] = await db
    .select({
      id: fieldsTable.id,
      farmerId: fieldsTable.farmerId,
      farmerName: farmersTable.name,
      surveyNumber: fieldsTable.surveyNumber,
      areaHectares: fieldsTable.areaHectares,
      cropType: fieldsTable.cropType,
      state: fieldsTable.state,
      district: fieldsTable.district,
      village: fieldsTable.village,
      season: fieldsTable.season,
      latitude: fieldsTable.latitude,
      longitude: fieldsTable.longitude,
      soilType: fieldsTable.soilType,
      irrigationType: fieldsTable.irrigationType,
      createdAt: fieldsTable.createdAt,
    })
    .from(fieldsTable)
    .leftJoin(farmersTable, eq(fieldsTable.farmerId, farmersTable.id))
    .where(eq(fieldsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Field not found" });
    return;
  }
  res.json(serializeField(result, result.farmerName));
});

export default router;

import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, claimsTable, farmersTable, fieldsTable, anomaliesTable, activityEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [claimStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
    rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
    flagged: sql<number>`SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END)`,
    underReview: sql<number>`SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END)`,
    totalPayout: sql<number>`SUM(CASE WHEN status = 'approved' THEN CAST(estimated_loss AS FLOAT) ELSE 0 END)`,
    avgSeverity: sql<number>`AVG(CAST(severity_pct AS FLOAT))`,
    avgConfidence: sql<number>`AVG(CAST(confidence_score AS FLOAT))`,
  }).from(claimsTable);

  const [farmerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(farmersTable);
  const [fieldCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(fieldsTable);
  const [anomalyStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    unresolved: sql<number>`SUM(CASE WHEN resolved = false THEN 1 ELSE 0 END)`,
  }).from(anomaliesTable);

  res.json({
    totalFarmers: Number(farmerCount?.count ?? 0),
    totalFields: Number(fieldCount?.count ?? 0),
    totalClaims: Number(claimStats?.total ?? 0),
    pendingClaims: Number(claimStats?.pending ?? 0),
    approvedClaims: Number(claimStats?.approved ?? 0),
    rejectedClaims: Number(claimStats?.rejected ?? 0),
    flaggedClaims: Number(claimStats?.flagged ?? 0),
    underReviewClaims: Number(claimStats?.underReview ?? 0),
    totalPayout: Number(claimStats?.totalPayout ?? 0),
    avgSeverity: Number(claimStats?.avgSeverity ?? 0),
    avgConfidence: Number(claimStats?.avgConfidence ?? 0),
    totalAnomalies: Number(anomalyStats?.total ?? 0),
    unresolvedAnomalies: Number(anomalyStats?.unresolved ?? 0),
  });
});

router.get("/dashboard/claims-by-status", async (_req, res): Promise<void> => {
  const result = await db
    .select({ status: claimsTable.status, count: sql<number>`COUNT(*)` })
    .from(claimsTable)
    .groupBy(claimsTable.status);

  res.json(result.map(r => ({ status: r.status, count: Number(r.count) })));
});

router.get("/dashboard/claims-by-damage", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      damageType: claimsTable.damageType,
      count: sql<number>`COUNT(*)`,
      avgSeverity: sql<number>`AVG(CAST(severity_pct AS FLOAT))`,
    })
    .from(claimsTable)
    .groupBy(claimsTable.damageType)
    .orderBy(sql`COUNT(*) DESC`);

  res.json(result.map(r => ({
    damageType: r.damageType,
    count: Number(r.count),
    avgSeverity: Number(r.avgSeverity ?? 0),
  })));
});

router.get("/dashboard/claims-by-district", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      district: claimsTable.district,
      state: claimsTable.state,
      count: sql<number>`COUNT(*)`,
    })
    .from(claimsTable)
    .groupBy(claimsTable.district, claimsTable.state)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(20);

  res.json(result.map(r => ({
    district: r.district ?? "Unknown",
    state: r.state ?? "Unknown",
    count: Number(r.count),
  })));
});

router.get("/dashboard/claims-over-time", async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "monthly";
  let dateTrunc = "month";
  if (period === "daily") dateTrunc = "day";
  else if (period === "weekly") dateTrunc = "week";

  const result = await db.execute(sql`
    SELECT 
      TO_CHAR(DATE_TRUNC(${dateTrunc}, submitted_at), 'YYYY-MM-DD') as period,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN status = 'approved' AND estimated_loss IS NOT NULL THEN CAST(estimated_loss AS FLOAT) ELSE 0 END) as total_value
    FROM claims
    GROUP BY DATE_TRUNC(${dateTrunc}, submitted_at)
    ORDER BY DATE_TRUNC(${dateTrunc}, submitted_at)
    LIMIT 24
  `);

  res.json((result.rows as any[]).map(r => ({
    period: r.period,
    count: Number(r.count),
    approvedCount: Number(r.approved_count),
    totalValue: Number(r.total_value),
  })));
});

router.get("/dashboard/severity-distribution", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT 
      CASE 
        WHEN CAST(severity_pct AS FLOAT) < 25 THEN '0-25%'
        WHEN CAST(severity_pct AS FLOAT) < 50 THEN '25-50%'
        WHEN CAST(severity_pct AS FLOAT) < 75 THEN '50-75%'
        ELSE '75-100%'
      END as bucket,
      COUNT(*) as count
    FROM claims
    GROUP BY bucket
    ORDER BY bucket
  `);

  res.json((result.rows as any[]).map(r => ({
    bucket: r.bucket,
    count: Number(r.count),
  })));
});

router.get("/dashboard/top-districts", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT 
      district,
      state,
      COUNT(*) as claim_count,
      SUM(CASE WHEN status = 'approved' AND estimated_loss IS NOT NULL THEN CAST(estimated_loss AS FLOAT) ELSE 0 END) as total_payout,
      AVG(CAST(severity_pct AS FLOAT)) as avg_severity
    FROM claims
    WHERE district IS NOT NULL
    GROUP BY district, state
    ORDER BY claim_count DESC
    LIMIT 10
  `);

  res.json((result.rows as any[]).map(r => ({
    district: r.district,
    state: r.state,
    claimCount: Number(r.claim_count),
    totalPayout: Number(r.total_payout),
    avgSeverity: Number(r.avg_severity),
  })));
});

export default router;

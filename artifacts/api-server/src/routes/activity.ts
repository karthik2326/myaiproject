import { Router, type IRouter } from "express";
import { db, activityEventsTable } from "@workspace/db";
import { ListActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const query = ListActivityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { limit = 20, offset = 0 } = query.data;

  const events = await db
    .select()
    .from(activityEventsTable)
    .limit(limit)
    .offset(offset)
    .orderBy(activityEventsTable.createdAt);

  res.json(events.map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;

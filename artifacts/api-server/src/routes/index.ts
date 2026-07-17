import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import farmersRouter from "./farmers";
import fieldsRouter from "./fields";
import claimsRouter from "./claims";
import predictionsRouter from "./predictions";
import inspectionsRouter from "./inspections";
import anomaliesRouter from "./anomalies";
import weatherRouter from "./weather";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";
import datacollectionRouter from "./datacollection";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(fieldsRouter);
router.use(claimsRouter);
router.use(predictionsRouter);
router.use(inspectionsRouter);
router.use(anomaliesRouter);
router.use(weatherRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(datacollectionRouter);
router.use(storageRouter);

export default router;

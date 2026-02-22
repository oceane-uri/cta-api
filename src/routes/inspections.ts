// src/routes/inspections.ts
import express, { type RequestHandler } from 'express';
import {
  getAllInspections,
  getMonthlyCTACount,
  getDailyCTACount,
  getTotalDelayedVehicles,
  getStatsByVehicleType,
  getStatsBySiteType,
  getDelayedStats,
  getTotalPlates,
  getUniquePlatesWithLastVisit,
  getVehicleByPlate
} from '../controllers/inspectionsController';
import {
  getDelayStatsFromUniquePlates,
} from '../controllers/getDelayStatsFromUniquePlatesController';
import {
  getStatsByDateRange
} from '../controllers/getStatsByDateRangeController';
import { updateVehicleType, batchUpdateVehicleTypes } from '../controllers/vehicleController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', getAllInspections as RequestHandler); // Toutes les inspections
router.get('/stats/vehicle-type', getStatsByVehicleType as RequestHandler); // Stats par type de véhicule
router.get('/stats/site-type', getStatsBySiteType as RequestHandler); // Stats par type de site (DG, annexes, etc.)
router.get('/stats/delays', getDelayedStats as RequestHandler); // Retards de CTA
router.get('/stats/total-plates', getTotalPlates as RequestHandler); // Total d’immatriculations
router.get('/unique-plates', getUniquePlatesWithLastVisit as RequestHandler);
router.get('/vehicles/:plate', getVehicleByPlate as RequestHandler);
router.get('/stats/retards/plaque-unique', getDelayStatsFromUniquePlates as RequestHandler);
router.get('/stats/periode', getStatsByDateRange as RequestHandler);




router.get('/stats/monthly', getMonthlyCTACount as RequestHandler);
router.get('/stats/daily', getDailyCTACount as RequestHandler);
router.get('/stats/total-retards', getTotalDelayedVehicles as RequestHandler);

// Routes protégées pour la mise à jour des types de véhicules
router.patch('/vehicles/type', authMiddleware, updateVehicleType);
router.patch('/vehicles/type/batch', authMiddleware, batchUpdateVehicleTypes);

export default router;

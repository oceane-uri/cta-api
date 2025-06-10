// src/routes/inspections.ts
import express from 'express';
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
import { searchVehicleByPlate } from '../controllers/searchController';
// import * as search from '../controllers/searchController';

const router = express.Router();

router.get('/', getAllInspections); // Toutes les inspections
router.get('/stats/vehicle-type', getStatsByVehicleType); // Stats par type de véhicule
router.get('/stats/site-type', getStatsBySiteType); // Stats par type de site (DG, annexes, etc.)
router.get('/stats/delays', getDelayedStats); // Retards de CTA
router.get('/stats/total-plates', getTotalPlates); // Total d’immatriculations
router.get('/unique-plates', getUniquePlatesWithLastVisit); //Pour la liste des véhicules et leur dernier passage au CTA
// router.get('/search/:plate', searchVehicleByPlate);//Rechercher par plaque d'immatriculation
router.get('/vehicles/:plate', getVehicleByPlate); // Recherche par plaque
router.get('/stats/retards/plaque-unique', getDelayStatsFromUniquePlates);//Retards unique de CTA
router.get('/stats/periode', getStatsByDateRange);
// router.get('/search/:plate', searchVehicleByPlate);




router.get("/stats/monthly", getMonthlyCTACount);
router.get("/stats/daily", getDailyCTACount);
router.get("/stats/total-retards", getTotalDelayedVehicles);
// router.get("/details/:plate", searchVehicleDetailsByPlate);





export default router;

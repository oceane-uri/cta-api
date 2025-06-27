"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/inspections.ts
const express_1 = __importDefault(require("express"));
const inspectionsController_1 = require("../controllers/inspectionsController");
const getDelayStatsFromUniquePlatesController_1 = require("../controllers/getDelayStatsFromUniquePlatesController");
const getStatsByDateRangeController_1 = require("../controllers/getStatsByDateRangeController");
// import * as search from '../controllers/searchController';
const router = express_1.default.Router();
router.get('/', inspectionsController_1.getAllInspections); // Toutes les inspections
router.get('/stats/vehicle-type', inspectionsController_1.getStatsByVehicleType); // Stats par type de véhicule
router.get('/stats/site-type', inspectionsController_1.getStatsBySiteType); // Stats par type de site (DG, annexes, etc.)
router.get('/stats/delays', inspectionsController_1.getDelayedStats); // Retards de CTA
router.get('/stats/total-plates', inspectionsController_1.getTotalPlates); // Total d’immatriculations
router.get('/unique-plates', inspectionsController_1.getUniquePlatesWithLastVisit); //Pour la liste des véhicules et leur dernier passage au CTA
// router.get('/search/:plate', searchVehicleByPlate);//Rechercher par plaque d'immatriculation
router.get('/vehicles/:plate', inspectionsController_1.getVehicleByPlate); // Recherche par plaque
router.get('/stats/retards/plaque-unique', getDelayStatsFromUniquePlatesController_1.getDelayStatsFromUniquePlates); //Retards unique de CTA
router.get('/stats/periode', getStatsByDateRangeController_1.getStatsByDateRange);
// router.get('/search/:plate', searchVehicleByPlate);
router.get("/stats/monthly", inspectionsController_1.getMonthlyCTACount);
router.get("/stats/daily", inspectionsController_1.getDailyCTACount);
router.get("/stats/total-retards", inspectionsController_1.getTotalDelayedVehicles);
// router.get("/details/:plate", searchVehicleDetailsByPlate);
exports.default = router;

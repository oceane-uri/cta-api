"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVehicleByPlate = exports.getDelayStatsFromUniquePlates = void 0;
const db_1 = require("../config/db");
const cache_1 = require("../utils/cache");
/**
 * Statistiques de retards pour plaques uniques - optimisées avec calcul SQL + cache
 */
const getDelayStatsFromUniquePlates = async (_req, res) => {
    try {
        const cacheKey = (0, cache_1.getCacheKey)('stats:retards-plaque-unique', {});
        const cached = cache_1.cache.get(cacheKey);
        if (cached)
            return res.json(cached);
        const [rows] = await db_1.pool.query(`
      SELECT 
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH) 
          THEN 1 ELSE 0 
        END) AS '24+ mois',
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 18 MONTH) 
          THEN 1 ELSE 0 
        END) AS '18 mois',
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 18 MONTH)
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) 
          THEN 1 ELSE 0 
        END) AS '12 mois',
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 9 MONTH) 
          THEN 1 ELSE 0 
        END) AS '9 mois',
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 9 MONTH)
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) 
          THEN 1 ELSE 0 
        END) AS '6 mois',
        SUM(CASE 
          WHEN v.datevalidite IS NOT NULL 
            AND v.datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            AND v.datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH) 
          THEN 1 ELSE 0 
        END) AS '3 mois'
      FROM vehicules v
      INNER JOIN (
        SELECT immatriculation, MAX(datevisite) AS max_date
        FROM vehicules
        GROUP BY immatriculation
      ) last_visits
      ON v.immatriculation = last_visits.immatriculation
        AND v.datevisite = last_visits.max_date
      WHERE v.datevalidite IS NOT NULL 
        AND v.datevalidite < CURRENT_DATE()
    `);
        const result = rows[0];
        const response = {
            '3 mois': Number(result['3 mois']) || 0,
            '6 mois': Number(result['6 mois']) || 0,
            '9 mois': Number(result['9 mois']) || 0,
            '12 mois': Number(result['12 mois']) || 0,
            '18 mois': Number(result['18 mois']) || 0,
            '24+ mois': Number(result['24+ mois']) || 0,
        };
        cache_1.cache.set(cacheKey, response, 90 * 1000); // 90s, CTA Stat refetch 60s
        res.json(response);
    }
    catch (err) {
        console.error('Erreur getDelayStatsFromUniquePlates:', err);
        res.status(500).json({ message: 'Erreur lors du calcul des retards', error: err });
    }
};
exports.getDelayStatsFromUniquePlates = getDelayStatsFromUniquePlates;
const searchVehicleByPlate = async (req, res) => {
    const { plate } = req.params;
    try {
        const [rows] = await db_1.pool.query(`
      SELECT 
        immatriculation, 
        typevehicule, 
        datevisite AS derniere_visite, 
        datevalidite, 
        agences
      FROM vehicules
      WHERE immatriculation = ?
      ORDER BY datevisite DESC
      LIMIT 1
      `, [plate]);
        const vehicle = rows[0];
        if (!vehicle) {
            return res.status(404).json({ message: 'Aucun véhicule trouvé avec cette plaque' });
        }
        res.json(vehicle);
    }
    catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la recherche détaillée',
            error: err.message,
        });
    }
};
exports.searchVehicleByPlate = searchVehicleByPlate;

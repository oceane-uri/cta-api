"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleByPlate = exports.getUniquePlatesWithLastVisit = exports.getTotalPlates = exports.getDelayedStats = exports.getStatsBySiteType = exports.getStatsByVehicleType = exports.getTotalDelayedVehicles = exports.getDailyCTACount = exports.getMonthlyCTACount = exports.getAllInspections = void 0;
const db_1 = require("../config/db");
const cache_1 = require("../utils/cache");
/**
 * Récupère toutes les inspections avec pagination
 * Query params: page (défaut: 1), limit (défaut: 100, max: 1000)
 */
const getAllInspections = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 100));
        const offset = (page - 1) * limit;
        // Requête optimisée avec pagination et seulement les colonnes nécessaires
        const [rows] = await db_1.pool.query(`SELECT immatriculation, typevehicule, datevisite, datevalidite, agences
       FROM vehicules
       ORDER BY datevisite DESC
       LIMIT ? OFFSET ?`, [limit, offset]);
        // Compter le total pour la pagination (avec cache possible)
        const [countResult] = await db_1.pool.query('SELECT COUNT(*) as total FROM vehicules');
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    }
    catch (err) {
        console.error('Erreur getAllInspections:', err);
        res.status(500).json({ message: 'Erreur lors du chargement des inspections', error: err });
    }
};
exports.getAllInspections = getAllInspections;
const getMonthlyCTACount = async (req, res) => {
    try {
        // Vérifier le cache (TTL de 1 minute pour les stats du mois en cours)
        const cacheKey = (0, cache_1.getCacheKey)('stats:monthly', {});
        const cachedResult = cache_1.cache.get(cacheKey);
        if (cachedResult) {
            return res.json(cachedResult);
        }
        // Utilisation d'un index sur datevisite si disponible pour de meilleures performances
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE datevisite >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
        AND datevisite < DATE_FORMAT(DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m-01')
    `);
        const result = rows[0];
        // Mettre en cache pendant 1 minute
        cache_1.cache.set(cacheKey, result, 60 * 1000);
        res.json(result);
    }
    catch (err) {
        console.error('Erreur getMonthlyCTACount:', err);
        res.status(500).json({ message: 'Erreur CTA mensuels', error: err });
    }
};
exports.getMonthlyCTACount = getMonthlyCTACount;
const getDailyCTACount = async (req, res) => {
    try {
        // Cache de 30 secondes pour les stats du jour (peuvent changer fréquemment)
        const cacheKey = (0, cache_1.getCacheKey)('stats:daily', { date: new Date().toISOString().split('T')[0] });
        const cachedResult = cache_1.cache.get(cacheKey);
        if (cachedResult) {
            return res.json(cachedResult);
        }
        // Optimisation : utiliser une comparaison de plage au lieu de DATE() pour utiliser l'index
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE datevisite >= CURDATE()
        AND datevisite < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `);
        const result = rows[0];
        // Cache pendant 30 secondes
        cache_1.cache.set(cacheKey, result, 30 * 1000);
        res.json(result);
    }
    catch (err) {
        console.error('Erreur getDailyCTACount:', err);
        res.status(500).json({ message: 'Erreur CTA journaliers', error: err });
    }
};
exports.getDailyCTACount = getDailyCTACount;
const getTotalDelayedVehicles = async (_req, res) => {
    try {
        const cacheKey = (0, cache_1.getCacheKey)('stats:total-retards', {});
        const cached = cache_1.cache.get(cacheKey);
        if (cached)
            return res.json(cached);
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT v.immatriculation, v.datevalidite
        FROM vehicules v
        INNER JOIN (
          SELECT immatriculation, MAX(datevisite) AS max_date
          FROM vehicules
          GROUP BY immatriculation
        ) last_visits
        ON v.immatriculation = last_visits.immatriculation
        AND v.datevisite = last_visits.max_date
        WHERE v.datevalidite IS NOT NULL AND v.datevalidite < CURRENT_DATE()
      ) AS subquery
    `);
        const result = rows[0];
        cache_1.cache.set(cacheKey, result, 45 * 1000); // 45s, aligné avec CTA Stat refetch
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur CTA en retard', error: err });
    }
};
exports.getTotalDelayedVehicles = getTotalDelayedVehicles;
const getStatsByVehicleType = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT typevehicule, COUNT(*) as total
      FROM vehicules
      GROUP BY typevehicule
    `);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur de stats véhicule', error: err });
    }
};
exports.getStatsByVehicleType = getStatsByVehicleType;
const getStatsBySiteType = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT agences AS site, COUNT(*) as total
      FROM vehicules
      GROUP BY agences
    `);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur de stats site', error: err });
    }
};
exports.getStatsBySiteType = getStatsBySiteType;
/**
 * Statistiques de retards optimisées - calcul en SQL au lieu de JavaScript
 * Beaucoup plus rapide pour de grandes quantités de données
 */
const getDelayedStats = async (req, res) => {
    try {
        // Calcul des retards directement en SQL pour de meilleures performances
        const [rows] = await db_1.pool.query(`
      SELECT 
        SUM(CASE 
          WHEN datevalidite IS NOT NULL 
            AND datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH) 
          THEN 1 ELSE 0 
        END) AS '24+ mois',
        SUM(CASE 
          WHEN datevalidite IS NOT NULL 
            AND datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
            AND datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 18 MONTH) 
          THEN 1 ELSE 0 
        END) AS '18 mois',
        SUM(CASE 
          WHEN datevalidite IS NOT NULL 
            AND datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 18 MONTH)
            AND datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) 
          THEN 1 ELSE 0 
        END) AS '12 mois',
        SUM(CASE 
          WHEN datevalidite IS NOT NULL 
            AND datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            AND datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) 
          THEN 1 ELSE 0 
        END) AS '6 mois',
        SUM(CASE 
          WHEN datevalidite IS NOT NULL 
            AND datevalidite >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            AND datevalidite < DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH) 
          THEN 1 ELSE 0 
        END) AS '3 mois'
      FROM vehicules
      WHERE datevalidite IS NOT NULL 
        AND datevalidite < CURRENT_DATE()
    `);
        const result = rows[0];
        res.json({
            '3 mois': Number(result['3 mois']) || 0,
            '6 mois': Number(result['6 mois']) || 0,
            '12 mois': Number(result['12 mois']) || 0,
            '18 mois': Number(result['18 mois']) || 0,
            '24+ mois': Number(result['24+ mois']) || 0,
        });
    }
    catch (err) {
        console.error('Erreur getDelayedStats:', err);
        res.status(500).json({ message: 'Erreur de stats de retard', error: err });
    }
};
exports.getDelayedStats = getDelayedStats;
const getTotalPlates = async (req, res) => {
    try {
        const cacheKey = (0, cache_1.getCacheKey)('stats:total-plates', {});
        const cached = cache_1.cache.get(cacheKey);
        if (cached)
            return res.json(cached);
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(DISTINCT immatriculation) AS total FROM vehicules
    `);
        const result = rows[0];
        cache_1.cache.set(cacheKey, result, 45 * 1000); // 45s, aligné avec CTA Stat refetch
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur lors du comptage des plaques', error: err });
    }
};
exports.getTotalPlates = getTotalPlates;
const getUniquePlatesWithLastVisit = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
       SELECT immatriculation, typevehicule, 
             MAX(datevisite) AS derniere_visite, 
             MAX(datevalidite) AS datevalidite
      FROM vehicules
      GROUP BY immatriculation, typevehicule
    `);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des derniers passages', error: err });
    }
};
exports.getUniquePlatesWithLastVisit = getUniquePlatesWithLastVisit;
// fonction
// export const getVehicleByPlate = async (req: Request, res: Response) => {
//   const { plate } = req.params;
//   try {
//     const [rows] = await pool.query(`
//       SELECT immatriculation, typevehicule, MAX(datevisite) AS derniere_visite, MAX(datevalidite) AS datevalidite
//       FROM vehicules
//       WHERE immatriculation = ?
//       GROUP BY immatriculation, typevehicule
//     `, [plate]);
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ message: 'Erreur lors de la recherche de la plaque', error: err });
//   }
// };
const getVehicleByPlate = async (req, res) => {
    const { plate } = req.params;
    try {
        const [rows] = await db_1.pool.query(`
      SELECT immatriculation, typevehicule, datevisite, datevalidite, agences
      FROM vehicules
      WHERE immatriculation = ?
      ORDER BY datevisite DESC
      LIMIT 1
    `, [plate]);
        res.json(rows); // une seule ligne, donc rows[0]
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur lors de la recherche de la plaque', error: err });
    }
};
exports.getVehicleByPlate = getVehicleByPlate;
// export const searchVehicleDetailsByPlate = async (req: Request, res: Response) => {
//   const { plate } = req.params;
// type VehicleData = {
//   immatriculation: string;
//   typevehicule: string;
//   derniere_visite: string;
//   datevalidite: string;
//   agences: string | null;
// };
//   try {
//     // On récupère la dernière ligne de visite pour cette plaque
//     const [rows] = await pool.query(
//       `
//       SELECT 
//         immatriculation, 
//         typevehicule, 
//         datevisite AS derniere_visite, 
//         datevalidite, 
//         agences
//       FROM vehicules
//       WHERE immatriculation = ?
//       ORDER BY datevisite DESC
//       LIMIT 1
//       `,
//       [plate]
//     );
//     const vehicle = (rows as VehicleData[])[0];
//     if (!vehicle) {
//       return res.status(404).json({ message: 'Aucun véhicule trouvé avec cette plaque' });
//     }
//     // On retourne directement l'objet avec les infos attendues
//     res.json(vehicle);
//   } catch (err) {
//     res.status(500).json({
//       message: 'Erreur lors de la recherche détaillée',
//       error: (err as Error).message,
//     });
//   }
// };

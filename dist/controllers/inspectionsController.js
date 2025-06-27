"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleByPlate = exports.getUniquePlatesWithLastVisit = exports.getTotalPlates = exports.getDelayedStats = exports.getStatsBySiteType = exports.getStatsByVehicleType = exports.getTotalDelayedVehicles = exports.getDailyCTACount = exports.getMonthlyCTACount = exports.getAllInspections = void 0;
const db_1 = require("../config/db");
const getAllInspections = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM vehicules');
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur lors du chargement des inspections', error: err });
    }
};
exports.getAllInspections = getAllInspections;
const getMonthlyCTACount = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE MONTH(datevisite) = MONTH(CURRENT_DATE())
        AND YEAR(datevisite) = YEAR(CURRENT_DATE())
    `);
        res.json(rows[0]);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur CTA mensuels', error: err });
    }
};
exports.getMonthlyCTACount = getMonthlyCTACount;
const getDailyCTACount = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE DATE(datevisite) = CURRENT_DATE()
    `);
        res.json(rows[0]);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur CTA journaliers', error: err });
    }
};
exports.getDailyCTACount = getDailyCTACount;
const getTotalDelayedVehicles = async (_req, res) => {
    try {
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
        res.json(rows[0]);
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
const getDelayedStats = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT immatriculation, typevehicule, datevalidite
      FROM vehicules
    `);
        const now = new Date();
        const delays = {
            '3 mois': 0,
            '6 mois': 0,
            '12 mois': 0,
            '18 mois': 0,
            '24+ mois': 0,
        };
        for (const row of rows) {
            if (!row.datevalidite)
                continue;
            const validUntil = new Date(row.datevalidite);
            const diffMonths = (now.getFullYear() - validUntil.getFullYear()) * 12 + (now.getMonth() - validUntil.getMonth());
            if (diffMonths >= 24)
                delays['24+ mois']++;
            else if (diffMonths >= 18)
                delays['18 mois']++;
            else if (diffMonths >= 12)
                delays['12 mois']++;
            else if (diffMonths >= 6)
                delays['6 mois']++;
            else if (diffMonths >= 3)
                delays['3 mois']++;
        }
        ;
        res.json(delays);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur de stats de retard', error: err });
    }
};
exports.getDelayedStats = getDelayedStats;
const getTotalPlates = async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT COUNT(DISTINCT immatriculation) AS total FROM vehicules
    `);
        const result = rows;
        res.json(result[0]);
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

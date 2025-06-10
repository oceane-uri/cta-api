// src/controllers/inspectionsController.ts
import { Request, Response } from 'express';
import {pool} from '../config/db';


export const getAllInspections = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicules');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du chargement des inspections', error: err });
  }
};

export const getMonthlyCTACount = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE MONTH(datevisite) = MONTH(CURRENT_DATE())
        AND YEAR(datevisite) = YEAR(CURRENT_DATE())
    `);
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur CTA mensuels', error: err });
  }
};

export const getDailyCTACount = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM vehicules
      WHERE DATE(datevisite) = CURRENT_DATE()
    `);
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur CTA journaliers', error: err });
  }
};

export const getTotalDelayedVehicles = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
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
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur CTA en retard', error: err });
  }
};




export const getStatsByVehicleType = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT typevehicule, COUNT(*) as total
      FROM vehicules
      GROUP BY typevehicule
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur de stats véhicule', error: err });
  }
};

export const getStatsBySiteType = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT agences AS site, COUNT(*) as total
      FROM vehicules
      GROUP BY agences
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur de stats site', error: err });
  }
};


export const getDelayedStats = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
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

    for (const row of rows as any[]) {
      if (!row.datevalidite) continue;
      const validUntil = new Date(row.datevalidite);
      const diffMonths = (now.getFullYear() - validUntil.getFullYear()) * 12 + (now.getMonth() - validUntil.getMonth());

      if (diffMonths >= 24) delays['24+ mois']++;
      else if (diffMonths >= 18) delays['18 mois']++;
      else if (diffMonths >= 12) delays['12 mois']++;
      else if (diffMonths >= 6) delays['6 mois']++;
      else if (diffMonths >= 3) delays['3 mois']++;
    };



    res.json(delays);
  } catch (err) {
    res.status(500).json({ message: 'Erreur de stats de retard', error: err });
  }
};

export const getTotalPlates = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(DISTINCT immatriculation) AS total FROM vehicules
    `);
    const result = rows as { total: number }[];
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du comptage des plaques', error: err });
  }
};

export const getUniquePlatesWithLastVisit = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
       SELECT immatriculation, typevehicule, 
             MAX(datevisite) AS derniere_visite, 
             MAX(datevalidite) AS datevalidite
      FROM vehicules
      GROUP BY immatriculation, typevehicule
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des derniers passages', error: err });
  }
};

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

export const getVehicleByPlate = async (req: Request, res: Response) => {
  const { plate } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT immatriculation, typevehicule, datevisite, datevalidite, agences
      FROM vehicules
      WHERE immatriculation = ?
      ORDER BY datevisite DESC
      LIMIT 1
    `, [plate]);

    res.json(rows); // une seule ligne, donc rows[0]
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la recherche de la plaque', error: err });
  }
};


type VehicleMeta = {
  immatriculation: string;
  typevehicule: string;
  derniere_visite: string;
  datevalidite: string;
};

type AgencyRow = {
  agences: string;
};

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








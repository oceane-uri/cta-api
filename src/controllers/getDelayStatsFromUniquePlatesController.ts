import { Request, Response } from 'express';
import {pool} from '../config/db';


type VehicleMeta = {
  immatriculation: string;
  typevehicule: string;
  derniere_visite: string;
  datevalidite: string;
};

type AgencyRow = {
  agences: string;
};

type VehicleFullData = VehicleMeta & {
  agences: string | null;
};

export const getDelayStatsFromUniquePlates = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.immatriculation, v.datevalidite
      FROM vehicules v
      INNER JOIN (
        SELECT immatriculation, MAX(datevisite) AS max_date
        FROM vehicules
        GROUP BY immatriculation
      ) last_visits
      ON v.immatriculation = last_visits.immatriculation
      AND v.datevisite = last_visits.max_date
    `);

    const now = new Date();
    const delays = {
      '3 mois': 0,
      '6 mois': 0,
      '9 mois': 0,
      '12 mois': 0,
      '18 mois': 0,
      '24+ mois': 0,
    };

    for (const row of rows as any[]) {
      if (!row.datevalidite) continue;

      const validUntil = new Date(row.datevalidite);
      if (validUntil >= now) continue; // Pas en retard

      const diffMonths =
        (now.getFullYear() - validUntil.getFullYear()) * 12 +
        (now.getMonth() - validUntil.getMonth());

      if (diffMonths >= 24) delays['24+ mois']++;
      else if (diffMonths >= 18) delays['18 mois']++;
      else if (diffMonths >= 12) delays['12 mois']++;
      else if (diffMonths >= 9) delays['9 mois']++;
      else if (diffMonths >= 6) delays['6 mois']++;
      else if (diffMonths >= 3) delays['3 mois']++;
    }

    res.json(delays);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du calcul des retards', error: err });
  }
};

export const searchVehicleByPlate = async (req: Request, res: Response) => {
  const { plate } = req.params;

  try {
    const [rows] = await pool.query(
      `
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
      `,
      [plate]
    );

    const vehicle = (rows as VehicleFullData[])[0];

    if (!vehicle) {
      return res.status(404).json({ message: 'Aucun véhicule trouvé avec cette plaque' });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({
      message: 'Erreur lors de la recherche détaillée',
      error: (err as Error).message,
    });
  }
};

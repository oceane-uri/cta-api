import { Request, Response} from 'express';
import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';

export const searchVehicleByPlate = async (req: Request, res: Response) => {
  const { plate } = req.params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT immatriculation, datevisite, datevalidite, agences
       FROM vehicules
       WHERE immatriculation = ?
       ORDER BY datevisite DESC
       LIMIT 1`,
      [plate]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Aucune visite trouvée pour cette plaque.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erreur lors de la recherche par plaque :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

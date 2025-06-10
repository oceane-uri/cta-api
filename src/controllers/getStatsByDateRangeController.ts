import { Request, Response } from 'express';
import {pool} from '../config/db';

export const getStatsByDateRange = async (req: Request, res: Response) => {
  const { startDate, endDate, agences, typevehicule } = req.query;

  let conditions: string[] = [];
  let values: any[] = [];

  if (startDate && endDate) {
    conditions.push("datevisite BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }

  if (agences) {
    conditions.push("agences = ?");
    values.push(agences);
  }

  if (typevehicule) {
    conditions.push("typevehicule = ?");
    values.push(typevehicule);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [rows] = await pool.query(`
      SELECT agences, typevehicule, COUNT(*) as total
      FROM vehicules
      ${whereClause}
      GROUP BY agences, typevehicule
    `, values);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du calcul des stats par période', error: err });
  }
};

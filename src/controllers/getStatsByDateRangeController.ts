import { Request, Response } from 'express';
import {pool} from '../config/db';
import { cache, getCacheKey } from '../utils/cache';

/**
 * Statistiques par période avec cache et optimisation des requêtes
 * Query params: startDate, endDate, agences, typevehicule
 */
export const getStatsByDateRange = async (req: Request, res: Response) => {
  const { startDate, endDate, agences, typevehicule } = req.query;

  // Générer une clé de cache basée sur les paramètres
  const cacheKey = getCacheKey('stats:dateRange', {
    startDate: startDate as string,
    endDate: endDate as string,
    agences: agences as string,
    typevehicule: typevehicule as string,
  });

  // Vérifier le cache (TTL de 2 minutes pour les stats)
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }

  let conditions: string[] = [];
  let values: any[] = [];

  // Validation et construction des conditions avec requêtes préparées pour la sécurité
  if (startDate && endDate) {
    // Valider que ce sont des dates valides
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      conditions.push("datevisite BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)");
      values.push(startDate, endDate);
    }
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
    // Requête optimisée avec index sur datevisite si disponible
    const [rows] = await pool.query(`
      SELECT agences, typevehicule, COUNT(*) as total
      FROM vehicules
      ${whereClause}
      GROUP BY agences, typevehicule
      ORDER BY total DESC
    `, values);

    // Mettre en cache le résultat pendant 2 minutes
    cache.set(cacheKey, rows, 2 * 60 * 1000);

    res.json(rows);
  } catch (err) {
    console.error('Erreur getStatsByDateRange:', err);
    res.status(500).json({ message: 'Erreur lors du calcul des stats par période', error: err });
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsByDateRange = void 0;
const db_1 = require("../config/db");
const cache_1 = require("../utils/cache");
/**
 * Statistiques par période avec cache et optimisation des requêtes
 * Query params: startDate, endDate, agences, typevehicule
 */
const getStatsByDateRange = async (req, res) => {
    const { startDate, endDate, agences, typevehicule } = req.query;
    // Générer une clé de cache basée sur les paramètres
    const cacheKey = (0, cache_1.getCacheKey)('stats:dateRange', {
        startDate: startDate,
        endDate: endDate,
        agences: agences,
        typevehicule: typevehicule,
    });
    // Vérifier le cache (TTL de 2 minutes pour les stats)
    const cachedResult = cache_1.cache.get(cacheKey);
    if (cachedResult) {
        return res.json(cachedResult);
    }
    let conditions = [];
    let values = [];
    // Validation et construction des conditions avec requêtes préparées pour la sécurité
    if (startDate && endDate) {
        // Valider que ce sont des dates valides
        const start = new Date(startDate);
        const end = new Date(endDate);
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
        const [rows] = await db_1.pool.query(`
      SELECT agences, typevehicule, COUNT(*) as total
      FROM vehicules
      ${whereClause}
      GROUP BY agences, typevehicule
      ORDER BY total DESC
    `, values);
        // Mettre en cache le résultat pendant 2 minutes
        cache_1.cache.set(cacheKey, rows, 2 * 60 * 1000);
        res.json(rows);
    }
    catch (err) {
        console.error('Erreur getStatsByDateRange:', err);
        res.status(500).json({ message: 'Erreur lors du calcul des stats par période', error: err });
    }
};
exports.getStatsByDateRange = getStatsByDateRange;

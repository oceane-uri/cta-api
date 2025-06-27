"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsByDateRange = void 0;
const db_1 = require("../config/db");
const getStatsByDateRange = async (req, res) => {
    const { startDate, endDate, agences, typevehicule } = req.query;
    let conditions = [];
    let values = [];
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
        const [rows] = await db_1.pool.query(`
      SELECT agences, typevehicule, COUNT(*) as total
      FROM vehicules
      ${whereClause}
      GROUP BY agences, typevehicule
    `, values);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Erreur lors du calcul des stats par période', error: err });
    }
};
exports.getStatsByDateRange = getStatsByDateRange;

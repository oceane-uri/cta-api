"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVehicleByPlate = void 0;
const db_1 = require("../config/db");
const searchVehicleByPlate = async (req, res) => {
    const { plate } = req.params;
    try {
        const [rows] = await db_1.pool.query(`SELECT immatriculation, datevisite, datevalidite, agences
       FROM vehicules
       WHERE immatriculation = ?
       ORDER BY datevisite DESC
       LIMIT 1`, [plate]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Aucune visite trouvée pour cette plaque.' });
        }
        return res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Erreur lors de la recherche par plaque :', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.searchVehicleByPlate = searchVehicleByPlate;

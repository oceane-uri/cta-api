"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const stats_1 = __importDefault(require("./routes/stats"));
const db_1 = require("./config/db");
const inspections_1 = __importDefault(require("./routes/inspections"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/stats', stats_1.default);
app.use('/api/inspections', inspections_1.default);
app.get('/', (_req, res) => {
    res.send('Bienvenue sur l’API des contrôles techniques');
});
app.get('/test-db', async (_req, res) => {
    try {
        const [rows] = await db_1.pool.query('SELECT NOW() as now');
        res.json({ success: true, now: rows });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erreur de connexion à la base' });
    }
});
app.listen(port, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
});
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});
// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true,
// }));
// app.options('*', cors()); // pour répondre aux OPTIONS

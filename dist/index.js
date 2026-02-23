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
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Autoriser les appels depuis n'importe quelle origine
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Santé de l'API (sans DB ni JWT)
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'cta-api' });
});
app.use('/api/auth', auth_1.default);
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
// 404
app.use((_req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});
// Gestionnaire d'erreurs global (CORS sur les réponses d'erreur pour que le front puisse les lire)
app.use((err, req, res, _next) => {
    console.error('Erreur non gérée:', err);
    if (!res.headersSent) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.status(500).json({ message: 'Erreur serveur', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});
app.listen(port, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
    console.log(`   → Dans Plesk, l'URL de l'application doit être : http://127.0.0.1:${port}`);
});

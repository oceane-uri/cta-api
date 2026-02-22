"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const stats_1 = __importDefault(require("./routes/stats"));
const db_1 = require("./config/db");
const inspections_1 = __importDefault(require("./routes/inspections"));
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Répondre explicitement aux requêtes OPTIONS (preflight) avec CORS pour éviter 500 sans en-têtes
app.use('*', (req, res, next) => {
    const origin = req.headers.origin;
    const allowOrigin = origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (origin) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express_1.default.json());
// Santé de l'API (sans DB ni JWT) — pour tester si Node répond et si CORS est présent
const healthResponse = (_req, res) => {
    res.json({ ok: true, service: 'cta-api' });
};
app.get('/api/health', healthResponse);
app.get('/api/health/', healthResponse);
// Au cas où le proxy transmet le chemin sans le préfixe /api
app.get('/health', healthResponse);
app.get('/health/', healthResponse);
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
// Gestionnaire d'erreurs global : toujours ajouter CORS pour que le navigateur ne bloque pas la réponse 5xx
app.use((err, req, res, _next) => {
    console.error('Erreur non gérée:', err);
    if (!res.headersSent) {
        const origin = req.headers.origin;
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.status(500).json({ message: 'Erreur serveur', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});
app.listen(port, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
    console.log(`   → Dans Plesk, l'URL de l'application doit être : http://127.0.0.1:${port}`);
});

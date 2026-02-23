import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRoutes from './routes/stats';
import { pool } from './config/db';
import inspectionsRoutes from './routes/inspections';
import authRoutes from './routes/auth';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Autoriser les appels depuis n'importe quelle origine
app.use(cors());
app.use(express.json());

// Santé de l'API (sans DB ni JWT)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cta-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.get('/', (_req, res) => {
  res.send('Bienvenue sur l’API des contrôles techniques');
});


app.get('/test-db', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as now');
    res.json({ success: true, now: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Erreur de connexion à la base' });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global (CORS sur les réponses d'erreur pour que le front puisse les lire)
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

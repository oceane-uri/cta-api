import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRoutes from './routes/stats';
import { pool } from './config/db';
import inspectionsRoutes from './routes/inspections';


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

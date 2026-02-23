/**
 * Point d'entrée serverless Vercel pour cta-api.
 * Toutes les requêtes sont transmises à l'app Express.
 */
const path = require('path');

let app;
try {
  // Vercel : racine = process.cwd() ; fallback __dirname (api/ → parent = racine)
  const root = process.cwd() || path.join(__dirname, '..');
  const distPath = path.join(root, 'dist', 'index');
  const mod = require(distPath);
  app = mod.app;
  if (!app) {
    throw new Error('Module dist/index ne contient pas "app". Exports: ' + Object.keys(mod || {}).join(', '));
  }
} catch (e) {
  console.error('Erreur chargement app cta-api:', e.message || e);
  app = null;
}

module.exports = (req, res) => {
  if (!app) {
    res.status(500).json({
      message: 'Erreur au chargement de l’application. Vérifier les logs Vercel (Runtime Logs) et les variables d’environnement.',
    });
    return;
  }
  app(req, res);
};

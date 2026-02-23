/**
 * Point d'entrée serverless Vercel pour cta-api.
 * Toutes les requêtes sont transmises à l'app Express.
 */
const path = require('path');
const { app } = require(path.join(__dirname, '..', 'dist', 'index'));

module.exports = (req, res) => app(req, res);

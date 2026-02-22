#!/usr/bin/env node
/**
 * Prépare un dossier de déploiement pour Plesk (sans generate-hash.js).
 * Contenu : dist/, package.json, package-lock.json
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'deploy-output');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('Build...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

console.log('Copie dist/, package.json, package-lock.json vers deploy-output/');
copyRecursive(path.join(root, 'dist'), path.join(outDir, 'dist'));
fs.copyFileSync(path.join(root, 'package.json'), path.join(outDir, 'package.json'));
if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(outDir, 'package-lock.json'));
}

console.log('Déploiement prêt dans deploy-output/ (generate-hash.js non inclus).');
console.log('Sur Plesk : uploader ce dossier puis exécuter npm install --production && npm start');

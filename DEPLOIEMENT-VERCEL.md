# Déployer cta-api sur Vercel

## Prérequis

- Compte [Vercel](https://vercel.com)
- Projet cta-api sous Git (GitHub, GitLab ou Bitbucket)

## 1. Variables d'environnement

Sur Vercel, va dans **Project Settings → Environment Variables** et ajoute :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `JWT_SECRET` | *(ta clé secrète ≥ 16 caractères)* | Production, Preview |
| `DB_HOST` | *(ex. 137.255.9.45)* | Production, Preview |
| `DB_PORT` | *(ex. 13306)* | Production, Preview |
| `DB_USER` | *(ex. root)* | Production, Preview |
| `DB_PASSWORD` | *(ton mot de passe)* | Production, Preview |
| `DB_NAME` | *(ex. cnsrtest)* | Production, Preview |

**Important :** La base MySQL doit être **accessible depuis Internet** (Vercel tourne dans le cloud). Si ta base est sur un serveur privé (IP locale ou pare-feu), il faudra un tunnel ou une base hébergée (ex. PlanetScale, Railway, etc.).

## 2. Déploiement depuis le tableau de bord Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi.
2. **Add New… → Project**.
3. **Import** le dépôt Git qui contient **cta-api** (si tu as un monorepo, indique le **Root Directory** : `cta-api`).
4. Vercel détecte automatiquement :
   - **Build Command :** `npm run build` (défini dans `vercel.json`)
   - **Output Directory :** non utilisé (on utilise une fonction serverless)
5. Ajoute les variables d'environnement (étape 1).
6. Clique sur **Deploy**.

## 3. Déploiement depuis la CLI

```bash
cd cta-api
npm i -g vercel
vercel login
vercel
```

Réponds aux questions (lien au projet existant ou nouveau projet). Pense à configurer les variables d'environnement dans le dashboard ou avec `vercel env add`.

## 4. Après le déploiement

- L’API sera accessible à une URL du type :  
  **https://cta-api-xxx.vercel.app** (ou ton domaine personnalisé).
- À tester :
  - **https://ton-projet.vercel.app/** → « Bienvenue sur l’API des contrôles techniques »
  - **https://ton-projet.vercel.app/api/health** → `{"ok":true,"service":"cta-api"}`

## 5. Mettre à jour le frontend (CTA stat / web)

Remplace l’URL de l’API par l’URL Vercel, par ex. :

- Avant : `https://api.cnsr.bj`
- Après : `https://cta-api-xxx.vercel.app`

(ou ton domaine personnalisé Vercel pour l’API.)

## 6. Domaine personnalisé (optionnel)

Dans Vercel : **Project → Settings → Domains** → ajoute par ex. **api.cnsr.bj** et configure les enregistrements DNS comme indiqué par Vercel.

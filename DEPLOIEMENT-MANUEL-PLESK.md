# Déploiement manuel de cta-api sur Plesk (api.cnsr.bj)

Guide pour supprimer le sous-domaine, le recréer et déployer l’API à la main.

---

## Étape 1 : Préparer le build en local

Sur ta machine, dans le dossier du projet :

```bash
cd cta-api
npm run build
npm run prepare-deploy
```

Tu obtiens le dossier **`deploy-output/`** avec :
- `dist/` (API compilée)
- `package.json`
- `package-lock.json`

*(Pas de `node_modules` : ils seront installés sur le serveur.)*

---

## Étape 2 : Supprimer le sous-domaine dans Plesk

1. **Hébergement et domaines** → domaine **cnsr.bj**
2. Trouve le **sous-domaine** **api.cnsr.bj**
3. **Supprimer** le sous-domaine (ou le désactiver si tu préfères le réutiliser plus tard)
4. Confirmer la suppression

---

## Étape 3 : Recréer le sous-domaine

1. Toujours sur **cnsr.bj** → **Ajouter un sous-domaine** (ou **Sous-domaines** → **Créer**)
2. **Nom du sous-domaine** : `api`
3. **Racine du document** : par ex. `api.cnsr.bj` (ou la valeur par défaut proposée)
4. Créer le sous-domaine

---

## Étape 4 : Activer Node.js sur le sous-domaine

1. Clique sur le sous-domaine **api.cnsr.bj**
2. Ouvre la section **Node.js** (menu de gauche ou onglet)
3. **Activer** l’application Node.js pour ce sous-domaine
4. Renseigner :

| Paramètre | Valeur |
|-----------|--------|
| **Version de Node.js** | 24 |
| **Racine du document** | `/api.cnsr.bj` (ou le chemin du sous-domaine) |
| **Root d’application** | `/api.cnsr.bj` (même dossier) |
| **Fichier de démarrage** | `dist/index.js` |
| **Mode d’application** | Production |
| **URL de l’application** | `http://127.0.0.1:3000` |

5. **Variables d’environnement** (à définir tout de suite ou après l’upload) :

| Nom | Valeur |
|-----|--------|
| `PORT` | `3000` |
| `JWT_SECRET` | *(ta clé secrète ≥ 16 caractères)* |
| `DB_HOST` | *(ex. 137.255.9.45)* |
| `DB_PORT` | *(ex. 13306)* |
| `DB_USER` | *(ex. root)* |
| `DB_PASSWORD` | *(ton mot de passe)* |
| `DB_NAME` | *(ex. cnsrtest)* |

Enregistre. Ne lance pas encore l’app (tu n’as pas encore uploadé les fichiers).

---

## Étape 5 : Déploiement manuel des fichiers

1. Dans Plesk, ouvre **Fichiers** (ou **Gestionnaire de fichiers**) pour le sous-domaine **api.cnsr.bj**.
2. Va dans la **racine du document** du sous-domaine (ex. `api.cnsr.bj`).
3. **Upload** du contenu de **`deploy-output/`** :
   - Envoie tout le **contenu** de `deploy-output/` (dossier `dist/` + `package.json` + `package-lock.json`) dans ce répertoire.
   - À la fin tu dois avoir au même niveau : `dist/`, `package.json`, `package-lock.json`.
4. **Installer les dépendances** : dans la section Node.js du sous-domaine, utilise la commande d’installation (ex. **Exécuter npm install** ou **npm install --production**).  
   Si Plesk propose un champ « Commande de déploiement » ou « Script d’installation », mets :  
   `npm install --production`  
   Puis exécute-la. Sinon, il faut que `node_modules` soit présent (en les uploadant ou en ayant une autre façon de lancer `npm install` sur le serveur).
5. Vérifier la structure :

   ```
   api.cnsr.bj/
   ├── dist/
   │   ├── index.js
   │   ├── config/
   │   ├── controllers/
   │   ├── ...
   ├── node_modules/   (après npm install)
   ├── package.json
   └── package-lock.json
   ```

---

## Étape 6 : Démarrer l’application

1. Section **Node.js** du sous-domaine **api.cnsr.bj**
2. Vérifier une dernière fois :
   - **URL de l’application** = `http://127.0.0.1:3000`
   - **PORT** = `3000` dans les variables d’environnement
   - **Fichier de démarrage** = `dist/index.js`
3. **Démarrer** (ou **Redémarrer**) l’application
4. Regarder les **journaux** Node : tu dois voir quelque chose comme  
   `Serveur lancé sur http://localhost:3000`

---

## Étape 7 : Tester

- **https://api.cnsr.bj/** → « Bienvenue sur l’API des contrôles techniques »
- **https://api.cnsr.bj/api/health** → `{"ok":true,"service":"cta-api"}`
- Connexion depuis ton application (login) → plus d’erreur CORS si tout est correct

---

## En cas de problème

- **500 ou « Something went wrong »** : l’app Node ne répond pas. Vérifier les logs Node, que **URL de l’application** = `http://127.0.0.1:3000` et que **PORT=3000** est bien défini.
- **CORS manquant** : en général la réponse ne vient pas de Node (proxy qui renvoie une erreur). Corriger d’abord la 500 comme ci-dessus.
- **Erreur au démarrage** (module introuvable, etc.) : vérifier que `npm install --production` a bien été exécuté dans le dossier contenant `package.json` et que `dist/index.js` existe.

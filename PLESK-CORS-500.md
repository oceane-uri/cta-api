# Plesk : erreur 500 et CORS « Access-Control-Allow-Origin manquant »

Si tu vois **500** sur `https://api.cnsr.bj/` ou **CORS manquant** sur le login, c’est en général que **le proxy Plesk ne parle pas à ton app Node** (ou que l’app ne démarre pas).

---

## 1. Vérifier que l’app écoute sur un port

L’API démarre sur le port donné par la variable **PORT**, ou **3000** par défaut.

- Soit tu **fixes le port** : dans Plesk, variable d’environnement **PORT** = **3000**.
- Soit tu regardes dans les **journaux Node** (section Node.js → Logs) au démarrage : tu dois voir une ligne du type  
  `Serveur lancé sur http://localhost:3000`  
  (ou un autre numéro). Note ce **port**.

---

## 2. URL de l’application dans Plesk

Le proxy doit envoyer les requêtes **vers ce port**, pas vers le domaine.

- Dans **Node.js** → **URL de l’application**, mets exactement :
  - **`http://127.0.0.1:3000`**  
  si tu as mis **PORT=3000**, ou
  - **`http://127.0.0.1:XXXX`**  
  avec **XXXX** = le port affiché dans les logs au démarrage.

- **À ne pas mettre** : `http://api.cnsr.bj` (ça ne pointe pas vers le processus Node).

Enregistre, puis **redémarre** l’application Node.

---

## 3. Vérifier que l’app démarre vraiment

- Regarde les **logs** de l’application Node dans Plesk.
- Au démarrage, tu dois voir :  
  `Serveur lancé sur http://localhost:XXXX`  
  et éventuellement la ligne avec `127.0.0.1:XXXX`.
- Si tu vois une **erreur** (stack trace, « Cannot find module », etc.), l’app plante avant d’écouter → la 500 et le CORS manquant viennent de là. Corrige l’erreur (dépendances, variables d’env, chemin `dist/index.js`).

---

## 4. Résumé

| Problème | Cause probable | Action |
|----------|----------------|--------|
| GET `/` ou `/api/health` → 500 | Proxy ne joint pas Node ou Node ne démarre pas | Définir **PORT** (ex. 3000), mettre **URL de l’application** = `http://127.0.0.1:3000`, vérifier les logs de démarrage |
| CORS manquant sur OPTIONS / login | Réponse 500 envoyée par le proxy (pas par Node) | Même correction : que le proxy cible bien `http://127.0.0.1:PORT` et que l’app démarre sans erreur |

Une fois le proxy correctement réglé sur `http://127.0.0.1:PORT` et l’app qui tourne, les réponses (y compris CORS) viendront de ton API et l’erreur 500 / CORS disparaîtront.

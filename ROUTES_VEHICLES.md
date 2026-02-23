# 🚗 Routes de mise à jour des types de véhicules

## 📋 Routes disponibles

### 1. Mise à jour d'un seul véhicule

**Endpoint:** `PATCH /api/inspections/vehicles/type`

**Authentification:** Requis (Bearer Token)

**Body:**
```json
{
  "id": 2195135,
  "immatriculation": "BR4265RB",
  "oldType": "CTVL",
  "newType": "CTPL"
}
```

**Réponse (succès):**
```json
{
  "message": "Type de véhicule mis à jour avec succès",
  "updated": {
    "id": 2195135,
    "immatriculation": "BR4265RB",
    "oldType": "CTVL",
    "newType": "CTPL"
  },
  "vehicle": {
    "id": 2195135,
    "immatriculation": "BR4265RB",
    "typevehicule": "CTPL",
    "datevisite": "2024-01-15",
    "datevalidite": "2025-01-15",
    "agences": "Cotonou"
  }
}
```

**Réponse (erreur - véhicule non trouvé):**
```json
{
  "message": "Véhicule non trouvé avec les critères spécifiés",
  "criteria": {
    "id": 2195135,
    "immatriculation": "BR4265RB",
    "typevehicule": "CTVL"
  }
}
```

---

### 2. Mise à jour en lot (batch)

**Endpoint:** `PATCH /api/inspections/vehicles/type/batch`

**Authentification:** Requis (Bearer Token)

**Body:**
```json
{
  "updates": [
    {
      "id": 2195135,
      "immatriculation": "BR4265RB",
      "oldType": "CTVL",
      "newType": "CTPL"
    },
    {
      "id": 2195136,
      "immatriculation": "BR4266RB",
      "oldType": "CTVL",
      "newType": "CTPL"
    }
  ]
}
```

**Réponse (succès partiel):**
```json
{
  "message": "2 mise(s) à jour réussie(s), 0 erreur(s)",
  "results": [
    {
      "id": 2195135,
      "immatriculation": "BR4265RB",
      "oldType": "CTVL",
      "newType": "CTPL",
      "success": true
    },
    {
      "id": 2195136,
      "immatriculation": "BR4266RB",
      "oldType": "CTVL",
      "newType": "CTPL",
      "success": true
    }
  ]
}
```

**Limite:** Maximum 100 mises à jour par requête

---

## 🔒 Authentification

Toutes les routes nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token_jwt>
```

Pour obtenir un token, utilisez la route de connexion :
```
POST /api/auth/login
```

---

## ✅ Validations

### Champs requis :
- `id` : Identifiant numérique du véhicule
- `immatriculation` : Plaque d'immatriculation
- `oldType` : Type de véhicule actuel (doit correspondre à la base)
- `newType` : Nouveau type de véhicule à assigner

### Validations effectuées :
1. Vérification que tous les champs requis sont présents
2. Vérification que le véhicule existe avec les critères `id`, `immatriculation` et `oldType`
3. Vérification que `oldType` correspond bien au type actuel dans la base
4. Mise à jour uniquement si toutes les conditions sont remplies

---

## 📝 Exemple d'utilisation avec cURL

### Mise à jour d'un véhicule :
```bash
curl -X PATCH http://localhost:3000/api/inspections/vehicles/type \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer votre_token_jwt" \
  -d '{
    "id": 2195135,
    "immatriculation": "BR4265RB",
    "oldType": "CTVL",
    "newType": "CTPL"
  }'
```

### Mise à jour en lot :
```bash
curl -X PATCH http://localhost:3000/api/inspections/vehicles/type/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer votre_token_jwt" \
  -d '{
    "updates": [
      {
        "id": 2195135,
        "immatriculation": "BR4265RB",
        "oldType": "CTVL",
        "newType": "CTPL"
      }
    ]
  }'
```

---

## 📝 Exemple d'utilisation avec JavaScript (fetch)

```javascript
// Mise à jour d'un véhicule
const updateVehicleType = async (token, vehicleData) => {
  const response = await fetch('http://localhost:3000/api/inspections/vehicles/type', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: vehicleData.id,
      immatriculation: vehicleData.immatriculation,
      oldType: vehicleData.oldType,
      newType: vehicleData.newType
    })
  });

  const result = await response.json();
  return result;
};

// Utilisation
const token = 'votre_token_jwt';
const vehicleData = {
  id: 2195135,
  immatriculation: 'BR4265RB',
  oldType: 'CTVL',
  newType: 'CTPL'
};

updateVehicleType(token, vehicleData)
  .then(result => console.log('Succès:', result))
  .catch(error => console.error('Erreur:', error));
```

---

## ⚠️ Notes importantes

1. **Sécurité** : La vérification de `oldType` garantit qu'on ne met pas à jour un véhicule qui a déjà été modifié ailleurs
2. **Transaction** : Les mises à jour en lot utilisent une transaction SQL pour garantir la cohérence
3. **Limites** : Maximum 100 mises à jour par requête batch pour éviter les surcharges
4. **Logging** : Toutes les erreurs sont loggées dans la console serveur

---

## 🔍 Codes de réponse HTTP

- `200 OK` : Mise à jour réussie
- `400 Bad Request` : Champs manquants ou invalides
- `401 Unauthorized` : Token manquant ou invalide
- `404 Not Found` : Véhicule non trouvé avec les critères spécifiés
- `500 Internal Server Error` : Erreur serveur










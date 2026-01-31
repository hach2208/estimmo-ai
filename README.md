# 🏠 EstimImmo AI

**Application mobile d'estimation immobilière automatisée par Intelligence Artificielle**

EstimImmo AI permet d'estimer la valeur d'un bien immobilier en prenant simplement une photo. L'application combine vision par ordinateur, données cadastrales officielles, transactions DVF et performances énergétiques DPE pour produire une estimation précise avec intervalle de confiance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-yellow)
![React Native](https://img.shields.io/badge/react--native-0.73-61dafb)

---

## 📱 Fonctionnalités

### Estimation Instantanée
- 📸 **Prise de photo** du bien immobilier
- 📍 **Géolocalisation automatique** via GPS
- 🤖 **Analyse par IA** de l'état et du type de bien
- 💰 **Estimation de prix** avec fourchette de confiance

### Sources de Données Officielles
- 🗺️ **Cadastre** (APICarto IGN) - Surface, parcelle, informations légales
- 📊 **DVF** (Etalab) - Transactions immobilières récentes
- 🌿 **DPE** (ADEME) - Performance énergétique

### Mode Expert
- ✏️ Saisie manuelle de données connues
- 📸 Multi-photos pour affiner l'analyse
- 📄 Génération de rapport PDF professionnel

---

## 🏗️ Architecture

```
estimmo-ai/
├── backend/                    # API FastAPI Python
│   ├── main.py                # Point d'entrée API
│   ├── services/
│   │   ├── cadastre.py        # Service données cadastrales
│   │   ├── dvf.py             # Service valeurs foncières
│   │   ├── dpe.py             # Service performance énergétique
│   │   ├── vision.py          # Analyse d'image IA
│   │   ├── estimation.py      # Moteur de calcul
│   │   └── pdf_report.py      # Génération PDF
│   └── requirements.txt
│
├── frontend/                   # Application React Native/Expo
│   ├── App.js                 # Point d'entrée
│   ├── src/
│   │   ├── screens/           # Écrans de l'app
│   │   │   ├── HomeScreen.js
│   │   │   ├── CameraScreen.js
│   │   │   ├── EstimationScreen.js
│   │   │   ├── HistoryScreen.js
│   │   │   └── SettingsScreen.js
│   │   └── services/
│   │       └── api.js         # Communication API
│   ├── app.json
│   └── package.json
│
└── docs/                       # Documentation
```

---

## 🚀 Installation

### Prérequis

- Python 3.11+
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (pour émulation)

### Backend

```bash
# Cloner le projet
cd estimmo-ai/backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible sur `http://localhost:8000`

Documentation Swagger: `http://localhost:8000/docs`

### Frontend

```bash
cd estimmo-ai/frontend

# Installer les dépendances
npm install

# Configurer l'URL de l'API
# Éditer app.json > extra > apiUrl

# Lancer l'application
npx expo start
```

Scannez le QR code avec l'app Expo Go (Android/iOS)

---

## 📖 Utilisation de l'API

### Endpoint Principal: `/estimate`

```bash
curl -X POST "http://localhost:8000/estimate?latitude=48.8566&longitude=2.3522" \
  -H "accept: application/json" \
  -F "file=@photo_maison.jpg"
```

**Réponse:**
```json
{
  "surface_terrain": 450,
  "surface_habitable_estimee": 120,
  "prix_m2_secteur": 3500,
  "prix_m2_ajuste": 3675,
  "prix_total_estime": 441000,
  "prix_bas": 397000,
  "prix_haut": 485000,
  "confiance": 72,
  "qualite_donnees": "Bonne",
  "cadastre": {...},
  "dvf": {...},
  "dpe": {...},
  "vision": {...}
}
```

### Autres Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/estimate/multi` | POST | Estimation multi-photos |
| `/cadastre` | GET | Données cadastrales seules |
| `/dvf` | GET | Statistiques DVF du secteur |
| `/report/pdf` | POST | Génération rapport PDF |
| `/health` | GET | État de l'API |

---

## 🧠 Algorithme d'Estimation

Le moteur d'estimation fusionne plusieurs sources de données avec des coefficients pondérés:

### 1. Prix de Base (DVF)
```
prix_m2_base = médiane(transactions_secteur_12_mois)
```

### 2. Coefficients d'Ajustement

| Facteur | Plage | Source |
|---------|-------|--------|
| État du bien | 0.55 - 1.15 | Vision IA |
| Classe DPE | 0.82 - 1.08 | ADEME |
| Nombre d'étages | 1.00 - 1.05 | Vision IA |
| Saisonnalité | 0.98 - 1.03 | Calendrier |

### 3. Calcul Final
```
prix_m2_ajusté = prix_m2_base × coef_état × coef_dpe × coef_étages × coef_saison
prix_total = surface_habitable × prix_m2_ajusté
```

### 4. Intervalle de Confiance
```
marge = f(nb_transactions, confiance_vision, disponibilité_dpe)
prix_bas = prix_total × (1 - marge)
prix_haut = prix_total × (1 + marge)
```

---

## 👁️ Vision par Ordinateur

L'analyse d'image utilise deux modes:

### Mode Heuristique (par défaut)
- Analyse des couleurs dominantes
- Détection de texture (gradient)
- Comptage de lignes horizontales (étages)
- Score de confiance basé sur la qualité d'image

### Mode ML (production)
- YOLOv8 fine-tuné sur dataset immobilier
- Classification: maison/appartement/immeuble/terrain
- Détection d'état: neuf/bon/travaux
- Estimation de surface visible

Pour activer le mode ML:
```python
vision_analyzer = VisionAnalyzer(use_ml_model=True)
```

---

## 📊 Sources de Données

### Cadastre - APICarto IGN
- URL: `https://apicarto.ign.fr/api/cadastre/parcelle`
- Données: Parcelle, section, surface fiscale, commune

### DVF - Demandes de Valeurs Foncières
- URL: `https://api.cquest.org/dvf` (communautaire)
- Données: Transactions immobilières, prix, surfaces

### DPE - ADEME
- URL: `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants`
- Données: Classe énergie, GES, consommation

---

## 🐳 Déploiement Docker

```bash
# Construire l'image
docker build -t estimmo-ai-backend ./backend

# Lancer le container
docker run -d -p 8000:8000 estimmo-ai-backend
```

---

## 🔒 Limitations & Avertissements

⚠️ **Cette application fournit des estimations indicatives uniquement.**

- Les données cadastrales peuvent être incomplètes
- Les transactions DVF ont un délai de publication (6 mois)
- L'analyse visuelle ne remplace pas une expertise sur place
- Les DPE estimés peuvent différer du DPE réel

**Pour une évaluation certifiée, consultez un expert immobilier agréé.**

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📧 Contact

Pour toute question : support@estimmo.ai

---

*Développé avec ❤️ en utilisant les données ouvertes françaises*

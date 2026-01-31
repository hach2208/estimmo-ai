# 🏠 EstimImmo AI - Guide d'Installation macOS

## Problème rencontré
Tu étais dans le mauvais dossier. L'archive doit être extraite correctement.

---

## Installation Étape par Étape

### 1. Extraire l'archive correctement

```bash
# Aller dans le dossier où tu as téléchargé l'archive
cd ~/Downloads

# Extraire (si pas déjà fait)
unzip estimmo-ai-complete.zip

# Aller dans le projet
cd estimmo-ai
```

### 2. Installer le Backend (Python)

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel
python3 -m venv venv

# Activer l'environnement
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

**Le serveur sera accessible sur:** http://localhost:8000/docs

### 3. Installer le Frontend (dans un NOUVEAU terminal)

```bash
# Aller dans le dossier frontend
cd ~/Downloads/estimmo-ai/frontend

# Installer les dépendances npm
npm install

# Lancer Expo
npx expo start
```

---

## Commandes Rapides (Copier-Coller)

### Terminal 1 - Backend
```bash
cd ~/Downloads/estimmo-ai/backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd ~/Downloads/estimmo-ai/frontend && npm install && npx expo start
```

---

## Tester l'API sans le frontend

Une fois le backend lancé, ouvre ton navigateur sur:
- http://localhost:8000 → Page d'accueil
- http://localhost:8000/docs → Documentation Swagger interactive
- http://localhost:8000/health → Statut de l'API

### Test avec curl

```bash
# Test santé
curl http://localhost:8000/health

# Test cadastre (coordonnées de Paris)
curl "http://localhost:8000/cadastre?latitude=48.8566&longitude=2.3522"

# Test DVF
curl "http://localhost:8000/dvf?latitude=48.8566&longitude=2.3522&radius=500"
```

---

## Structure des dossiers attendue

```
~/Downloads/estimmo-ai/
├── backend/
│   ├── main.py              ← Point d'entrée API
│   ├── requirements.txt     ← Dépendances Python
│   ├── services/
│   │   ├── cadastre.py
│   │   ├── dvf.py
│   │   ├── dpe.py
│   │   ├── vision.py
│   │   ├── estimation.py
│   │   └── pdf_report.py
│   └── venv/                ← Créé après install
│
├── frontend/
│   ├── App.js
│   ├── package.json
│   ├── app.json
│   ├── src/
│   │   ├── screens/
│   │   └── services/
│   └── node_modules/        ← Créé après npm install
│
├── README.md
├── docker-compose.yml
└── demo.jsx
```

---

## Dépannage

### "zsh: command not found: uvicorn"
→ L'environnement virtuel n'est pas activé
```bash
source venv/bin/activate
```

### "No such file or directory: requirements.txt"
→ Tu n'es pas dans le bon dossier
```bash
cd ~/Downloads/estimmo-ai/backend
ls  # Vérifie que requirements.txt est visible
```

### "Cannot determine Expo SDK version"
→ Les dépendances npm ne sont pas installées
```bash
cd ~/Downloads/estimmo-ai/frontend
npm install
```

### Le serveur ne démarre pas
→ Vérifie que le port 8000 n'est pas déjà utilisé
```bash
lsof -i :8000
# Si quelque chose tourne, tue-le ou change le port:
uvicorn main:app --reload --port 8001
```

---

## Contact

Si ça ne marche toujours pas, copie-colle l'erreur exacte et je t'aide !

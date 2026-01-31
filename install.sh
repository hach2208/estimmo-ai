#!/bin/bash

# ============================================
# EstimImmo AI - Script d'installation
# Compatible macOS / Linux
# ============================================

set -e

echo "🏠 Installation d'EstimImmo AI..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier Python
echo -e "${BLUE}[1/5] Vérification de Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ $PYTHON_VERSION trouvé${NC}"
else
    echo "❌ Python 3 n'est pas installé. Installez-le avec: brew install python3"
    exit 1
fi

# Vérifier Node.js
echo -e "${BLUE}[2/5] Vérification de Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION trouvé${NC}"
else
    echo "❌ Node.js n'est pas installé. Installez-le avec: brew install node"
    exit 1
fi

# Créer l'environnement virtuel Python
echo ""
echo -e "${BLUE}[3/5] Configuration du backend Python...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Création de l'environnement virtuel..."
    python3 -m venv venv
fi

echo "Activation de l'environnement virtuel..."
source venv/bin/activate

echo "Installation des dépendances Python..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend configuré${NC}"

# Revenir à la racine
cd ..

# Installer les dépendances frontend
echo ""
echo -e "${BLUE}[4/5] Configuration du frontend React Native...${NC}"
cd frontend

echo "Installation des dépendances npm..."
npm install

echo -e "${GREEN}✓ Frontend configuré${NC}"

cd ..

# Créer les scripts de lancement
echo ""
echo -e "${BLUE}[5/5] Création des scripts de lancement...${NC}"

# Script pour lancer le backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "🚀 Démarrage du serveur backend sur http://localhost:8000"
echo "📚 Documentation API: http://localhost:8000/docs"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF
chmod +x start-backend.sh

# Script pour lancer le frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "📱 Démarrage de l'application mobile Expo..."
npx expo start
EOF
chmod +x start-frontend.sh

# Script pour tout lancer
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🏠 Lancement d'EstimImmo AI..."
echo ""

# Lancer le backend en arrière-plan
cd "$(dirname "$0")"
./start-backend.sh &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Lancer le frontend
./start-frontend.sh

# Cleanup
kill $BACKEND_PID 2>/dev/null
EOF
chmod +x start-all.sh

echo -e "${GREEN}✓ Scripts créés${NC}"

# Résumé
echo ""
echo "============================================"
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo "============================================"
echo ""
echo "Pour démarrer l'application:"
echo ""
echo -e "  ${YELLOW}Option 1: Backend seul${NC}"
echo "  ./start-backend.sh"
echo ""
echo -e "  ${YELLOW}Option 2: Frontend seul${NC}"
echo "  ./start-frontend.sh"
echo ""
echo -e "  ${YELLOW}Option 3: Tout ensemble${NC}"
echo "  ./start-all.sh"
echo ""
echo "============================================"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "📱 App Mobile: Scannez le QR code avec Expo Go"
echo "============================================"

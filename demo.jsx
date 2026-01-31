import React, { useState } from 'react';
import { Camera, MapPin, Home, TrendingUp, Leaf, FileText, ChevronRight, Clock, Settings, Share2, Download, AlertTriangle, CheckCircle } from 'lucide-react';

// Thème
const COLORS = {
  primary: '#1E3A5F',
  primaryLight: '#2D5478',
  secondary: '#4A90A4',
  accent: '#E8B923',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E0E0E0',
};

const DPE_COLORS = {
  A: '#319834', B: '#33CC31', C: '#CBFC34',
  D: '#FCFC32', E: '#FCCC00', F: '#FC9900', G: '#FC0000',
};

// Données de démo
const mockEstimation = {
  prix_total: 441000,
  prix_bas: 397000,
  prix_haut: 485000,
  surface_terrain: 450,
  surface_habitable: 120,
  prix_m2_secteur: 3500,
  prix_m2_ajuste: 3675,
  confiance: 72,
  qualite: 'Bonne',
  cadastre: { commune: 'Bordeaux', parcelle: 'AB-0123' },
  dpe: { classe: 'D', ges: 'E' },
  vision: { type: 'Maison', etat: 'Bon état', etages: 2 },
  dvf: { transactions: 15, periode: '12 mois' },
};

export default function EstimImmoDemo() {
  const [screen, setScreen] = useState('home');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const simulateEstimation = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen('result');
    }, 2000);
  };

  // Écran de chargement
  if (loading) {
    return (
      <PhoneFrame>
        <div className="flex flex-col items-center justify-center h-full" 
             style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})` }}>
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-6" />
          <h2 className="text-white text-xl font-bold mb-2">Analyse en cours...</h2>
          <p style={{ color: COLORS.accent }} className="text-sm">Vision IA • Cadastre • DVF • DPE</p>
          
          <div className="mt-8 space-y-3 text-white text-sm">
            {['Analyse de l\'image', 'Données cadastrales', 'Prix du marché', 'Calcul estimation'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 opacity-80">
                <CheckCircle size={16} style={{ color: COLORS.accent }} />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // Écran de résultat
  if (screen === 'result') {
    return (
      <PhoneFrame>
        <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: COLORS.background }}>
          {/* Header avec image */}
          <div className="relative h-40">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800">
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                <Home size={60} />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full">
              <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                Confiance: {mockEstimation.confiance}%
              </span>
            </div>
            <button 
              onClick={() => setScreen('home')}
              className="absolute top-3 left-3 bg-white/90 p-2 rounded-full"
            >
              <ChevronRight size={18} className="rotate-180" style={{ color: COLORS.primary }} />
            </button>
          </div>

          {/* Prix */}
          <div className="text-center py-5" style={{ backgroundColor: COLORS.white }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.textLight }}>Estimation</p>
            <p className="text-3xl font-bold mt-1" style={{ color: COLORS.primary }}>
              {formatPrice(mockEstimation.prix_total)}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.textLight }}>
              Fourchette: {formatPrice(mockEstimation.prix_bas)} - {formatPrice(mockEstimation.prix_haut)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
              <span className="text-sm" style={{ color: COLORS.text }}>
                Qualité: {mockEstimation.qualite}
              </span>
            </div>
          </div>

          {/* Cards résumé */}
          <div className="flex gap-2 px-3 py-3">
            {[
              { label: 'Surface', value: `${mockEstimation.surface_habitable} m²`, color: COLORS.secondary },
              { label: 'Terrain', value: `${mockEstimation.surface_terrain} m²`, color: COLORS.success },
              { label: 'Prix/m²', value: `${mockEstimation.prix_m2_ajuste}€`, color: COLORS.warning },
            ].map((card, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-xl p-3 text-center"
                style={{ backgroundColor: COLORS.white, borderTop: `3px solid ${card.color}` }}
              >
                <p className="text-xs" style={{ color: COLORS.textLight }}>{card.label}</p>
                <p className="font-bold mt-1" style={{ color: COLORS.text }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Détails scrollables */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {/* DPE */}
            <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: COLORS.white }}>
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>
                <Leaf size={16} className="inline mr-2" style={{ color: COLORS.success }} />
                Performance énergétique
              </h3>
              <div className="flex justify-around">
                {['classe', 'ges'].map((type, i) => (
                  <div key={i} className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-1"
                      style={{ backgroundColor: DPE_COLORS[type === 'classe' ? mockEstimation.dpe.classe : mockEstimation.dpe.ges] }}
                    >
                      <span className="text-white text-xl font-bold">
                        {type === 'classe' ? mockEstimation.dpe.classe : mockEstimation.dpe.ges}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>
                      {type === 'classe' ? 'Énergie' : 'GES'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision IA */}
            <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: COLORS.white }}>
              <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>
                <Camera size={16} className="inline mr-2" style={{ color: COLORS.secondary }} />
                Analyse Vision IA
              </h3>
              <div className="space-y-2">
                {[
                  ['Type de bien', mockEstimation.vision.type],
                  ['État extérieur', mockEstimation.vision.etat],
                  ['Étages estimés', mockEstimation.vision.etages],
                ].map(([label, value], i) => (
                  <div key={i} className="flex justify-between py-2 border-b" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm" style={{ color: COLORS.textLight }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: COLORS.text }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avertissement */}
            <div 
              className="rounded-xl p-4 mb-3 border-l-4"
              style={{ backgroundColor: '#FFF9E6', borderColor: COLORS.warning }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} style={{ color: COLORS.warning }} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs" style={{ color: COLORS.text }}>
                  DPE basé sur la moyenne du quartier. Un DPE réel peut modifier l'estimation.
                </p>
              </div>
            </div>

            {/* Boutons action */}
            <div className="flex gap-2 mb-3">
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2"
                style={{ borderColor: COLORS.primary }}
              >
                <Share2 size={18} style={{ color: COLORS.primary }} />
                <span className="font-medium" style={{ color: COLORS.primary }}>Partager</span>
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.primary }}
              >
                <FileText size={18} color="white" />
                <span className="font-medium text-white">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // Écran d'accueil
  return (
    <PhoneFrame>
      <div className="flex flex-col h-full" style={{ backgroundColor: COLORS.background }}>
        {/* Header gradient */}
        <div 
          className="px-4 pt-4 pb-6 rounded-b-3xl"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.accent}20` }}>
              <Home size={24} style={{ color: COLORS.accent }} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">EstimImmo AI</h1>
              <p className="text-xs" style={{ color: COLORS.accent }}>Estimation intelligente</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around bg-white/10 rounded-xl p-3">
            {[
              { icon: '📍', label: 'GPS OK' },
              { icon: '🏠', label: 'Cadastre' },
              { icon: '💰', label: 'DVF' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <span className="text-lg">{stat.icon}</span>
                <p className="text-xs text-white/80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h2 className="font-bold text-lg mb-2" style={{ color: COLORS.text }}>Estimer un bien</h2>
          <p className="text-sm mb-4" style={{ color: COLORS.textLight }}>
            Prenez une photo pour obtenir une estimation instantanée.
          </p>

          {/* Bouton principal */}
          <button 
            onClick={simulateEstimation}
            className="w-full rounded-2xl p-6 text-center mb-4 shadow-lg transform active:scale-98 transition-transform"
            style={{ background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` }}
          >
            <Camera size={32} className="mx-auto mb-2 text-white" />
            <p className="text-white font-bold text-lg">Prendre une photo</p>
            <p className="text-white/80 text-xs mt-1">Estimation instantanée</p>
          </button>

          {/* Bouton secondaire */}
          <button 
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 mb-6"
            style={{ borderColor: COLORS.primary }}
          >
            <FileText size={20} style={{ color: COLORS.primary }} />
            <span className="font-medium" style={{ color: COLORS.primary }}>
              Choisir depuis la galerie
            </span>
          </button>

          {/* Fonctionnalités */}
          <h3 className="font-bold mb-3" style={{ color: COLORS.text }}>Fonctionnalités</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Camera, title: 'Vision IA', desc: 'Analyse automatique', color: COLORS.secondary },
              { icon: MapPin, title: 'Cadastre', desc: 'Données officielles', color: COLORS.success },
              { icon: TrendingUp, title: 'Prix DVF', desc: 'Transactions récentes', color: COLORS.warning },
              { icon: Leaf, title: 'DPE', desc: 'Performance énergie', color: COLORS.primary },
            ].map((feature, i) => (
              <div 
                key={i}
                className="rounded-xl p-3 border-l-4"
                style={{ backgroundColor: COLORS.white, borderColor: feature.color }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon size={16} style={{ color: feature.color }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: COLORS.text }}>{feature.title}</p>
                <p className="text-xs" style={{ color: COLORS.textLight }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-around py-3 border-t" style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}>
          {[
            { icon: Home, label: 'Accueil', id: 'accueil' },
            { icon: Clock, label: 'Historique', id: 'historique' },
            { icon: Settings, label: 'Paramètres', id: 'settings' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <tab.icon 
                size={22} 
                style={{ color: activeTab === tab.id ? COLORS.primary : COLORS.textLight }}
                fill={activeTab === tab.id ? COLORS.primary : 'none'}
              />
              <span 
                className="text-xs"
                style={{ color: activeTab === tab.id ? COLORS.primary : COLORS.textLight }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

// Composant frame téléphone
function PhoneFrame({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="relative">
        {/* Téléphone */}
        <div 
          className="relative w-80 h-[640px] rounded-[3rem] p-3 shadow-2xl"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
          
          {/* Écran */}
          <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-white">
            {children}
          </div>
        </div>
        
        {/* Badge */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg">
          <p className="text-sm font-medium" style={{ color: COLORS.primary }}>
            📱 EstimImmo AI - Démo Interactive
          </p>
        </div>
      </div>
    </div>
  );
}

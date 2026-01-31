/**
 * EstimationScreen - Résultats de l'estimation immobilière
 * Affiche le prix estimé et tous les détails
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { estimateProperty, generatePDFReport } from '../services/api';

const { width } = Dimensions.get('window');

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

// Couleurs DPE
const DPE_COLORS = {
  A: '#319834',
  B: '#33CC31',
  C: '#CBFC34',
  D: '#FCFC32',
  E: '#FCCC00',
  F: '#FC9900',
  G: '#FC0000',
};

export default function EstimationScreen({ route, navigation }) {
  const { images, location } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [estimation, setEstimation] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    performEstimation();
  }, []);

  const performEstimation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Appel API
      const result = await estimateProperty({
        latitude: location.latitude,
        longitude: location.longitude,
        images: images,
      });

      setEstimation(result);
    } catch (err) {
      console.error('Erreur estimation:', err);
      setError(err.message || 'Impossible d\'obtenir l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `🏠 Estimation EstimImmo AI\n\n` +
        `💰 Prix estimé: ${formatPrice(estimation.prix_total_estime)}\n` +
        `📐 Surface: ${estimation.surface_habitable_estimee} m²\n` +
        `📊 Prix/m²: ${formatPrice(estimation.prix_m2_ajuste)}/m²\n` +
        `📍 Confiance: ${estimation.confiance}%`;

      await Share.share({
        message,
        title: 'Estimation immobilière',
      });
    } catch (err) {
      console.error('Erreur partage:', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      
      // Générer le PDF via l'API
      const pdfUrl = await generatePDFReport(estimation);
      
      // Télécharger le fichier
      const fileUri = FileSystem.documentDirectory + 'estimation.pdf';
      await FileSystem.downloadAsync(pdfUrl, fileUri);
      
      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer le rapport PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingTitle}>Analyse en cours...</Text>
          <Text style={styles.loadingSubtitle}>
            Vision IA • Cadastre • DVF • DPE
          </Text>
          
          <View style={styles.loadingSteps}>
            <LoadingStep icon="camera" text="Analyse de l'image" />
            <LoadingStep icon="map" text="Données cadastrales" />
            <LoadingStep icon="trending-up" text="Prix du marché" />
            <LoadingStep icon="calculator" text="Calcul de l'estimation" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={60} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Erreur d'estimation</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={performEstimation}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Image du bien */}
      {images && images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: images[0].uri }} 
            style={styles.propertyImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          >
            <View style={styles.imageInfo}>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  Confiance: {estimation?.confiance?.toFixed(0)}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Prix principal */}
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Estimation</Text>
        <Text style={styles.mainPrice}>
          {formatPrice(estimation?.prix_total_estime)}
        </Text>
        <Text style={styles.priceRange}>
          Fourchette: {formatPrice(estimation?.prix_bas)} - {formatPrice(estimation?.prix_haut)}
        </Text>
        
        {/* Indicateur de qualité */}
        <View style={styles.qualityIndicator}>
          <View style={[
            styles.qualityDot,
            { backgroundColor: getQualityColor(estimation?.qualite_donnees) }
          ]} />
          <Text style={styles.qualityText}>
            Qualité des données: {estimation?.qualite_donnees}
          </Text>
        </View>
      </View>

      {/* Résumé rapide */}
      <View style={styles.summaryCards}>
        <SummaryCard 
          icon="resize"
          label="Surface terrain"
          value={`${estimation?.surface_terrain?.toFixed(0) || 'N/A'} m²`}
          color={COLORS.secondary}
        />
        <SummaryCard 
          icon="home"
          label="Surface habitable"
          value={`${estimation?.surface_habitable_estimee?.toFixed(0) || 'N/A'} m²`}
          color={COLORS.success}
        />
        <SummaryCard 
          icon="pricetag"
          label="Prix/m²"
          value={`${estimation?.prix_m2_ajuste?.toFixed(0) || 'N/A'} €`}
          color={COLORS.warning}
        />
      </View>

      {/* Onglets de détails */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'summary' && styles.activeTab]}
          onPress={() => setActiveSection('summary')}
        >
          <Text style={[styles.tabText, activeSection === 'summary' && styles.activeTabText]}>
            Résumé
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'cadastre' && styles.activeTab]}
          onPress={() => setActiveSection('cadastre')}
        >
          <Text style={[styles.tabText, activeSection === 'cadastre' && styles.activeTabText]}>
            Cadastre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'market' && styles.activeTab]}
          onPress={() => setActiveSection('market')}
        >
          <Text style={[styles.tabText, activeSection === 'market' && styles.activeTabText]}>
            Marché
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'vision' && styles.activeTab]}
          onPress={() => setActiveSection('vision')}
        >
          <Text style={[styles.tabText, activeSection === 'vision' && styles.activeTabText]}>
            Vision IA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu des onglets */}
      <View style={styles.tabContent}>
        {activeSection === 'summary' && (
          <SummarySection estimation={estimation} formatPrice={formatPrice} />
        )}
        {activeSection === 'cadastre' && (
          <CadastreSection cadastre={estimation?.cadastre} />
        )}
        {activeSection === 'market' && (
          <MarketSection dvf={estimation?.dvf} formatPrice={formatPrice} />
        )}
        {activeSection === 'vision' && (
          <VisionSection vision={estimation?.vision} />
        )}
      </View>

      {/* DPE si disponible */}
      {estimation?.dpe && (
        <View style={styles.dpeSection}>
          <Text style={styles.sectionTitle}>Performance énergétique</Text>
          <View style={styles.dpeContainer}>
            <View style={[
              styles.dpeBadge,
              { backgroundColor: DPE_COLORS[estimation.dpe.classe_energie] || '#999' }
            ]}>
              <Text style={styles.dpeClass}>
                {estimation.dpe.classe_energie || '?'}
              </Text>
            </View>
            <View style={styles.dpeInfo}>
              <Text style={styles.dpeLabel}>Classe énergie</Text>
              {estimation.dpe.consommation_energie && (
                <Text style={styles.dpeValue}>
                  {estimation.dpe.consommation_energie} kWh/m²/an
                </Text>
              )}
            </View>
            <View style={[
              styles.dpeBadge,
              { backgroundColor: DPE_COLORS[estimation.dpe.classe_ges] || '#999' }
            ]}>
              <Text style={styles.dpeClass}>
                {estimation.dpe.classe_ges || '?'}
              </Text>
            </View>
            <View style={styles.dpeInfo}>
              <Text style={styles.dpeLabel}>Classe GES</Text>
              {estimation.dpe.estimation_ges && (
                <Text style={styles.dpeValue}>
                  {estimation.dpe.estimation_ges} kgCO₂/m²/an
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Avertissements */}
      {estimation?.avertissements && estimation.avertissements.length > 0 && (
        <View style={styles.warningsSection}>
          <Text style={styles.sectionTitle}>⚠️ Points d'attention</Text>
          {estimation.avertissements.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pdfButton}
          onPress={handleDownloadPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color={COLORS.white} />
              <Text style={styles.pdfButtonText}>Rapport PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sources */}
      <View style={styles.sourcesSection}>
        <Text style={styles.sourcesTitle}>Sources utilisées</Text>
        <Text style={styles.sourcesText}>
          {estimation?.sources_utilisees?.join(' • ')}
        </Text>
        <Text style={styles.disclaimer}>
          Estimation indicative - Consultez un expert pour une évaluation certifiée
        </Text>
      </View>
    </ScrollView>
  );
}

// Composants auxiliaires
function LoadingStep({ icon, text }) {
  return (
    <View style={styles.loadingStep}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
      <Text style={styles.loadingStepText}>{text}</Text>
    </View>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.summaryCardLabel}>{label}</Text>
      <Text style={styles.summaryCardValue}>{value}</Text>
    </View>
  );
}

function SummarySection({ estimation, formatPrice }) {
  return (
    <View style={styles.sectionContent}>
      <DetailRow label="Prix au m² secteur" value={`${formatPrice(estimation?.prix_m2_secteur)}/m²`} />
      <DetailRow label="Prix au m² ajusté" value={`${formatPrice(estimation?.prix_m2_ajuste)}/m²`} />
      <DetailRow label="Coefficient état" value={estimation?.details_calcul?.coefficient_etat?.toFixed(2)} />
      <DetailRow label="Coefficient DPE" value={estimation?.details_calcul?.coefficient_dpe?.toFixed(2)} />
      <DetailRow label="Marge d'erreur" value={`±${estimation?.details_calcul?.marge_erreur_pct}%`} />
    </View>
  );
}

function CadastreSection({ cadastre }) {
  if (!cadastre) return <Text style={styles.noData}>Données non disponibles</Text>;
  
  return (
    <View style={styles.sectionContent}>
      <DetailRow label="Commune" value={cadastre.commune || 'N/A'} />
      <DetailRow label="Code INSEE" value={cadastre.code_insee || 'N/A'} />
      <DetailRow label="Section" value={cadastre.section || 'N/A'} />
      <DetailRow label="Parcelle" value={cadastre.numero_parcelle || 'N/A'} />
      <DetailRow label="Surface terrain" value={`${cadastre.surface_terrain || 'N/A'} m²`} />
      {cadastre.annee_construction && (
        <DetailRow label="Année construction" value={cadastre.annee_construction} />
      )}
    </View>
  );
}

function MarketSection({ dvf, formatPrice }) {
  if (!dvf) return <Text style={styles.noData}>Données non disponibles</Text>;
  
  return (
    <View style={styles.sectionContent}>
      <DetailRow label="Prix moyen" value={`${formatPrice(dvf.prix_m2_moyen)}/m²`} />
      <DetailRow label="Prix médian" value={`${formatPrice(dvf.prix_m2_median)}/m²`} />
      <DetailRow label="Transactions" value={dvf.nb_transactions?.toString() || '0'} />
      <DetailRow label="Période" value={dvf.periode || 'N/A'} />
      
      {dvf.transactions_detail && dvf.transactions_detail.length > 0 && (
        <View style={styles.transactionsList}>
          <Text style={styles.transactionsTitle}>Ventes récentes comparables</Text>
          {dvf.transactions_detail.slice(0, 3).map((t, i) => (
            <View key={i} style={styles.transactionItem}>
              <Text style={styles.transactionDate}>{t.date?.substring(0, 10)}</Text>
              <Text style={styles.transactionPrice}>{formatPrice(t.prix)}</Text>
              <Text style={styles.transactionSurface}>{t.surface}m² - {formatPrice(t.prix_m2)}/m²</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function VisionSection({ vision }) {
  if (!vision) return <Text style={styles.noData}>Données non disponibles</Text>;
  
  return (
    <View style={styles.sectionContent}>
      <DetailRow label="Type de bien" value={vision.type_bien || 'N/A'} />
      <DetailRow label="État extérieur" value={vision.etat_exterieur || 'N/A'} />
      <DetailRow label="Étages estimés" value={vision.nombre_etages_estime?.toString() || '1'} />
      <DetailRow label="Confiance analyse" value={`${vision.score_confiance?.toFixed(0) || 'N/A'}%`} />
      <DetailRow label="Méthode" value={vision.details?.methode || 'heuristic'} />
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getQualityColor(quality) {
  switch (quality) {
    case 'Excellente': return COLORS.success;
    case 'Bonne': return '#68C371';
    case 'Moyenne': return COLORS.warning;
    case 'Limitée': return '#E67E22';
    case 'Faible': return COLORS.danger;
    default: return COLORS.textLight;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 8,
  },
  loadingSteps: {
    marginTop: 40,
    gap: 15,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingStepText: {
    fontSize: 14,
    color: COLORS.white,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  
  // Image
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 15,
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Price Section
  priceSection: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: COLORS.white,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  priceRange: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  qualityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  qualityText: {
    fontSize: 13,
    color: COLORS.text,
  },
  
  // Summary Cards
  summaryCards: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  
  // Tab Content
  tabContent: {
    margin: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
  },
  sectionContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  noData: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: 20,
  },
  
  // Transactions
  transactionsList: {
    marginTop: 15,
  },
  transactionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  transactionItem: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  transactionPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  transactionSurface: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  
  // DPE Section
  dpeSection: {
    margin: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  dpeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dpeBadge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpeClass: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dpeInfo: {
    alignItems: 'center',
  },
  dpeLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  dpeValue: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  
  // Warnings
  warningsSection: {
    margin: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningItem: {
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  
  // Actions
  actionsSection: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Sources
  sourcesSection: {
    padding: 20,
    alignItems: 'center',
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  sourcesText: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 5,
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

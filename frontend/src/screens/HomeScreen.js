/**
 * HomeScreen - Écran d'accueil EstimImmo AI
 * Interface principale pour lancer une estimation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  // Demander la permission de localisation au chargement
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'EstimImmo AI a besoin de votre localisation pour accéder aux données cadastrales.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation refusée');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation.coords);
      setLocationLoading(false);
      return currentLocation.coords;
    } catch (error) {
      setLocationLoading(false);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
      return null;
    }
  };

  const takePhoto = async () => {
    try {
      // Demander permissions caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la caméra nécessaire');
        return;
      }

      // Récupérer la position actuelle
      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Erreur', 'Position GPS requise pour l\'estimation');
        return;
      }

      // Ouvrir la caméra
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Naviguer vers l'écran d'estimation
        navigation.navigate('Estimation', {
          images: [result.assets[0]],
          location: coords,
        });
      }
    } catch (error) {
      console.error('Erreur photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Demander la position pour les photos de galerie
        Alert.alert(
          'Position du bien',
          'Pour une estimation précise, veuillez vous rendre près du bien ou saisir l\'adresse.',
          [
            {
              text: 'Utiliser ma position',
              onPress: async () => {
                const coords = await getCurrentLocation();
                if (coords) {
                  navigation.navigate('Estimation', {
                    images: result.assets,
                    location: coords,
                  });
                }
              },
            },
            {
              text: 'Annuler',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur galerie:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="home-analytics" size={40} color={COLORS.accent} />
              <View style={styles.titleContainer}>
                <Text style={styles.title}>EstimImmo AI</Text>
                <Text style={styles.subtitle}>Estimation immobilière intelligente</Text>
              </View>
            </View>
          </View>

          {/* Stats rapides */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>📍</Text>
              <Text style={styles.statLabel}>
                {location ? 'Position OK' : 'GPS en attente'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🏠</Text>
              <Text style={styles.statLabel}>Données cadastrales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>💰</Text>
              <Text style={styles.statLabel}>Prix DVF</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section principale */}
        <View style={styles.mainSection}>
          <Text style={styles.sectionTitle}>Estimer un bien</Text>
          <Text style={styles.sectionDescription}>
            Prenez une photo du bien immobilier pour obtenir une estimation instantanée basée sur l'IA et les données officielles.
          </Text>

          {/* Boutons d'action principaux */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.primary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={32} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Prendre une photo</Text>
                <Text style={styles.buttonSubtext}>Estimation instantanée</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          
          <View style={styles.featureGrid}>
            <FeatureCard 
              icon="eye"
              iconFamily="Ionicons"
              title="Vision IA"
              description="Analyse automatique de l'état et du type de bien"
              color={COLORS.secondary}
            />
            <FeatureCard 
              icon="map-marked-alt"
              iconFamily="FontAwesome5"
              title="Données cadastrales"
              description="Surface, parcelle et infos officielles"
              color={COLORS.success}
            />
            <FeatureCard 
              icon="chart-line"
              iconFamily="FontAwesome5"
              title="Prix du marché"
              description="Transactions DVF récentes du secteur"
              color={COLORS.warning}
            />
            <FeatureCard 
              icon="leaf"
              iconFamily="FontAwesome5"
              title="Performance DPE"
              description="Classe énergétique et impact sur le prix"
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* Comment ça marche */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          
          <View style={styles.stepsContainer}>
            <StepItem 
              number="1"
              title="Prenez une photo"
              description="Du bien à estimer depuis l'extérieur"
            />
            <View style={styles.stepConnector} />
            <StepItem 
              number="2"
              title="L'IA analyse"
              description="Type, état, surface estimée"
            />
            <View style={styles.stepConnector} />
            <StepItem 
              number="3"
              title="Données croisées"
              description="Cadastre + DVF + DPE"
            />
            <View style={styles.stepConnector} />
            <StepItem 
              number="4"
              title="Estimation"
              description="Prix avec intervalle de confiance"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Données officielles : data.gouv.fr • cadastre.gouv.fr • ADEME
          </Text>
          <Text style={styles.footerDisclaimer}>
            Estimation indicative - Consultez un expert pour une évaluation certifiée
          </Text>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {locationLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Localisation en cours...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Composant Feature Card
function FeatureCard({ icon, iconFamily, title, description, color }) {
  const IconComponent = iconFamily === 'FontAwesome5' ? FontAwesome5 : Ionicons;
  
  return (
    <View style={[styles.featureCard, { borderLeftColor: color }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: `${color}15` }]}>
        <IconComponent name={icon} size={20} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

// Composant Step Item
function StepItem({ number, title, description }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 4,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Main Section
  mainSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Action Buttons
  actionButtons: {
    gap: 15,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Features Section
  featuresSection: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 16,
  },

  // How It Works
  howItWorks: {
    padding: 20,
  },
  stepsContainer: {
    marginTop: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    flex: 1.5,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 17,
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  footerDisclaimer: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: COLORS.text,
  },
});

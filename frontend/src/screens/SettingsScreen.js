/**
 * SettingsScreen - Paramètres de l'application
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1E3A5F',
  secondary: '#4A90A4',
  accent: '#E8B923',
  success: '#27AE60',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E0E0E0',
  danger: '#E74C3C',
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    highQualityImages: true,
    autoLocation: true,
    saveHistory: true,
    expertMode: false,
    notifications: false,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openURL = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Section Général */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Général</Text>
        
        <SettingRow
          icon="image"
          title="Images haute qualité"
          subtitle="Meilleure analyse mais fichiers plus lourds"
          value={settings.highQualityImages}
          onToggle={() => toggleSetting('highQualityImages')}
        />
        
        <SettingRow
          icon="location"
          title="Localisation automatique"
          subtitle="Récupérer la position GPS automatiquement"
          value={settings.autoLocation}
          onToggle={() => toggleSetting('autoLocation')}
        />
        
        <SettingRow
          icon="time"
          title="Sauvegarder l'historique"
          subtitle="Conserver les estimations précédentes"
          value={settings.saveHistory}
          onToggle={() => toggleSetting('saveHistory')}
        />
      </View>

      {/* Section Avancé */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avancé</Text>
        
        <SettingRow
          icon="construct"
          title="Mode expert"
          subtitle="Permet de saisir des données manuellement"
          value={settings.expertMode}
          onToggle={() => toggleSetting('expertMode')}
        />
        
        <SettingRow
          icon="notifications"
          title="Notifications"
          subtitle="Alertes sur les évolutions de prix"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
      </View>

      {/* Section Données */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sources de données</Text>
        
        <LinkRow
          icon="globe"
          title="Cadastre France"
          subtitle="cadastre.data.gouv.fr"
          onPress={() => openURL('https://cadastre.data.gouv.fr')}
        />
        
        <LinkRow
          icon="trending-up"
          title="DVF - Valeurs Foncières"
          subtitle="data.gouv.fr"
          onPress={() => openURL('https://app.dvf.etalab.gouv.fr')}
        />
        
        <LinkRow
          icon="leaf"
          title="DPE - ADEME"
          subtitle="data.ademe.fr"
          onPress={() => openURL('https://data.ademe.fr')}
        />
      </View>

      {/* Section À propos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        
        <InfoRow
          icon="information-circle"
          title="Version"
          value="1.0.0"
        />
        
        <LinkRow
          icon="document-text"
          title="Conditions d'utilisation"
          onPress={() => Alert.alert('CGU', 'Conditions générales d\'utilisation...')}
        />
        
        <LinkRow
          icon="shield-checkmark"
          title="Politique de confidentialité"
          onPress={() => Alert.alert('Confidentialité', 'Politique de confidentialité...')}
        />
        
        <LinkRow
          icon="help-circle"
          title="Aide & Support"
          onPress={() => Alert.alert('Support', 'Contact: support@estimmo.ai')}
        />
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ EstimImmo AI fournit des estimations indicatives basées sur les données 
          publiques disponibles. Ces estimations ne constituent pas une évaluation 
          immobilière officielle. Pour une expertise certifiée, consultez un 
          professionnel agréé.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>EstimImmo AI © 2024</Text>
        <Text style={styles.footerSubtext}>
          Propulsé par l'IA et les données ouvertes françaises
        </Text>
      </View>
    </ScrollView>
  );
}

// Composants auxiliaires
function SettingRow({ icon, title, subtitle, value, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={COLORS.secondary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.secondary }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

function LinkRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={COLORS.secondary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, title, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={COLORS.secondary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${COLORS.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  disclaimer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

/**
 * HistoryScreen - Historique des estimations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

const STORAGE_KEY = '@estimmo_history';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette estimation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const newHistory = history.filter(item => item.id !== id);
            setHistory(newHistory);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
          },
        },
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      'Tout effacer',
      'Voulez-vous supprimer tout l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => {
        // Naviguer vers les détails de l'estimation
        navigation.navigate('Estimation', {
          images: item.images,
          location: item.location,
          savedEstimation: item.estimation,
        });
      }}
      onLongPress={() => deleteItem(item.id)}
    >
      {item.imageUri && (
        <Image 
          source={{ uri: item.imageUri }} 
          style={styles.thumbnail}
        />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.estimation?.prix_total_estime)}
        </Text>
        <Text style={styles.itemAddress} numberOfLines={1}>
          {item.estimation?.cadastre?.commune || 'Adresse inconnue'}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDate}>
            {formatDate(item.date)}
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {item.estimation?.confiance?.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={80} color={COLORS.border} />
      <Text style={styles.emptyTitle}>Aucune estimation</Text>
      <Text style={styles.emptyText}>
        Vos estimations apparaîtront ici
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Accueil')}
      >
        <Text style={styles.emptyButtonText}>Faire une estimation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {history.length} estimation{history.length > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Fonction utilitaire pour sauvegarder une estimation
export async function saveEstimation(estimation, images, location) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const history = data ? JSON.parse(data) : [];
    
    const newItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      estimation,
      images,
      location,
      imageUri: images?.[0]?.uri,
    };
    
    history.unshift(newItem);
    
    // Garder seulement les 50 dernières estimations
    const trimmedHistory = history.slice(0, 50);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    
    return newItem;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  list: {
    padding: 15,
  },
  emptyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  itemAddress: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  confidenceBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

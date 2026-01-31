/**
 * API Service - Communication avec le backend EstimImmo AI
 */

import * as FileSystem from 'expo-file-system';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Effectue une estimation immobilière
 * @param {Object} params - Paramètres de l'estimation
 * @param {number} params.latitude - Latitude GPS
 * @param {number} params.longitude - Longitude GPS
 * @param {Array} params.images - Images du bien
 * @returns {Promise<Object>} Résultat de l'estimation
 */
export async function estimateProperty({ latitude, longitude, images }) {
  try {
    // Si une seule image, utiliser l'endpoint simple
    if (images.length === 1) {
      return await estimateSingle(latitude, longitude, images[0]);
    }
    
    // Sinon, utiliser l'endpoint multi-photos
    return await estimateMultiple(latitude, longitude, images);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Estimation avec une seule photo
 */
async function estimateSingle(latitude, longitude, image) {
  const formData = new FormData();
  
  // Ajouter l'image
  const imageUri = image.uri;
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type: type,
  });

  const url = `${API_BASE_URL}/estimate?latitude=${latitude}&longitude=${longitude}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erreur serveur: ${response.status}`);
  }

  return await response.json();
}

/**
 * Estimation avec plusieurs photos
 */
async function estimateMultiple(latitude, longitude, images) {
  // Convertir les images en base64
  const imagesBase64 = await Promise.all(
    images.map(async (img) => {
      const base64 = await FileSystem.readAsStringAsync(img.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    })
  );

  const response = await fetch(`${API_BASE_URL}/estimate/multi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      latitude,
      longitude,
      images_base64: imagesBase64,
      mode_expert: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erreur serveur: ${response.status}`);
  }

  return await response.json();
}

/**
 * Récupérer les données cadastrales seules
 */
export async function getCadastreData(latitude, longitude) {
  const response = await fetch(
    `${API_BASE_URL}/cadastre?latitude=${latitude}&longitude=${longitude}`
  );

  if (!response.ok) {
    throw new Error('Erreur récupération cadastre');
  }

  return await response.json();
}

/**
 * Récupérer les statistiques DVF
 */
export async function getDVFStats(latitude, longitude, radius = 500) {
  const response = await fetch(
    `${API_BASE_URL}/dvf?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
  );

  if (!response.ok) {
    throw new Error('Erreur récupération DVF');
  }

  return await response.json();
}

/**
 * Générer un rapport PDF
 * @param {Object} estimation - Données de l'estimation
 * @returns {Promise<string>} URL du PDF généré
 */
export async function generatePDFReport(estimation) {
  const response = await fetch(`${API_BASE_URL}/report/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(estimation),
  });

  if (!response.ok) {
    throw new Error('Erreur génération PDF');
  }

  // Récupérer le blob et créer une URL locale
  const blob = await response.blob();
  const fileUri = FileSystem.documentDirectory + 'estimation_report.pdf';
  
  // Convertir blob en base64 et sauvegarder
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64data = reader.result.split(',')[1];
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        resolve(fileUri);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Vérifier la santé de l'API
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Mock pour le développement sans backend
 * Retourne des données simulées
 */
export function getMockEstimation(latitude, longitude) {
  return {
    surface_terrain: 450,
    surface_habitable_estimee: 120,
    prix_m2_secteur: 3500,
    prix_m2_ajuste: 3675,
    prix_total_estime: 441000,
    prix_bas: 397000,
    prix_haut: 485000,
    confiance: 72,
    qualite_donnees: "Bonne",
    cadastre: {
      numero_parcelle: "0123",
      section: "AB",
      surface_terrain: 450,
      commune: "Exemple-Ville",
      code_insee: "12345",
    },
    dvf: {
      prix_m2_moyen: 3500,
      prix_m2_median: 3400,
      nb_transactions: 15,
      periode: "Derniers 12 mois",
      transactions_detail: [
        { date: "2024-01-15", prix: 380000, surface: 105, prix_m2: 3619 },
        { date: "2024-02-20", prix: 425000, surface: 130, prix_m2: 3269 },
        { date: "2024-03-10", prix: 295000, surface: 85, prix_m2: 3471 },
      ],
    },
    dpe: {
      classe_energie: "D",
      classe_ges: "E",
      consommation_energie: 185,
      estimation_ges: 42,
    },
    vision: {
      type_bien: "maison",
      etat_exterieur: "Bon état",
      nombre_etages_estime: 2,
      score_confiance: 68,
      details: {
        methode: "heuristic",
      },
    },
    sources_utilisees: [
      "Cadastre (APICarto IGN)",
      "DVF (Etalab)",
      "DPE (ADEME)",
      "Vision IA (heuristic)",
    ],
    date_estimation: new Date().toISOString(),
    avertissements: [
      "ℹ️ DPE basé sur la moyenne du quartier",
      "⚠️ Peu de transactions comparables dans le secteur immédiat",
    ],
    details_calcul: {
      coefficient_etat: 1.05,
      coefficient_dpe: 1.00,
      coefficient_etages: 1.05,
      coefficient_saison: 1.00,
      coefficient_total: 1.05,
      marge_erreur_pct: 10,
    },
  };
}

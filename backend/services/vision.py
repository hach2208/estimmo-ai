"""
Service Vision IA - Analyse d'images immobilières
Utilise des modèles de vision par ordinateur pour analyser les photos
"""

import io
import base64
from typing import Dict, Any, List, Optional
from PIL import Image
import numpy as np
from datetime import datetime


class VisionAnalyzer:
    """
    Analyseur d'images immobilières par vision par ordinateur.
    
    Fonctionnalités:
    - Détection du type de bien (maison, appartement, immeuble, terrain)
    - Estimation de l'état extérieur/intérieur
    - Détection du nombre d'étages
    - Estimation de la surface visible
    
    Note: En production, utiliser YOLO/EfficientDet fine-tuné sur dataset immobilier.
    Cette version utilise des heuristiques et règles pour la démonstration.
    """
    
    # Mapping des types de biens
    PROPERTY_TYPES = {
        "maison": "Maison individuelle",
        "appartement": "Appartement",
        "immeuble": "Immeuble collectif",
        "terrain": "Terrain nu",
        "local_commercial": "Local commercial",
        "inconnu": "Type indéterminé"
    }
    
    # États possibles
    STATES = {
        "neuf": {"label": "Neuf / Récent", "coef": 1.15},
        "tres_bon": {"label": "Très bon état", "coef": 1.10},
        "bon": {"label": "Bon état", "coef": 1.0},
        "correct": {"label": "État correct", "coef": 0.95},
        "travaux_legers": {"label": "Travaux légers à prévoir", "coef": 0.85},
        "renovation": {"label": "Rénovation nécessaire", "coef": 0.70},
        "gros_travaux": {"label": "Gros travaux", "coef": 0.55}
    }
    
    def __init__(self, use_ml_model: bool = False):
        """
        Initialise l'analyseur.
        
        Args:
            use_ml_model: Si True, charge un modèle ML (YOLOv8).
                         Si False, utilise l'analyse heuristique.
        """
        self.use_ml = use_ml_model
        self.model = None
        
        if use_ml_model:
            self._load_model()
    
    def _load_model(self):
        """
        Charge le modèle de vision (YOLO ou autre).
        En production, charger un modèle fine-tuné.
        """
        try:
            # Pour la production avec YOLO:
            # from ultralytics import YOLO
            # self.model = YOLO('models/estim_immo_yolov8.pt')
            pass
        except ImportError:
            print("YOLO non disponible, utilisation du mode heuristique")
            self.use_ml = False
    
    async def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyse une image de bien immobilier.
        
        Args:
            image_bytes: Image en bytes (JPEG, PNG, WebP)
            
        Returns:
            Résultats d'analyse avec type, état, surface estimée, etc.
        """
        try:
            # Charger l'image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convertir en RGB si nécessaire
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Analyser
            if self.use_ml and self.model:
                return await self._analyze_with_model(image)
            else:
                return await self._analyze_heuristic(image)
                
        except Exception as e:
            print(f"Erreur analyse vision: {e}")
            return self._get_fallback_analysis()
    
    async def _analyze_with_model(self, image: Image.Image) -> Dict[str, Any]:
        """
        Analyse avec modèle ML (YOLO/EfficientDet).
        """
        try:
            # Inférence YOLO
            results = self.model(image)
            
            # Parser les résultats
            detections = results[0]
            
            # Extraire les classes détectées
            type_bien = self._determine_property_type(detections)
            etat = self._determine_state(detections)
            etages = self._count_floors(detections)
            surface = self._estimate_visible_surface(detections, image.size)
            
            return {
                "type_bien": type_bien,
                "type_bien_label": self.PROPERTY_TYPES.get(type_bien, "Inconnu"),
                "etat_exterieur": etat,
                "etat_label": self.STATES.get(etat, {}).get("label", "Non déterminé"),
                "coefficient_etat": self.STATES.get(etat, {}).get("coef", 1.0),
                "nombre_etages_estime": etages,
                "surface_estimee_vision": surface,
                "score_confiance": float(detections.probs.top1conf) if hasattr(detections, 'probs') else 0.7,
                "details": {
                    "resolution_image": f"{image.size[0]}x{image.size[1]}",
                    "detections_brutes": len(detections.boxes) if hasattr(detections, 'boxes') else 0,
                    "methode": "ml_model"
                },
                "date_analyse": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Erreur modèle ML: {e}")
            return await self._analyze_heuristic(image)
    
    async def _analyze_heuristic(self, image: Image.Image) -> Dict[str, Any]:
        """
        Analyse heuristique basée sur les caractéristiques de l'image.
        Utilisée quand le modèle ML n'est pas disponible.
        """
        # Convertir en array numpy pour l'analyse
        img_array = np.array(image)
        
        # 1. Analyse des couleurs dominantes
        colors = self._analyze_colors(img_array)
        
        # 2. Analyse de la texture et des bords
        texture_score = self._analyze_texture(img_array)
        
        # 3. Détection de lignes (estimation étages)
        horizontal_lines = self._detect_horizontal_lines(img_array)
        
        # 4. Ratio d'aspect de l'image
        aspect_ratio = image.size[0] / image.size[1]
        
        # Déterminer le type de bien
        type_bien = self._guess_property_type(colors, aspect_ratio, horizontal_lines)
        
        # Déterminer l'état
        etat = self._guess_state(colors, texture_score)
        
        # Estimer le nombre d'étages
        etages = self._estimate_floors(horizontal_lines, image.size[1])
        
        # Calculer un score de confiance basé sur la qualité de l'image
        confidence = self._calculate_confidence(image, colors, texture_score)
        
        return {
            "type_bien": type_bien,
            "type_bien_label": self.PROPERTY_TYPES.get(type_bien, "Inconnu"),
            "etat_exterieur": etat,
            "etat_label": self.STATES.get(etat, {}).get("label", "Non déterminé"),
            "coefficient_etat": self.STATES.get(etat, {}).get("coef", 1.0),
            "nombre_etages_estime": etages,
            "surface_estimee_vision": None,  # Non disponible en mode heuristique
            "score_confiance": confidence,
            "details": {
                "resolution_image": f"{image.size[0]}x{image.size[1]}",
                "couleurs_dominantes": colors[:3],
                "score_texture": texture_score,
                "lignes_detectees": len(horizontal_lines),
                "methode": "heuristic"
            },
            "date_analyse": datetime.now().isoformat()
        }
    
    def _analyze_colors(self, img_array: np.ndarray) -> List[Dict]:
        """
        Analyse les couleurs dominantes de l'image.
        """
        # Redimensionner pour accélérer
        small = img_array[::10, ::10]
        
        # Moyenne des couleurs
        avg_color = np.mean(small, axis=(0, 1))
        
        # Calculer les proportions de couleurs
        r, g, b = avg_color
        
        colors = []
        
        # Classifier les couleurs
        if r > 180 and g > 180 and b > 180:
            colors.append({"name": "blanc/clair", "ratio": 0.6})
        elif r < 80 and g < 80 and b < 80:
            colors.append({"name": "sombre", "ratio": 0.5})
        elif r > g and r > b:
            colors.append({"name": "tons chauds/brique", "ratio": 0.4})
        elif g > r and g > b:
            colors.append({"name": "végétation", "ratio": 0.3})
        elif b > r and b > g:
            colors.append({"name": "ciel/froid", "ratio": 0.3})
        else:
            colors.append({"name": "neutre/gris", "ratio": 0.4})
        
        # Variance des couleurs (indique richesse visuelle)
        variance = np.var(small)
        colors.append({"name": "variance", "value": float(variance)})
        
        return colors
    
    def _analyze_texture(self, img_array: np.ndarray) -> float:
        """
        Analyse la texture de l'image.
        Score élevé = textures complexes (peut indiquer vétusté ou détails riches)
        """
        # Convertir en niveaux de gris
        gray = np.mean(img_array, axis=2)
        
        # Calculer le gradient (sobel simplifié)
        gx = np.diff(gray, axis=1)
        gy = np.diff(gray, axis=0)
        
        # Score basé sur la magnitude moyenne du gradient
        texture_score = (np.mean(np.abs(gx)) + np.mean(np.abs(gy))) / 2
        
        return float(texture_score)
    
    def _detect_horizontal_lines(self, img_array: np.ndarray) -> List[int]:
        """
        Détecte les lignes horizontales (fenêtres, étages).
        Retourne les positions Y des lignes détectées.
        """
        # Convertir en niveaux de gris
        gray = np.mean(img_array, axis=2)
        
        # Calculer la somme horizontale (lignes = valeurs constantes)
        row_sums = np.sum(gray, axis=1)
        
        # Détecter les changements brusques (bords)
        diff = np.abs(np.diff(row_sums))
        threshold = np.mean(diff) + 2 * np.std(diff)
        
        lines = np.where(diff > threshold)[0].tolist()
        
        return lines
    
    def _guess_property_type(
        self, 
        colors: List[Dict], 
        aspect_ratio: float,
        horizontal_lines: List[int]
    ) -> str:
        """
        Devine le type de bien basé sur les caractéristiques visuelles.
        """
        # Beaucoup de végétation -> terrain ou maison avec jardin
        has_vegetation = any(c.get("name") == "végétation" for c in colors)
        
        # Nombreuses lignes horizontales -> immeuble
        many_lines = len(horizontal_lines) > 15
        
        # Ratio d'aspect
        is_tall = aspect_ratio < 0.8  # Plus haut que large
        is_wide = aspect_ratio > 1.5  # Plus large que haut
        
        if many_lines and is_tall:
            return "immeuble"
        elif has_vegetation and is_wide:
            return "maison"
        elif not many_lines and not has_vegetation:
            # Probablement terrain ou bâtiment simple
            variance = next((c.get("value", 0) for c in colors if c.get("name") == "variance"), 0)
            if variance < 500:
                return "terrain"
            else:
                return "maison"
        else:
            return "maison"  # Par défaut
    
    def _guess_state(self, colors: List[Dict], texture_score: float) -> str:
        """
        Devine l'état du bien basé sur les couleurs et textures.
        """
        # Récupérer la variance
        variance = next((c.get("value", 0) for c in colors if c.get("name") == "variance"), 0)
        
        # Couleurs claires et uniformes -> neuf/récent
        has_light = any(c.get("name") in ["blanc/clair"] for c in colors)
        has_warm = any(c.get("name") in ["tons chauds/brique"] for c in colors)
        
        # Score composite
        if has_light and texture_score < 15 and variance < 2000:
            return "neuf"
        elif has_light and texture_score < 25:
            return "tres_bon"
        elif texture_score < 35:
            return "bon"
        elif texture_score < 50:
            return "correct"
        elif texture_score < 70:
            return "travaux_legers"
        else:
            return "renovation"
    
    def _estimate_floors(self, horizontal_lines: List[int], image_height: int) -> int:
        """
        Estime le nombre d'étages basé sur les lignes horizontales.
        """
        if not horizontal_lines:
            return 1
        
        # Filtrer les lignes trop proches
        filtered_lines = []
        min_distance = image_height / 10  # Minimum 10% de l'image entre étages
        
        for line in sorted(horizontal_lines):
            if not filtered_lines or line - filtered_lines[-1] > min_distance:
                filtered_lines.append(line)
        
        # Estimer les étages (lignes / 2 car fenêtres haut et bas)
        estimated = max(1, len(filtered_lines) // 3)
        
        return min(estimated, 10)  # Cap à 10 étages
    
    def _calculate_confidence(
        self, 
        image: Image.Image, 
        colors: List[Dict],
        texture_score: float
    ) -> float:
        """
        Calcule un score de confiance pour l'analyse.
        """
        confidence = 50.0  # Base
        
        # Bonus pour bonne résolution
        min_dim = min(image.size)
        if min_dim >= 1000:
            confidence += 15
        elif min_dim >= 500:
            confidence += 10
        elif min_dim < 200:
            confidence -= 20
        
        # Bonus pour image bien exposée (pas trop sombre/claire)
        variance = next((c.get("value", 0) for c in colors if c.get("name") == "variance"), 0)
        if 500 < variance < 5000:
            confidence += 10
        
        # Bonus pour texture détectable
        if 10 < texture_score < 60:
            confidence += 10
        
        return min(95, max(20, confidence))
    
    def merge_analyses(self, analyses: List[Dict]) -> Dict[str, Any]:
        """
        Fusionne plusieurs analyses (photos multiples du même bien).
        
        Args:
            analyses: Liste des résultats d'analyse
            
        Returns:
            Analyse fusionnée avec confiance améliorée
        """
        if not analyses:
            return self._get_fallback_analysis()
        
        if len(analyses) == 1:
            return analyses[0]
        
        # Type de bien: vote majoritaire
        types = [a.get("type_bien", "inconnu") for a in analyses]
        type_bien = max(set(types), key=types.count)
        
        # État: moyenne des coefficients
        coefs = [a.get("coefficient_etat", 1.0) for a in analyses]
        avg_coef = sum(coefs) / len(coefs)
        
        # Trouver l'état correspondant au coefficient moyen
        etat = "bon"
        for state_key, state_info in self.STATES.items():
            if abs(state_info["coef"] - avg_coef) < 0.05:
                etat = state_key
                break
        
        # Étages: maximum détecté
        etages = max(a.get("nombre_etages_estime", 1) for a in analyses)
        
        # Confiance: boost car photos multiples
        base_confidence = max(a.get("score_confiance", 50) for a in analyses)
        boosted_confidence = min(95, base_confidence + len(analyses) * 5)
        
        return {
            "type_bien": type_bien,
            "type_bien_label": self.PROPERTY_TYPES.get(type_bien, "Inconnu"),
            "etat_exterieur": etat,
            "etat_label": self.STATES.get(etat, {}).get("label", "Non déterminé"),
            "coefficient_etat": avg_coef,
            "nombre_etages_estime": etages,
            "surface_estimee_vision": None,
            "score_confiance": boosted_confidence,
            "details": {
                "nombre_photos_analysees": len(analyses),
                "methode": "fusion_multi_photos",
                "analyses_individuelles": [a.get("score_confiance", 0) for a in analyses]
            },
            "date_analyse": datetime.now().isoformat()
        }
    
    def _get_fallback_analysis(self) -> Dict[str, Any]:
        """
        Analyse par défaut quand tout échoue.
        """
        return {
            "type_bien": "inconnu",
            "type_bien_label": "Type indéterminé",
            "etat_exterieur": "correct",
            "etat_label": "État standard (non déterminé)",
            "coefficient_etat": 1.0,
            "nombre_etages_estime": 1,
            "surface_estimee_vision": None,
            "score_confiance": 30.0,
            "details": {
                "methode": "fallback",
                "raison": "Analyse impossible"
            },
            "date_analyse": datetime.now().isoformat()
        }
    
    # Méthodes pour le mode ML (stubs)
    def _determine_property_type(self, detections) -> str:
        return "maison"
    
    def _determine_state(self, detections) -> str:
        return "bon"
    
    def _count_floors(self, detections) -> int:
        return 1
    
    def _estimate_visible_surface(self, detections, image_size) -> Optional[float]:
        return None

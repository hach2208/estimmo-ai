"""
Moteur d'Estimation - Calcul du prix immobilier
Fusionne les données cadastrales, DVF, DPE et vision pour produire une estimation
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import math


class EstimationEngine:
    """
    Moteur de calcul d'estimation immobilière.
    
    Algorithme:
    1. Récupérer le prix de base au m² (DVF)
    2. Ajuster selon l'état du bien (vision)
    3. Ajuster selon le DPE
    4. Calculer la surface habitable
    5. Produire estimation + intervalle de confiance
    """
    
    # Facteurs d'ajustement
    COEF_ETAGES = {
        1: 1.0,
        2: 1.05,
        3: 1.03,
        4: 1.02,
        5: 1.00,
    }  # Les maisons à étages valent légèrement plus
    
    # Ratio surface habitable / surface terrain par type
    RATIO_SURFACE = {
        "maison": 0.35,  # 35% du terrain en surface habitable
        "appartement": 1.0,  # Surface = surface habitable
        "immeuble": 0.60,  # 60% (plusieurs logements)
        "terrain": 0.0,  # Pas de bâti
        "local_commercial": 0.50,
        "inconnu": 0.30
    }
    
    # Ajustement saisonnier (marché immobilier)
    COEF_SAISON = {
        1: 0.98,   # Janvier - marché calme
        2: 0.99,
        3: 1.01,   # Printemps - reprise
        4: 1.02,
        5: 1.03,
        6: 1.02,
        7: 1.00,   # Été - vacances
        8: 0.99,
        9: 1.02,   # Rentrée - forte demande
        10: 1.01,
        11: 0.99,
        12: 0.98   # Fêtes
    }
    
    def calculate(
        self,
        cadastre: Dict[str, Any],
        dvf: Dict[str, Any],
        vision: Dict[str, Any],
        dpe: Optional[Dict[str, Any]] = None,
        multi_photo_boost: bool = False
    ) -> Dict[str, Any]:
        """
        Calcule l'estimation complète du bien.
        
        Args:
            cadastre: Données cadastrales
            dvf: Statistiques DVF
            vision: Analyse vision IA
            dpe: Données DPE (optionnel)
            multi_photo_boost: Boost de confiance si photos multiples
            
        Returns:
            Estimation complète avec prix, confiance, détails
        """
        # 1. Récupérer les données de base
        surface_terrain = cadastre.get("surface_terrain", 0)
        surface_batie_cadastre = cadastre.get("surface_batie")
        
        prix_m2_base = dvf.get("prix_m2_moyen", 3000)
        prix_m2_median = dvf.get("prix_m2_median", prix_m2_base)
        
        type_bien = vision.get("type_bien", "maison")
        etat = vision.get("etat_exterieur", "bon")
        coef_etat = vision.get("coefficient_etat", 1.0)
        etages = vision.get("nombre_etages_estime", 1)
        
        # 2. Calculer la surface habitable
        surface_habitable = self._calculate_surface_habitable(
            surface_terrain=surface_terrain,
            surface_batie=surface_batie_cadastre,
            type_bien=type_bien,
            etages=etages
        )
        
        # 3. Calculer les coefficients d'ajustement
        
        # Coefficient état (vision)
        coef_total = coef_etat
        
        # Coefficient étages
        coef_total *= self.COEF_ETAGES.get(min(etages, 5), 1.0)
        
        # Coefficient saisonnier
        mois_actuel = datetime.now().month
        coef_total *= self.COEF_SAISON.get(mois_actuel, 1.0)
        
        # Coefficient DPE
        coef_dpe = 1.0
        if dpe:
            classe_dpe = dpe.get("classe_energie")
            coef_dpe = self._get_dpe_coefficient(classe_dpe)
            coef_total *= coef_dpe
        
        # 4. Calculer le prix ajusté au m²
        prix_m2_ajuste = prix_m2_base * coef_total
        
        # 5. Calculer le prix total
        prix_total = surface_habitable * prix_m2_ajuste
        
        # 6. Calculer l'intervalle de confiance
        ecart_type = dvf.get("ecart_type", prix_m2_base * 0.15)
        marge_erreur = self._calculate_margin(
            ecart_type=ecart_type,
            nb_transactions=dvf.get("nb_transactions", 0),
            vision_confidence=vision.get("score_confiance", 50),
            has_dpe=dpe is not None
        )
        
        prix_bas = prix_total * (1 - marge_erreur)
        prix_haut = prix_total * (1 + marge_erreur)
        
        # 7. Calculer la confiance globale
        confiance = self._calculate_confidence(
            dvf=dvf,
            vision=vision,
            cadastre=cadastre,
            dpe=dpe,
            multi_photo=multi_photo_boost
        )
        
        # 8. Déterminer la qualité des données
        qualite = self._assess_data_quality(cadastre, dvf, vision, dpe)
        
        # 9. Générer les avertissements
        avertissements = self._generate_warnings(
            cadastre=cadastre,
            dvf=dvf,
            vision=vision,
            dpe=dpe,
            prix_total=prix_total
        )
        
        # 10. Construire la réponse
        return {
            # Surfaces
            "surface_terrain": surface_terrain,
            "surface_habitable_estimee": round(surface_habitable, 2),
            
            # Prix
            "prix_m2_secteur": round(prix_m2_base, 2),
            "prix_m2_ajuste": round(prix_m2_ajuste, 2),
            "prix_total_estime": round(prix_total, 0),
            
            # Fourchette
            "prix_bas": round(prix_bas, 0),
            "prix_haut": round(prix_haut, 0),
            
            # Qualité
            "confiance": round(confiance, 1),
            "qualite_donnees": qualite,
            
            # Détails
            "cadastre": self._format_cadastre(cadastre),
            "dvf": self._format_dvf(dvf),
            "dpe": self._format_dpe(dpe),
            "vision": self._format_vision(vision),
            
            # Méta
            "sources_utilisees": self._list_sources(cadastre, dvf, vision, dpe),
            "date_estimation": datetime.now().isoformat(),
            "avertissements": avertissements,
            
            # Détails calcul (pour debug/transparence)
            "details_calcul": {
                "coefficient_etat": coef_etat,
                "coefficient_dpe": coef_dpe,
                "coefficient_etages": self.COEF_ETAGES.get(min(etages, 5), 1.0),
                "coefficient_saison": self.COEF_SAISON.get(mois_actuel, 1.0),
                "coefficient_total": round(coef_total, 3),
                "marge_erreur_pct": round(marge_erreur * 100, 1)
            }
        }
    
    def _calculate_surface_habitable(
        self,
        surface_terrain: float,
        surface_batie: Optional[float],
        type_bien: str,
        etages: int
    ) -> float:
        """
        Calcule la surface habitable estimée.
        """
        # Si surface bâtie connue (cadastre), l'utiliser
        if surface_batie and surface_batie > 0:
            # Surface habitable ≈ 85% de la surface bâtie (murs, escaliers...)
            return surface_batie * 0.85 * max(1, etages)
        
        # Sinon, estimer à partir du terrain
        if surface_terrain > 0:
            ratio = self.RATIO_SURFACE.get(type_bien, 0.30)
            surface_base = surface_terrain * ratio
            
            # Ajuster selon les étages
            if type_bien == "maison":
                # Maison: surface au sol * étages * 0.8 (escaliers, combles)
                return surface_base * etages * 0.8
            else:
                return surface_base
        
        # Valeur par défaut si aucune donnée
        default_surfaces = {
            "maison": 100,
            "appartement": 70,
            "immeuble": 500,
            "terrain": 0,
            "local_commercial": 150,
            "inconnu": 80
        }
        
        return default_surfaces.get(type_bien, 80)
    
    def _get_dpe_coefficient(self, classe: Optional[str]) -> float:
        """
        Retourne le coefficient d'ajustement selon la classe DPE.
        Impact significatif sur la valeur depuis 2023.
        """
        coefficients = {
            "A": 1.08,   # +8%
            "B": 1.05,   # +5%
            "C": 1.02,   # +2%
            "D": 1.00,   # Référence
            "E": 0.95,   # -5%
            "F": 0.88,   # -12% (passoire thermique)
            "G": 0.82,   # -18% (passoire thermique + interdiction location)
        }
        return coefficients.get(classe, 1.0)
    
    def _calculate_margin(
        self,
        ecart_type: float,
        nb_transactions: int,
        vision_confidence: float,
        has_dpe: bool
    ) -> float:
        """
        Calcule la marge d'erreur relative.
        """
        # Marge de base (15%)
        marge = 0.15
        
        # Réduire si beaucoup de transactions
        if nb_transactions >= 20:
            marge -= 0.03
        elif nb_transactions >= 10:
            marge -= 0.02
        elif nb_transactions == 0:
            marge += 0.05
        
        # Réduire si bonne confiance vision
        if vision_confidence >= 80:
            marge -= 0.02
        elif vision_confidence < 50:
            marge += 0.03
        
        # Réduire si DPE disponible
        if has_dpe:
            marge -= 0.02
        
        # Bornes
        return max(0.08, min(0.30, marge))
    
    def _calculate_confidence(
        self,
        dvf: Dict,
        vision: Dict,
        cadastre: Dict,
        dpe: Optional[Dict],
        multi_photo: bool
    ) -> float:
        """
        Calcule le score de confiance global (0-100).
        """
        score = 40  # Base
        
        # DVF: nombre de transactions
        nb_trans = dvf.get("nb_transactions", 0)
        if nb_trans >= 20:
            score += 20
        elif nb_trans >= 10:
            score += 15
        elif nb_trans >= 5:
            score += 10
        elif nb_trans > 0:
            score += 5
        
        # Vision: confiance
        vision_conf = vision.get("score_confiance", 50)
        score += (vision_conf - 50) * 0.2  # ±10 points
        
        # Cadastre: données disponibles
        if cadastre.get("surface_terrain", 0) > 0:
            score += 5
        if cadastre.get("surface_batie"):
            score += 5
        if cadastre.get("annee_construction"):
            score += 3
        
        # DPE
        if dpe and dpe.get("classe_energie"):
            score += 7
        
        # Multi-photos
        if multi_photo:
            score += 5
        
        # Pénalité si données manquantes
        if dvf.get("source", "").startswith("Estimation"):
            score -= 10
        if cadastre.get("source") == "fallback":
            score -= 10
        
        return max(15, min(95, score))
    
    def _assess_data_quality(
        self,
        cadastre: Dict,
        dvf: Dict,
        vision: Dict,
        dpe: Optional[Dict]
    ) -> str:
        """
        Évalue la qualité globale des données.
        """
        points = 0
        max_points = 10
        
        # DVF
        if dvf.get("nb_transactions", 0) >= 10:
            points += 3
        elif dvf.get("nb_transactions", 0) > 0:
            points += 1
        
        # Cadastre
        if cadastre.get("surface_terrain", 0) > 0:
            points += 2
        if cadastre.get("source") != "fallback":
            points += 1
        
        # Vision
        if vision.get("score_confiance", 0) >= 70:
            points += 2
        elif vision.get("score_confiance", 0) >= 50:
            points += 1
        
        # DPE
        if dpe and dpe.get("classe_energie"):
            points += 2
        
        ratio = points / max_points
        
        if ratio >= 0.8:
            return "Excellente"
        elif ratio >= 0.6:
            return "Bonne"
        elif ratio >= 0.4:
            return "Moyenne"
        elif ratio >= 0.2:
            return "Limitée"
        else:
            return "Faible"
    
    def _generate_warnings(
        self,
        cadastre: Dict,
        dvf: Dict,
        vision: Dict,
        dpe: Optional[Dict],
        prix_total: float
    ) -> List[str]:
        """
        Génère des avertissements pour l'utilisateur.
        """
        warnings = []
        
        # DVF
        if dvf.get("nb_transactions", 0) == 0:
            warnings.append(
                "⚠️ Aucune transaction récente dans le secteur - "
                "estimation basée sur les moyennes régionales"
            )
        elif dvf.get("nb_transactions", 0) < 5:
            warnings.append(
                "⚠️ Peu de transactions comparables - précision limitée"
            )
        
        # Cadastre
        if cadastre.get("source") == "fallback":
            warnings.append(
                "⚠️ Données cadastrales non disponibles - "
                "surface estimée par analyse visuelle"
            )
        
        # Vision
        if vision.get("score_confiance", 0) < 50:
            warnings.append(
                "⚠️ Qualité d'image insuffisante - "
                "ajoutez des photos supplémentaires pour améliorer l'estimation"
            )
        
        # DPE
        if dpe:
            classe = dpe.get("classe_energie")
            if classe in ["F", "G"]:
                warnings.append(
                    f"⚠️ Passoire thermique (DPE {classe}) - "
                    "le bien nécessitera des travaux de rénovation énergétique"
                )
            if dpe.get("is_average"):
                warnings.append(
                    "ℹ️ DPE basé sur la moyenne du quartier - "
                    "un DPE réel peut modifier significativement l'estimation"
                )
        else:
            warnings.append(
                "ℹ️ DPE non disponible - l'estimation ne tient pas compte "
                "de la performance énergétique"
            )
        
        # Prix atypique
        prix_m2 = dvf.get("prix_m2_moyen", 3000)
        if prix_m2 < 1000:
            warnings.append(
                "ℹ️ Zone à prix très bas - vérifiez les opportunités "
                "mais aussi les contraintes locales"
            )
        elif prix_m2 > 8000:
            warnings.append(
                "ℹ️ Zone à prix élevé - le marché peut être volatile"
            )
        
        return warnings
    
    def _format_cadastre(self, cadastre: Dict) -> Dict:
        """Formate les données cadastrales pour la réponse."""
        return {
            "numero_parcelle": cadastre.get("numero_parcelle"),
            "section": cadastre.get("section"),
            "surface_terrain": cadastre.get("surface_terrain", 0),
            "surface_batie": cadastre.get("surface_batie"),
            "commune": cadastre.get("commune"),
            "code_insee": cadastre.get("code_insee"),
            "annee_construction": cadastre.get("annee_construction")
        }
    
    def _format_dvf(self, dvf: Dict) -> Dict:
        """Formate les données DVF pour la réponse."""
        return {
            "prix_m2_moyen": dvf.get("prix_m2_moyen", 0),
            "prix_m2_median": dvf.get("prix_m2_median", 0),
            "nb_transactions": dvf.get("nb_transactions", 0),
            "periode": dvf.get("periode", ""),
            "transactions_detail": dvf.get("transactions_detail", [])[:5]
        }
    
    def _format_dpe(self, dpe: Optional[Dict]) -> Optional[Dict]:
        """Formate les données DPE pour la réponse."""
        if not dpe:
            return None
        return {
            "classe_energie": dpe.get("classe_energie"),
            "classe_ges": dpe.get("classe_ges"),
            "consommation_energie": dpe.get("consommation_energie"),
            "estimation_ges": dpe.get("estimation_ges")
        }
    
    def _format_vision(self, vision: Dict) -> Dict:
        """Formate les données vision pour la réponse."""
        return {
            "type_bien": vision.get("type_bien"),
            "etat_exterieur": vision.get("etat_label", vision.get("etat_exterieur")),
            "nombre_etages_estime": vision.get("nombre_etages_estime", 1),
            "surface_estimee_vision": vision.get("surface_estimee_vision"),
            "score_confiance": vision.get("score_confiance", 50),
            "details": vision.get("details", {})
        }
    
    def _list_sources(
        self,
        cadastre: Dict,
        dvf: Dict,
        vision: Dict,
        dpe: Optional[Dict]
    ) -> List[str]:
        """Liste les sources utilisées pour l'estimation."""
        sources = []
        
        if cadastre.get("source") != "fallback":
            sources.append(f"Cadastre ({cadastre.get('source', 'APICarto IGN')})")
        
        sources.append(f"DVF ({dvf.get('source', 'Etalab')})")
        
        if dpe:
            sources.append(f"DPE ({dpe.get('source', 'ADEME')})")
        
        sources.append(f"Vision IA ({vision.get('details', {}).get('methode', 'heuristic')})")
        
        return sources

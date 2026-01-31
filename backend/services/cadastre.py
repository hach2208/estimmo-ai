"""
Service Cadastre - Accès aux données cadastrales françaises
Utilise l'API IGN (APICarto) et data.gouv.fr
"""

import httpx
from typing import Optional, Dict, Any
import json
from datetime import datetime


class CadastreService:
    """
    Service pour interroger les APIs cadastrales françaises:
    - APICarto IGN pour les parcelles
    - cadastre.data.gouv.fr pour les données complémentaires
    """
    
    # URLs des APIs
    APICARTO_URL = "https://apicarto.ign.fr/api/cadastre/parcelle"
    CADASTRE_GOUV_URL = "https://cadastre.data.gouv.fr/bundler/cadastre-etalab"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_parcelle(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Récupère les informations cadastrales d'une parcelle à partir des coordonnées GPS.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionnaire avec les infos cadastrales ou None si non trouvé
        """
        try:
            # 1. Requête APICarto avec géométrie Point
            geojson_point = {
                "type": "Point",
                "coordinates": [lon, lat]  # GeoJSON = [longitude, latitude]
            }
            
            params = {
                "geom": json.dumps(geojson_point)
            }
            
            response = await self.client.get(
                self.APICARTO_URL,
                params=params,
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"Erreur APICarto: {response.status_code} - {response.text}")
                return self._get_fallback_data(lat, lon)
            
            data = response.json()
            
            if not data.get("features") or len(data["features"]) == 0:
                print("Aucune parcelle trouvée aux coordonnées")
                return self._get_fallback_data(lat, lon)
            
            # Extraire les propriétés de la première parcelle
            feature = data["features"][0]
            props = feature.get("properties", {})
            geometry = feature.get("geometry", {})
            
            # Calcul de la surface si disponible dans la géométrie
            surface_calculee = self._calculate_surface_from_geometry(geometry)
            
            result = {
                "numero_parcelle": props.get("numero"),
                "section": props.get("section"),
                "prefixe": props.get("prefixe"),
                "code_commune": props.get("code_com") or props.get("commune"),
                "commune": props.get("nom_com") or props.get("commune"),
                "code_insee": props.get("code_insee") or props.get("code_dep", "") + props.get("code_com", ""),
                "code_departement": props.get("code_dep"),
                "surface_terrain": props.get("contenance", 0),  # Surface fiscale en m²
                "surface_batie": None,  # Nécessite une requête supplémentaire
                "annee_construction": None,
                "geometry": geometry,
                "surface_calculee": surface_calculee,
                "source": "APICarto IGN",
                "date_requete": datetime.now().isoformat()
            }
            
            # 2. Enrichir avec les données de la matrice cadastrale si disponible
            enriched = await self._enrich_with_batiments(result)
            
            return enriched
            
        except httpx.TimeoutException:
            print("Timeout lors de la requête cadastre")
            return self._get_fallback_data(lat, lon)
        except Exception as e:
            print(f"Erreur service cadastre: {e}")
            return self._get_fallback_data(lat, lon)
    
    async def _enrich_with_batiments(self, cadastre_data: Dict) -> Dict:
        """
        Enrichit les données avec les informations sur les bâtiments
        via l'API des bâtiments de la BD TOPO
        """
        try:
            # API Bâtiments IGN
            batiments_url = "https://apicarto.ign.fr/api/gpu/document"
            
            if cadastre_data.get("geometry"):
                params = {
                    "geom": json.dumps(cadastre_data["geometry"])
                }
                
                response = await self.client.get(batiments_url, params=params)
                
                if response.status_code == 200:
                    batiments = response.json()
                    if batiments.get("features"):
                        # Extraire les infos des bâtiments
                        for bat in batiments["features"]:
                            props = bat.get("properties", {})
                            if props.get("hauteur"):
                                # Estimer le nombre d'étages (3m par étage en moyenne)
                                hauteur = float(props["hauteur"])
                                cadastre_data["nombre_etages_cadastre"] = max(1, int(hauteur / 3))
            
            return cadastre_data
            
        except Exception as e:
            print(f"Erreur enrichissement bâtiments: {e}")
            return cadastre_data
    
    def _calculate_surface_from_geometry(self, geometry: Dict) -> Optional[float]:
        """
        Calcule la surface approximative à partir de la géométrie GeoJSON.
        Utilise une approximation en m² basée sur les coordonnées.
        """
        try:
            if geometry.get("type") != "Polygon":
                return None
            
            coords = geometry.get("coordinates", [[]])
            if not coords or not coords[0]:
                return None
            
            # Calcul simple de l'aire du polygone (formule de Shoelace)
            # Note: approximation car ne tient pas compte de la courbure terrestre
            ring = coords[0]
            n = len(ring)
            area = 0.0
            
            for i in range(n):
                j = (i + 1) % n
                area += ring[i][0] * ring[j][1]
                area -= ring[j][0] * ring[i][1]
            
            area = abs(area) / 2.0
            
            # Conversion degrés² en m² (approximation pour la France)
            # 1 degré ≈ 111km en latitude, ~80km en longitude (France)
            area_m2 = area * 111000 * 80000
            
            return round(area_m2, 2)
            
        except Exception as e:
            print(f"Erreur calcul surface: {e}")
            return None
    
    def _get_fallback_data(self, lat: float, lon: float) -> Dict:
        """
        Données de fallback quand l'API n'est pas disponible.
        Retourne une structure vide mais valide.
        """
        return {
            "numero_parcelle": None,
            "section": None,
            "commune": None,
            "code_insee": None,
            "surface_terrain": 0,
            "surface_batie": None,
            "annee_construction": None,
            "source": "fallback",
            "date_requete": datetime.now().isoformat(),
            "avertissement": "Données cadastrales non disponibles - estimation basée uniquement sur la vision et DVF"
        }
    
    def merge_with_manual(self, cadastre_data: Dict, manual_data: Dict) -> Dict:
        """
        Fusionne les données cadastrales avec des données saisies manuellement
        (mode expert pour agents immobiliers).
        
        Args:
            cadastre_data: Données issues de l'API
            manual_data: Données saisies par l'utilisateur
            
        Returns:
            Données fusionnées (manuel prioritaire)
        """
        merged = cadastre_data.copy()
        
        # Liste des champs que l'expert peut surcharger
        expert_fields = [
            "surface_terrain",
            "surface_batie",
            "surface_habitable",
            "annee_construction",
            "nombre_pieces",
            "nombre_etages",
            "type_chauffage",
            "etat_general",
            "travaux_recents"
        ]
        
        for field in expert_fields:
            if field in manual_data and manual_data[field] is not None:
                merged[field] = manual_data[field]
                merged[f"{field}_source"] = "manuel"
        
        merged["mode_expert"] = True
        
        return merged
    
    async def get_communes_proches(self, lat: float, lon: float, radius_km: float = 5) -> list:
        """
        Récupère les communes proches d'un point pour élargir la recherche DVF.
        """
        try:
            # Utiliser l'API Geo pour trouver les communes proches
            geo_url = "https://geo.api.gouv.fr/communes"
            params = {
                "lat": lat,
                "lon": lon,
                "fields": "nom,code,codesPostaux,population",
                "format": "json",
                "geometry": "centre"
            }
            
            response = await self.client.get(geo_url, params=params)
            
            if response.status_code == 200:
                return response.json()
            
            return []
            
        except Exception as e:
            print(f"Erreur communes proches: {e}")
            return []
    
    async def close(self):
        """Ferme le client HTTP"""
        await self.client.aclose()

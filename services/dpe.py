"""
Service DPE - Diagnostic de Performance Énergétique
Accès aux données ADEME sur les performances énergétiques des bâtiments
"""

import httpx
from typing import Optional, Dict, Any
from datetime import datetime


class DPEService:
    """
    Service pour récupérer les données DPE/DPE-Tertiaire.
    
    Source: ADEME - data.ademe.fr
    API: https://data.ademe.fr/datasets/dpe-v2-logements-existants
    """
    
    # URL de l'API ADEME
    ADEME_API_URL = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=20.0)
    
    async def get_dpe(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Recherche un DPE existant proche des coordonnées.
        
        Note: L'API ADEME ne permet pas une recherche spatiale directe,
        on utilise donc une approche par adresse ou code postal.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Informations DPE si disponibles
        """
        try:
            # D'abord, récupérer l'adresse depuis les coordonnées
            address_info = await self._reverse_geocode(lat, lon)
            
            if not address_info:
                return None
            
            # Chercher les DPE dans la même rue/quartier
            dpe_data = await self._search_dpe_by_address(address_info)
            
            if dpe_data:
                return self._format_dpe_response(dpe_data)
            
            # Fallback: moyenne du code postal
            return await self._get_postal_code_average(address_info.get("postcode"))
            
        except Exception as e:
            print(f"Erreur DPE: {e}")
            return None
    
    async def _reverse_geocode(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Convertit des coordonnées en adresse via l'API adresse.data.gouv.fr
        """
        try:
            url = "https://api-adresse.data.gouv.fr/reverse/"
            params = {
                "lat": lat,
                "lon": lon
            }
            
            response = await self.client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("features"):
                    props = data["features"][0]["properties"]
                    return {
                        "housenumber": props.get("housenumber"),
                        "street": props.get("street"),
                        "postcode": props.get("postcode"),
                        "city": props.get("city"),
                        "citycode": props.get("citycode")
                    }
            
            return None
            
        except Exception as e:
            print(f"Erreur reverse geocode: {e}")
            return None
    
    async def _search_dpe_by_address(self, address_info: Dict) -> Optional[Dict]:
        """
        Recherche un DPE correspondant à une adresse.
        """
        try:
            # Construction de la requête API ADEME
            params = {
                "size": 10,
                "q_mode": "simple"
            }
            
            # Filtrer par code postal et ville
            if address_info.get("postcode"):
                params["qs"] = f"code_postal:{address_info['postcode']}"
            
            response = await self.client.get(
                self.ADEME_API_URL,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if results:
                    # Retourner le DPE le plus récent
                    return max(
                        results,
                        key=lambda x: x.get("date_etablissement_dpe", ""),
                        default=None
                    )
            
            return None
            
        except Exception as e:
            print(f"Erreur recherche DPE: {e}")
            return None
    
    async def _get_postal_code_average(self, postcode: Optional[str]) -> Optional[Dict]:
        """
        Calcule une moyenne des DPE pour un code postal donné.
        Utile quand on ne trouve pas de DPE exact.
        """
        if not postcode:
            return None
        
        try:
            params = {
                "size": 100,
                "qs": f"code_postal:{postcode}",
                "select": "classe_consommation_energie,classe_estimation_ges,consommation_energie,estimation_ges"
            }
            
            response = await self.client.get(
                self.ADEME_API_URL,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if results:
                    # Calculer les moyennes
                    energies = [r.get("consommation_energie", 0) for r in results if r.get("consommation_energie")]
                    ges_values = [r.get("estimation_ges", 0) for r in results if r.get("estimation_ges")]
                    
                    # Classe la plus fréquente
                    classes = [r.get("classe_consommation_energie") for r in results if r.get("classe_consommation_energie")]
                    classe_freq = max(set(classes), key=classes.count) if classes else "D"
                    
                    classes_ges = [r.get("classe_estimation_ges") for r in results if r.get("classe_estimation_ges")]
                    classe_ges_freq = max(set(classes_ges), key=classes_ges.count) if classes_ges else "D"
                    
                    return {
                        "classe_energie": classe_freq,
                        "classe_ges": classe_ges_freq,
                        "consommation_energie": sum(energies) / len(energies) if energies else None,
                        "estimation_ges": sum(ges_values) / len(ges_values) if ges_values else None,
                        "source": f"Moyenne {len(results)} DPE - CP {postcode}",
                        "is_average": True
                    }
            
            return None
            
        except Exception as e:
            print(f"Erreur moyenne CP: {e}")
            return None
    
    def _format_dpe_response(self, dpe_data: Dict) -> Dict[str, Any]:
        """
        Formate les données DPE brutes en réponse standardisée.
        """
        return {
            "classe_energie": dpe_data.get("classe_consommation_energie"),
            "classe_ges": dpe_data.get("classe_estimation_ges"),
            "consommation_energie": dpe_data.get("consommation_energie"),  # kWh/m²/an
            "estimation_ges": dpe_data.get("estimation_ges"),  # kgCO2/m²/an
            "date_dpe": dpe_data.get("date_etablissement_dpe"),
            "type_batiment": dpe_data.get("type_batiment"),
            "annee_construction": dpe_data.get("annee_construction"),
            "surface_habitable": dpe_data.get("surface_habitable"),
            "type_energie_chauffage": dpe_data.get("type_energie_principale_chauffage"),
            "source": "ADEME DPE",
            "is_average": False,
            "date_requete": datetime.now().isoformat()
        }
    
    def get_classe_coefficient(self, classe: Optional[str]) -> float:
        """
        Retourne un coefficient d'ajustement du prix basé sur la classe DPE.
        
        Les passoires thermiques (F, G) décotent le bien,
        les bons DPE (A, B) le valorisent.
        """
        coefficients = {
            "A": 1.10,   # +10%
            "B": 1.05,   # +5%
            "C": 1.02,   # +2%
            "D": 1.00,   # Référence
            "E": 0.97,   # -3%
            "F": 0.90,   # -10% (passoire)
            "G": 0.85,   # -15% (passoire)
        }
        
        return coefficients.get(classe, 1.0)
    
    def get_classe_description(self, classe: Optional[str]) -> str:
        """
        Retourne une description textuelle de la classe DPE.
        """
        descriptions = {
            "A": "Excellent - Très performant énergétiquement",
            "B": "Très bon - Faible consommation",
            "C": "Bon - Performance satisfaisante",
            "D": "Moyen - Consommation standard",
            "E": "Médiocre - Consommation élevée",
            "F": "Passoire thermique - Travaux recommandés",
            "G": "Passoire thermique - Travaux nécessaires",
        }
        
        return descriptions.get(classe, "Non évalué")
    
    async def close(self):
        """Ferme le client HTTP"""
        await self.client.aclose()

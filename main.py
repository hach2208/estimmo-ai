"""
EstimImmo AI - Backend API
Application d'estimation immobilière automatisée
Utilise la vision par ordinateur, données cadastrales et DVF
"""

import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import io
import base64
from datetime import datetime

from services.cadastre import CadastreService
from services.dvf import DVFService
from services.dpe import DPEService
from services.vision import VisionAnalyzer
from services.estimation import EstimationEngine
from services.pdf_report import PDFReportGenerator

app = FastAPI(
    title="EstimImmo AI",
    description="API d'estimation immobilière automatisée par IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour l'app mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des services
cadastre_service = CadastreService()
dvf_service = DVFService()
dpe_service = DPEService()
vision_analyzer = VisionAnalyzer()
estimation_engine = EstimationEngine()
pdf_generator = PDFReportGenerator()


# ========== MODÈLES PYDANTIC ==========

class GeoLocation(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude GPS")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude GPS")


class CadastreInfo(BaseModel):
    numero_parcelle: Optional[str] = None
    section: Optional[str] = None
    surface_terrain: float = 0
    surface_batie: Optional[float] = None
    commune: Optional[str] = None
    code_insee: Optional[str] = None
    annee_construction: Optional[int] = None


class DVFStats(BaseModel):
    prix_m2_moyen: float
    prix_m2_median: float
    nb_transactions: int
    periode: str
    transactions_detail: Optional[List[dict]] = None


class DPEInfo(BaseModel):
    classe_energie: Optional[str] = None
    classe_ges: Optional[str] = None
    consommation_energie: Optional[float] = None
    estimation_ges: Optional[float] = None


class VisionAnalysis(BaseModel):
    type_bien: str
    etat_exterieur: str
    nombre_etages_estime: int
    surface_estimee_vision: Optional[float] = None
    score_confiance: float
    details: dict


class EstimationResult(BaseModel):
    # Données de base
    surface_terrain: float = Field(..., description="Surface du terrain en m²")
    surface_habitable_estimee: float = Field(..., description="Surface habitable estimée en m²")
    
    # Prix
    prix_m2_secteur: float = Field(..., description="Prix moyen au m² du secteur")
    prix_m2_ajuste: float = Field(..., description="Prix au m² ajusté selon l'état")
    prix_total_estime: float = Field(..., description="Prix total estimé en €")
    
    # Fourchette de prix
    prix_bas: float = Field(..., description="Estimation basse")
    prix_haut: float = Field(..., description="Estimation haute")
    
    # Confiance et qualité
    confiance: float = Field(..., ge=0, le=100, description="Niveau de confiance en %")
    qualite_donnees: str = Field(..., description="Qualité des données utilisées")
    
    # Détails
    cadastre: CadastreInfo
    dvf: DVFStats
    dpe: Optional[DPEInfo] = None
    vision: VisionAnalysis
    
    # Métadonnées
    sources_utilisees: List[str]
    date_estimation: str
    avertissements: List[str] = []


class MultiPhotoRequest(BaseModel):
    latitude: float
    longitude: float
    images_base64: List[str]
    mode_expert: bool = False
    donnees_manuelles: Optional[dict] = None


# ========== ENDPOINTS ==========

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "message": "Bienvenue sur EstimImmo AI",
        "version": "2.0.0",
        "endpoints": {
            "estimation": "/estimate",
            "multi_photos": "/estimate/multi",
            "cadastre": "/cadastre",
            "dvf": "/dvf",
            "rapport_pdf": "/report/pdf",
            "documentation": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "cadastre": "operational",
            "dvf": "operational",
            "vision": "operational"
        }
    }


@app.post("/estimate", response_model=EstimationResult)
async def estimate_property(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude GPS"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude GPS"),
    file: UploadFile = File(..., description="Photo du bien immobilier")
):
    """
    🏠 Endpoint principal d'estimation
    
    Reçoit une photo + coordonnées GPS et retourne une estimation complète.
    
    **Processus:**
    1. Analyse de l'image par vision IA
    2. Récupération données cadastrales
    3. Récupération transactions DVF
    4. Récupération DPE si disponible
    5. Calcul de l'estimation avec intervalle de confiance
    """
    try:
        # 1. Lecture et validation de l'image
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Fichier image vide")
        
        # Vérifier le type MIME
        content_type = file.content_type
        if content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Format d'image non supporté: {content_type}. Utilisez JPEG, PNG ou WebP."
            )
        
        # 2. Analyse Vision par IA
        vision_data = await vision_analyzer.analyze(image_bytes)
        
        # 3. Données Cadastrales
        cadastre_data = await cadastre_service.get_parcelle(latitude, longitude)
        
        # 4. Données DVF (transactions récentes)
        dvf_data = await dvf_service.get_stats(
            latitude, longitude, 
            radius_meters=500,
            months=12
        )
        
        # 5. Données DPE (optionnel)
        dpe_data = await dpe_service.get_dpe(latitude, longitude)
        
        # 6. Calcul de l'estimation
        estimation = estimation_engine.calculate(
            cadastre=cadastre_data,
            dvf=dvf_data,
            vision=vision_data,
            dpe=dpe_data
        )
        
        return estimation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur estimation: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'estimation: {str(e)}")


@app.post("/estimate/multi", response_model=EstimationResult)
async def estimate_multi_photos(request: MultiPhotoRequest):
    """
    📸 Estimation avec plusieurs photos
    
    Permet d'améliorer la précision en analysant plusieurs photos
    (extérieur + intérieur).
    
    **Mode Expert:** Permet d'ajouter des données manuelles connues
    (surface exacte, année construction, etc.)
    """
    try:
        if len(request.images_base64) == 0:
            raise HTTPException(status_code=400, detail="Au moins une image requise")
        
        if len(request.images_base64) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 images par estimation")
        
        # Décoder et analyser toutes les images
        all_vision_results = []
        for img_b64 in request.images_base64:
            try:
                image_bytes = base64.b64decode(img_b64)
                vision_result = await vision_analyzer.analyze(image_bytes)
                all_vision_results.append(vision_result)
            except Exception as e:
                print(f"Erreur décodage image: {e}")
                continue
        
        if not all_vision_results:
            raise HTTPException(status_code=400, detail="Aucune image valide")
        
        # Fusion des analyses vision
        vision_data = vision_analyzer.merge_analyses(all_vision_results)
        
        # Données cadastrales
        cadastre_data = await cadastre_service.get_parcelle(
            request.latitude, 
            request.longitude
        )
        
        # Mode expert: fusionner avec données manuelles
        if request.mode_expert and request.donnees_manuelles:
            cadastre_data = cadastre_service.merge_with_manual(
                cadastre_data, 
                request.donnees_manuelles
            )
        
        # DVF et DPE
        dvf_data = await dvf_service.get_stats(
            request.latitude, 
            request.longitude,
            radius_meters=500,
            months=12
        )
        dpe_data = await dpe_service.get_dpe(request.latitude, request.longitude)
        
        # Calcul final
        estimation = estimation_engine.calculate(
            cadastre=cadastre_data,
            dvf=dvf_data,
            vision=vision_data,
            dpe=dpe_data,
            multi_photo_boost=len(all_vision_results) > 1
        )
        
        return estimation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur estimation multi: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cadastre")
async def get_cadastre(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude")
):
    """
    🗺️ Récupérer les données cadastrales seules
    """
    data = await cadastre_service.get_parcelle(latitude, longitude)
    if not data:
        raise HTTPException(status_code=404, detail="Parcelle introuvable")
    return data


@app.get("/dvf")
async def get_dvf(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    radius: int = Query(500, ge=100, le=2000, description="Rayon en mètres")
):
    """
    💰 Récupérer les statistiques DVF du secteur
    """
    data = await dvf_service.get_stats(latitude, longitude, radius, months=12)
    return data


@app.post("/report/pdf")
async def generate_pdf_report(estimation: EstimationResult):
    """
    📄 Générer un rapport PDF professionnel
    """
    try:
        pdf_path = pdf_generator.generate(estimation)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"estimation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération PDF: {e}")


# ========== DÉMARRAGE ==========

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

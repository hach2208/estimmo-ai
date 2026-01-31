"""
Générateur de Rapport PDF - EstimImmo AI
Produit un rapport d'estimation professionnel au format PDF
"""

import os
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from io import BytesIO


class PDFReportGenerator:
    """
    Générateur de rapports PDF professionnels pour les estimations immobilières.
    """
    
    # Couleurs de la charte graphique
    PRIMARY_COLOR = colors.HexColor("#1E3A5F")  # Bleu foncé
    SECONDARY_COLOR = colors.HexColor("#4A90A4")  # Bleu clair
    ACCENT_COLOR = colors.HexColor("#E8B923")  # Or
    SUCCESS_COLOR = colors.HexColor("#27AE60")  # Vert
    WARNING_COLOR = colors.HexColor("#F39C12")  # Orange
    DANGER_COLOR = colors.HexColor("#E74C3C")  # Rouge
    TEXT_COLOR = colors.HexColor("#2C3E50")  # Gris foncé
    LIGHT_BG = colors.HexColor("#F8F9FA")  # Gris très clair
    
    def __init__(self, output_dir: str = "/tmp/estimmo_reports"):
        """
        Initialise le générateur.
        
        Args:
            output_dir: Répertoire de sortie pour les PDFs
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialiser les styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés."""
        
        # Titre principal
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=self.PRIMARY_COLOR,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Sous-titre
        self.styles.add(ParagraphStyle(
            name='SubTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=self.SECONDARY_COLOR,
            spaceAfter=15,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Section
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=self.PRIMARY_COLOR,
            spaceBefore=15,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            borderColor=self.PRIMARY_COLOR,
            borderWidth=0,
            borderPadding=5
        ))
        
        # Corps de texte
        self.styles.add(ParagraphStyle(
            name='BodyTextCustom',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=self.TEXT_COLOR,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Prix principal
        self.styles.add(ParagraphStyle(
            name='MainPrice',
            parent=self.styles['Normal'],
            fontSize=28,
            textColor=self.PRIMARY_COLOR,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=5
        ))
        
        # Petit texte
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_CENTER
        ))
        
        # Avertissement
        self.styles.add(ParagraphStyle(
            name='Warning',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=self.WARNING_COLOR,
            spaceAfter=5,
            fontName='Helvetica-Oblique'
        ))
    
    def generate(self, estimation: Dict[str, Any]) -> str:
        """
        Génère un rapport PDF complet.
        
        Args:
            estimation: Résultats de l'estimation
            
        Returns:
            Chemin du fichier PDF généré
        """
        # Nom du fichier
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"estimation_{timestamp}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        # Créer le document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Contenu
        story = []
        
        # 1. En-tête
        story.extend(self._build_header(estimation))
        
        # 2. Résumé de l'estimation
        story.extend(self._build_summary(estimation))
        
        # 3. Détails du bien
        story.extend(self._build_property_details(estimation))
        
        # 4. Analyse du marché
        story.extend(self._build_market_analysis(estimation))
        
        # 5. Performance énergétique
        if estimation.get("dpe"):
            story.extend(self._build_dpe_section(estimation))
        
        # 6. Méthodologie
        story.extend(self._build_methodology(estimation))
        
        # 7. Avertissements
        if estimation.get("avertissements"):
            story.extend(self._build_warnings(estimation))
        
        # 8. Pied de page
        story.extend(self._build_footer(estimation))
        
        # Générer le PDF
        doc.build(story)
        
        return filepath
    
    def _build_header(self, estimation: Dict) -> list:
        """Construit l'en-tête du rapport."""
        elements = []
        
        # Logo/Titre
        elements.append(Paragraph(
            "ESTIMMO AI",
            self.styles['MainTitle']
        ))
        
        elements.append(Paragraph(
            "Rapport d'Estimation Immobilière",
            self.styles['SubTitle']
        ))
        
        # Date
        date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
        elements.append(Paragraph(
            f"Généré le {date_str}",
            self.styles['SmallText']
        ))
        
        elements.append(Spacer(1, 20))
        
        # Ligne de séparation
        elements.append(HRFlowable(
            width="100%",
            thickness=2,
            color=self.PRIMARY_COLOR,
            spaceBefore=5,
            spaceAfter=20
        ))
        
        return elements
    
    def _build_summary(self, estimation: Dict) -> list:
        """Construit le résumé de l'estimation."""
        elements = []
        
        # Prix principal
        prix = estimation.get("prix_total_estime", 0)
        elements.append(Paragraph(
            f"{prix:,.0f} €".replace(",", " "),
            self.styles['MainPrice']
        ))
        
        # Fourchette
        prix_bas = estimation.get("prix_bas", 0)
        prix_haut = estimation.get("prix_haut", 0)
        elements.append(Paragraph(
            f"Fourchette : {prix_bas:,.0f} € - {prix_haut:,.0f} €".replace(",", " "),
            self.styles['SmallText']
        ))
        
        elements.append(Spacer(1, 15))
        
        # Tableau récapitulatif
        data = [
            ["Surface terrain", f"{estimation.get('surface_terrain', 0):,.0f} m²".replace(",", " ")],
            ["Surface habitable estimée", f"{estimation.get('surface_habitable_estimee', 0):,.0f} m²".replace(",", " ")],
            ["Prix au m² secteur", f"{estimation.get('prix_m2_secteur', 0):,.0f} €/m²".replace(",", " ")],
            ["Prix au m² ajusté", f"{estimation.get('prix_m2_ajuste', 0):,.0f} €/m²".replace(",", " ")],
            ["Confiance", f"{estimation.get('confiance', 0):.0f}%"],
            ["Qualité des données", estimation.get('qualite_donnees', 'N/A')]
        ]
        
        table = Table(data, colWidths=[8*cm, 6*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.LIGHT_BG),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_property_details(self, estimation: Dict) -> list:
        """Construit la section détails du bien."""
        elements = []
        
        elements.append(Paragraph(
            "📋 Détails du Bien",
            self.styles['SectionTitle']
        ))
        
        cadastre = estimation.get("cadastre", {})
        vision = estimation.get("vision", {})
        
        # Informations cadastrales
        elements.append(Paragraph(
            "<b>Informations cadastrales</b>",
            self.styles['BodyText']
        ))
        
        cadastre_info = []
        if cadastre.get("commune"):
            cadastre_info.append(f"Commune : {cadastre['commune']}")
        if cadastre.get("numero_parcelle"):
            cadastre_info.append(f"Parcelle : Section {cadastre.get('section', '')} N°{cadastre['numero_parcelle']}")
        if cadastre.get("code_insee"):
            cadastre_info.append(f"Code INSEE : {cadastre['code_insee']}")
        if cadastre.get("annee_construction"):
            cadastre_info.append(f"Année de construction : {cadastre['annee_construction']}")
        
        for info in cadastre_info:
            elements.append(Paragraph(f"• {info}", self.styles['BodyText']))
        
        elements.append(Spacer(1, 10))
        
        # Analyse visuelle
        elements.append(Paragraph(
            "<b>Analyse visuelle (IA)</b>",
            self.styles['BodyText']
        ))
        
        vision_info = [
            f"Type de bien : {vision.get('type_bien', 'Non déterminé')}",
            f"État extérieur : {vision.get('etat_exterieur', 'Non déterminé')}",
            f"Nombre d'étages estimé : {vision.get('nombre_etages_estime', 'N/A')}",
            f"Confiance de l'analyse : {vision.get('score_confiance', 0):.0f}%"
        ]
        
        for info in vision_info:
            elements.append(Paragraph(f"• {info}", self.styles['BodyText']))
        
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_market_analysis(self, estimation: Dict) -> list:
        """Construit la section analyse du marché."""
        elements = []
        
        elements.append(Paragraph(
            "📊 Analyse du Marché Local",
            self.styles['SectionTitle']
        ))
        
        dvf = estimation.get("dvf", {})
        
        # Statistiques
        data = [
            ["Indicateur", "Valeur"],
            ["Prix moyen au m²", f"{dvf.get('prix_m2_moyen', 0):,.0f} €".replace(",", " ")],
            ["Prix médian au m²", f"{dvf.get('prix_m2_median', 0):,.0f} €".replace(",", " ")],
            ["Transactions analysées", str(dvf.get('nb_transactions', 0))],
            ["Période", dvf.get('periode', 'N/A')]
        ]
        
        table = Table(data, colWidths=[7*cm, 5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.TEXT_COLOR),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        
        elements.append(table)
        
        # Transactions récentes
        transactions = dvf.get('transactions_detail', [])
        if transactions:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(
                "<b>Transactions récentes comparables</b>",
                self.styles['BodyText']
            ))
            
            trans_data = [["Date", "Surface", "Prix", "Prix/m²"]]
            for t in transactions[:5]:
                trans_data.append([
                    t.get('date', 'N/A')[:10] if t.get('date') else 'N/A',
                    f"{t.get('surface', 0):.0f} m²",
                    f"{t.get('prix', 0):,.0f} €".replace(",", " "),
                    f"{t.get('prix_m2', 0):,.0f} €".replace(",", " ")
                ])
            
            trans_table = Table(trans_data, colWidths=[3*cm, 3*cm, 4*cm, 3*cm])
            trans_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.SECONDARY_COLOR),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6)
            ]))
            
            elements.append(trans_table)
        
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_dpe_section(self, estimation: Dict) -> list:
        """Construit la section DPE."""
        elements = []
        
        elements.append(Paragraph(
            "🌿 Performance Énergétique",
            self.styles['SectionTitle']
        ))
        
        dpe = estimation.get("dpe", {})
        
        classe_energie = dpe.get("classe_energie", "N/A")
        classe_ges = dpe.get("classe_ges", "N/A")
        
        # Couleurs DPE
        dpe_colors = {
            "A": "#319834", "B": "#33CC31", "C": "#CBFC34",
            "D": "#FCFC32", "E": "#FCCC00", "F": "#FC9900", "G": "#FC0000"
        }
        
        data = [
            ["Classe énergie", classe_energie],
            ["Classe GES", classe_ges],
            ["Consommation", f"{dpe.get('consommation_energie', 'N/A')} kWh/m²/an" if dpe.get('consommation_energie') else "N/A"],
            ["Émissions GES", f"{dpe.get('estimation_ges', 'N/A')} kgCO₂/m²/an" if dpe.get('estimation_ges') else "N/A"]
        ]
        
        table = Table(data, colWidths=[6*cm, 6*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.LIGHT_BG),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_methodology(self, estimation: Dict) -> list:
        """Construit la section méthodologie."""
        elements = []
        
        elements.append(Paragraph(
            "📐 Méthodologie",
            self.styles['SectionTitle']
        ))
        
        elements.append(Paragraph(
            "Cette estimation a été calculée en combinant plusieurs sources de données :",
            self.styles['BodyText']
        ))
        
        for source in estimation.get("sources_utilisees", []):
            elements.append(Paragraph(f"• {source}", self.styles['BodyText']))
        
        # Détails du calcul
        details = estimation.get("details_calcul", {})
        if details:
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(
                "<b>Coefficients appliqués :</b>",
                self.styles['BodyText']
            ))
            
            coefs = [
                f"État du bien : {details.get('coefficient_etat', 1.0):.2f}",
                f"DPE : {details.get('coefficient_dpe', 1.0):.2f}",
                f"Étages : {details.get('coefficient_etages', 1.0):.2f}",
                f"Saisonnalité : {details.get('coefficient_saison', 1.0):.2f}",
                f"<b>Coefficient total : {details.get('coefficient_total', 1.0):.3f}</b>"
            ]
            
            for coef in coefs:
                elements.append(Paragraph(f"• {coef}", self.styles['BodyText']))
        
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_warnings(self, estimation: Dict) -> list:
        """Construit la section avertissements."""
        elements = []
        
        elements.append(Paragraph(
            "⚠️ Points d'Attention",
            self.styles['SectionTitle']
        ))
        
        for warning in estimation.get("avertissements", []):
            elements.append(Paragraph(warning, self.styles['Warning']))
        
        elements.append(Spacer(1, 15))
        
        return elements
    
    def _build_footer(self, estimation: Dict) -> list:
        """Construit le pied de page."""
        elements = []
        
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=colors.lightgrey,
            spaceBefore=20,
            spaceAfter=10
        ))
        
        disclaimer = """
        <b>Avertissement légal :</b> Cette estimation est fournie à titre indicatif uniquement 
        et ne constitue pas une évaluation officielle. Les valeurs réelles peuvent varier 
        significativement en fonction de facteurs non pris en compte dans cette analyse 
        (état intérieur détaillé, travaux récents, spécificités locales, etc.). 
        Pour une évaluation précise, consultez un expert immobilier agréé.
        """
        
        elements.append(Paragraph(disclaimer, self.styles['SmallText']))
        
        elements.append(Spacer(1, 10))
        
        elements.append(Paragraph(
            f"Rapport généré par EstimImmo AI - {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            self.styles['SmallText']
        ))
        
        return elements

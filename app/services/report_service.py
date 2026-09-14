import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.config import REPORTS_DIR, BASE_DIR
from app.database.models import Analysis, DetectionResult

class ReportService:
    @classmethod
    def generate_json_report(cls, analysis: Analysis, result: DetectionResult) -> Dict[str, Any]:
        """Generates standard analytical JSON report."""
        return {
            "metadata": {
                "report_id": f"REP-{analysis.analysis_id[:8].upper()}",
                "generated_at": datetime.utcnow().isoformat(),
                "system": "Multimodel Deepfake and AI Generated Content Detector v2.2",
            },
            "media_profile": {
                "analysis_id": analysis.analysis_id,
                "original_filename": analysis.original_filename,
                "media_type": analysis.media_type,
                "file_size_bytes": analysis.file_size,
                "duration_seconds": analysis.duration,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
            },
            "detection_results": {
                "final_decision": result.final_decision,
                "fused_score": result.fused_score,
                "confidence_percent": round(result.fused_score * 100, 2),
                "visual_score": result.visual_score,
                "audio_score": result.audio_score,
                "text_score": result.text_score,
                "model_versions": result.model_versions,
                "timeline_data": result.timeline_data,
                "heatmap_evidence": result.heatmap_paths
            },
            "detection_rationale": result.explanation_text
        }

    @classmethod
    def generate_pdf_report(cls, analysis: Analysis, result: DetectionResult) -> str:
        """Generates a professional verification PDF report using ReportLab."""
        pdf_filename = f"verification_report_{analysis.analysis_id[:8]}.pdf"
        pdf_path = REPORTS_DIR / pdf_filename

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#475569")
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#1e293b")
        )

        elements = []

        # Header Title
        elements.append(Paragraph("MULTIMODEL DEEPFAKE & AI GENERATED CONTENT DETECTOR", title_style))
        elements.append(Paragraph("Comprehensive Verification & Authenticity Assessment Report", subtitle_style))
        elements.append(Spacer(1, 12))

        # Decision Badge Coloring
        if result.final_decision == "Likely Fake":
            badge_color = colors.HexColor("#ef4444")
            decision_text = f"LIKELY FAKE / SYNTHETIC ({result.fused_score*100:.1f}%)"
        elif result.final_decision == "Real":
            badge_color = colors.HexColor("#10b981")
            decision_text = f"AUTHENTIC / REAL ({(1 - result.fused_score)*100:.1f}%)"
        else:
            badge_color = colors.HexColor("#f59e0b")
            decision_text = f"SUSPICIOUS / INCONCLUSIVE ({result.fused_score*100:.1f}%)"

        verdict_data = [
            [Paragraph("<b>OVERALL VERDICT:</b>", styles["Normal"]), Paragraph(f"<b>{decision_text}</b>", ParagraphStyle("B", parent=styles["Normal"], textColor=badge_color, fontSize=11))],
            [Paragraph("<b>Analysis ID:</b>", styles["Normal"]), Paragraph(analysis.analysis_id, styles["Normal"])],
            [Paragraph("<b>Target File:</b>", styles["Normal"]), Paragraph(analysis.original_filename, styles["Normal"])],
            [Paragraph("<b>Media Modality:</b>", styles["Normal"]), Paragraph(analysis.media_type.upper(), styles["Normal"])],
            [Paragraph("<b>Date of Evaluation:</b>", styles["Normal"]), Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), styles["Normal"])]
        ]

        verdict_table = Table(verdict_data, colWidths=[130, 410])
        verdict_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(verdict_table)
        elements.append(Spacer(1, 14))

        # Modality Score Breakdown Table
        elements.append(Paragraph("1. Modality Confidence Metrics", section_style))
        scores_data = [
            ["Modality", "Assessed Score (0.0 - 1.0)", "Classification", "Engine Version"]
        ]

        v_score_str = f"{result.visual_score:.3f}" if result.visual_score is not None else "N/A"
        v_class = "High Risk" if result.visual_score and result.visual_score >= 0.65 else ("Suspicious" if result.visual_score and result.visual_score >= 0.35 else "Natural / Authentic")
        v_version = (result.model_versions or {}).get("visual_detector", "ResNet-GradCAM-v2.1")
        scores_data.append(["Visual (Video/Face)", v_score_str, v_class, v_version])

        a_score_str = f"{result.audio_score:.3f}" if result.audio_score is not None else "N/A"
        a_class = "High Risk" if result.audio_score and result.audio_score >= 0.65 else ("Suspicious" if result.audio_score and result.audio_score >= 0.35 else "Natural / Authentic")
        a_version = (result.model_versions or {}).get("audio_detector", "SpectralFlux-v1.4")
        scores_data.append(["Audio (Voice/Spectrogram)", a_score_str, a_class, a_version])

        t_score_str = f"{result.text_score:.3f}" if result.text_score is not None else "N/A"
        t_class = "High Risk" if result.text_score and result.text_score >= 0.65 else ("Suspicious" if result.text_score and result.text_score >= 0.35 else "Natural / Authentic")
        t_version = (result.model_versions or {}).get("text_detector", "Perplexity-Burstiness-v1.8")
        scores_data.append(["Text (NLP/Perplexity)", t_score_str, t_class, t_version])

        score_table = Table(scores_data, colWidths=[140, 140, 120, 140])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 14))

        # Detection Rationale
        elements.append(Paragraph("2. Detection Findings & Key Evidence", section_style))
        for line in result.explanation_text.split("\n"):
            if line.strip():
                elements.append(Paragraph(line.strip(), body_style))
                elements.append(Spacer(1, 3))
        elements.append(Spacer(1, 12))

        # Heatmap Evidence Embed (if any)
        if result.heatmap_paths and isinstance(result.heatmap_paths, list):
            elements.append(Paragraph("3. Spatial Activation Map (Grad-CAM Evidence)", section_style))
            evidence_rows = []
            for item in result.heatmap_paths[:2]:
                overlay_rel = item.get("overlay_url", "")
                if overlay_rel.startswith("/"):
                    overlay_rel = overlay_rel[1:]
                local_path = BASE_DIR / overlay_rel
                if local_path.exists():
                    try:
                        img = RLImage(str(local_path), width=2.5 * inch, height=2.0 * inch)
                        caption = Paragraph(f"<b>Timestamp: {item.get('timestamp', 0.0)}s</b><br/>Grad-CAM Activation Score: {item.get('score', 0.0):.2f}", styles["Normal"])
                        evidence_rows.append([img, caption])
                    except Exception:
                        pass

            if evidence_rows:
                ev_table = Table(evidence_rows, colWidths=[200, 340])
                ev_table.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(ev_table)

        elements.append(Spacer(1, 18))
        elements.append(Paragraph(
            "<b>Note:</b> This verification assessment is generated by the Multimodel Deepfake and AI Generated Content Detector using spatial, acoustic, and statistical heuristics.",
            ParagraphStyle("Disclaimer", parent=styles["Normal"], fontSize=7.5, textColor=colors.HexColor("#64748b"))
        ))

        doc.build(elements)
        return str(pdf_path)

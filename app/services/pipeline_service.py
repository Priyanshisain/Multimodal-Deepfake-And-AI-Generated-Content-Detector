import cv2
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.config import HEATMAPS_DIR, MODEL_VERSIONS
from app.database.models import Analysis, DetectionResult
from app.models.visual_detector import VisualDeepfakeDetector
from app.models.audio_detector import AudioDeepfakeDetector
from app.models.text_detector import TextDeepfakeDetector
from app.models.fusion import MultimodalLateFusion
from app.models.explainer import DetectionExplainer
from app.services.media_service import MediaService

class PipelineService:
    def __init__(self):
        self.visual_detector = VisualDeepfakeDetector()
        self.audio_detector = AudioDeepfakeDetector()
        self.text_detector = TextDeepfakeDetector()
        self.fusion_engine = MultimodalLateFusion()
        self.explainer = DetectionExplainer()

    def save_heatmap_frames(self, top_frames: List[Dict]) -> List[Dict]:
        """Saves generated Grad-CAM heatmap overlays and standalone heatmaps to disk."""
        now = datetime.utcnow()
        out_dir = HEATMAPS_DIR / f"{now.year:04d}" / f"{now.month:02d}"
        out_dir.mkdir(parents=True, exist_ok=True)

        saved = []
        for idx, item in enumerate(top_frames):
            frame_id = str(uuid.uuid4())[:8]
            overlay_name = f"overlay_{frame_id}.jpg"
            heatmap_name = f"heatmap_{frame_id}.jpg"

            overlay_path = out_dir / overlay_name
            heatmap_path = out_dir / heatmap_name

            cv2.imwrite(str(overlay_path), item["overlay"])
            cv2.imwrite(str(heatmap_path), item["heatmap"])

            saved.append({
                "timestamp": item["timestamp"],
                "score": item["score"],
                "overlay_url": f"/storage/heatmaps/{now.year:04d}/{now.month:02d}/{overlay_name}",
                "heatmap_url": f"/storage/heatmaps/{now.year:04d}/{now.month:02d}/{heatmap_name}"
            })
        return saved

    def process_analysis(self, analysis_id: str, db: Session, text_content: Optional[str] = None) -> DetectionResult:
        """
        Executes end-to-end multimodal pipeline for an analysis record.
        """
        analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")

        analysis.status = "processing"
        db.commit()

        visual_score = None
        audio_score = None
        text_score = None
        timeline_data = []
        visual_anomalies = []
        audio_anomalies = []
        text_anomalies = []
        heatmap_paths = []

        try:
            # 1. Visual Modality
            if analysis.media_type in ("video", "multimodal"):
                video_res = self.visual_detector.analyze_video(analysis.file_path)
                visual_score = video_res["visual_score"]
                timeline_data.extend(video_res["timeline"])
                visual_anomalies = video_res["anomalies"]
                analysis.duration = video_res.get("duration")
                if video_res.get("top_frames"):
                    heatmap_paths = self.save_heatmap_frames(video_res["top_frames"])

                # Check if video contains an audio track
                extracted_audio = MediaService.extract_audio_from_video(analysis.file_path)
                if extracted_audio:
                    audio_res = self.audio_detector.analyze_audio(extracted_audio)
                    audio_score = audio_res["audio_score"]
                    audio_anomalies = audio_res["anomalies"]
                    # Merge audio timeline tags
                    for a_seg in audio_res["timeline"]:
                        timeline_data.append({
                            "timestamp": a_seg["timestamp"],
                            "score": a_seg["score"],
                            "is_suspicious": a_seg["is_suspicious"],
                            "modality": "audio"
                        })

            # 2. Image Modality (direct image upload)
            elif analysis.media_type == "image":
                img = cv2.imread(analysis.file_path)
                if img is None:
                    raise ValueError(f"Failed to read image file at {analysis.file_path}")
                img_res = self.visual_detector.analyze_frame(img)
                visual_score = img_res["score"]
                visual_anomalies = img_res["anomalies"]
                timeline_data.append({
                    "timestamp": 0.0,
                    "score": visual_score,
                    "is_suspicious": visual_score >= 0.5,
                    "modality": "image"
                })
                heatmap_paths = self.save_heatmap_frames([{
                    "timestamp": 0.0,
                    "score": visual_score,
                    "overlay": img_res["overlay_frame"],
                    "heatmap": img_res["heatmap_frame"]
                }])
                analysis.duration = 0.0

            # 3. Audio Modality (direct audio upload)
            elif analysis.media_type == "audio":
                audio_res = self.audio_detector.analyze_audio(analysis.file_path)
                audio_score = audio_res["audio_score"]
                timeline_data = audio_res["timeline"]
                audio_anomalies = audio_res["anomalies"]
                analysis.duration = audio_res.get("duration")

            # 4. Text Modality
            if analysis.media_type == "text" or text_content:
                text_to_eval = text_content
                if not text_to_eval and analysis.file_path and Path(analysis.file_path).exists():
                    try:
                        with open(analysis.file_path, "r", encoding="utf-8", errors="ignore") as f:
                            text_to_eval = f.read()
                    except Exception:
                        text_to_eval = ""

                if text_to_eval:
                    text_res = self.text_detector.analyze_text(text_to_eval)
                    text_score = text_res["text_score"]
                    text_anomalies = text_res["anomalies"]

            # 4. Multimodal Late Fusion with Cross-Modal Consistency Check
            visual_motion = video_res.get("motion_deltas") if "video_res" in locals() else None
            audio_energy = audio_res.get("energy_envelope") if "audio_res" in locals() else None

            fused_score, final_decision, effective_weights, cross_modal_anomaly = self.fusion_engine.fuse(
                visual_score=visual_score,
                audio_score=audio_score,
                text_score=text_score,
                visual_motion=visual_motion,
                audio_energy=audio_energy
            )

            if cross_modal_anomaly:
                visual_anomalies.append(cross_modal_anomaly)

            # 5. Natural Language Detection Explainer
            explanation = self.explainer.generate_explanation(
                decision=final_decision,
                fused_score=fused_score,
                visual_score=visual_score,
                audio_score=audio_score,
                text_score=text_score,
                visual_anomalies=visual_anomalies,
                audio_anomalies=audio_anomalies,
                text_anomalies=text_anomalies
            )

            # 6. Persist Result
            detection_result = DetectionResult(
                result_id=str(uuid.uuid4()),
                analysis_id=analysis.analysis_id,
                visual_score=visual_score,
                audio_score=audio_score,
                text_score=text_score,
                fused_score=fused_score,
                final_decision=final_decision,
                explanation_text=explanation,
                model_versions=MODEL_VERSIONS,
                heatmap_paths=heatmap_paths,
                timeline_data=timeline_data
            )

            analysis.status = "completed"
            analysis.completed_at = datetime.utcnow()
            db.add(detection_result)
            db.commit()
            db.refresh(detection_result)
            return detection_result

        except Exception as e:
            analysis.status = "failed"
            db.commit()
            raise e

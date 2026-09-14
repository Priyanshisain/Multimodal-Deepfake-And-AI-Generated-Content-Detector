import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user
from app.database.models import Analysis, DetectionResult, User
from app.services.media_service import MediaService
from app.services.pipeline_service import PipelineService
from app.config import UPLOADS_DIR

router = APIRouter(prefix="/api/analyze", tags=["analysis"])
pipeline = PipelineService()

@router.post("/upload")
async def upload_and_analyze(
    file: Optional[UploadFile] = File(None),
    text_input: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Accepts media upload (video, audio, or text file) or raw text input,
    saves to structured disk storage, and triggers multimodal detection analysis.
    """
    if not file and not text_input:
        raise HTTPException(status_code=400, detail="Either a media file or text content must be provided.")

    saved_file_path = ""
    file_size = 0
    orig_name = "text_prompt.txt"
    media_type = "text"

    if file:
        media_type, saved_file_path, file_size, orig_name = await MediaService.save_upload(file)

    if text_input and not file:
        # Save raw text to file on disk
        target_path = MediaService.get_storage_path(".txt")
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(text_input)
        saved_file_path = str(target_path)
        file_size = len(text_input.encode("utf-8"))
        orig_name = "direct_text_input.txt"
        media_type = "text"
    elif file and text_input:
        # Multimodal combo
        media_type = "multimodal"

    analysis_id = str(uuid.uuid4())
    analysis = Analysis(
        analysis_id=analysis_id,
        user_id=current_user.user_id if current_user else None,
        media_type=media_type,
        original_filename=orig_name,
        file_path=saved_file_path,
        file_size=file_size,
        status="pending"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Process immediately and return completed results
    try:
        detection_result = pipeline.process_analysis(analysis_id, db, text_content=text_input)
        return {
            "status": "completed",
            "analysis_id": analysis.analysis_id,
            "media_type": analysis.media_type,
            "filename": analysis.original_filename,
            "duration": analysis.duration,
            "result": {
                "final_decision": detection_result.final_decision,
                "fused_score": detection_result.fused_score,
                "confidence_percent": round(detection_result.fused_score * 100, 1),
                "visual_score": detection_result.visual_score,
                "audio_score": detection_result.audio_score,
                "text_score": detection_result.text_score,
                "explanation": detection_result.explanation_text,
                "timeline_data": detection_result.timeline_data,
                "heatmap_paths": detection_result.heatmap_paths,
                "model_versions": detection_result.model_versions
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")


@router.get("/{analysis_id}/status")
def get_analysis_status(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieves current status and detection details of an analysis."""
    analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    res = None
    if analysis.result:
        res = {
            "final_decision": analysis.result.final_decision,
            "fused_score": analysis.result.fused_score,
            "confidence_percent": round(analysis.result.fused_score * 100, 1),
            "visual_score": analysis.result.visual_score,
            "audio_score": analysis.result.audio_score,
            "text_score": analysis.result.text_score,
            "explanation": analysis.result.explanation_text,
            "timeline_data": analysis.result.timeline_data,
            "heatmap_paths": analysis.result.heatmap_paths,
            "model_versions": analysis.result.model_versions
        }

    return {
        "analysis_id": analysis.analysis_id,
        "status": analysis.status,
        "media_type": analysis.media_type,
        "original_filename": analysis.original_filename,
        "file_size": analysis.file_size,
        "duration": analysis.duration,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
        "result": res
    }

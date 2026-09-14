from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.database.models import Analysis, DetectionResult, User

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("")
def list_history(
    media_type: Optional[str] = Query(None, description="Filter by video, audio, text, or multimodal"),
    decision: Optional[str] = Query(None, description="Filter by Real, Likely Fake, or Suspicious"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns paginated list of previous analyses for the authenticated user.
    """
    query = db.query(Analysis).join(DetectionResult, isouter=True).filter(Analysis.user_id == current_user.user_id)

    if media_type:
        query = query.filter(Analysis.media_type == media_type.lower())
    if decision:
        query = query.filter(DetectionResult.final_decision == decision)

    total_count = query.count()
    records = query.order_by(desc(Analysis.created_at)).offset(offset).limit(limit).all()

    items = []
    for a in records:
        res = a.result
        items.append({
            "analysis_id": a.analysis_id,
            "media_type": a.media_type,
            "original_filename": a.original_filename,
            "file_size": a.file_size,
            "duration": a.duration,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "final_decision": res.final_decision if res else None,
            "fused_score": res.fused_score if res else None,
            "visual_score": res.visual_score if res else None,
            "audio_score": res.audio_score if res else None,
            "text_score": res.text_score if res else None,
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": items
    }


@router.get("/{analysis_id}")
def get_history_detail(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieves full case details for a given analysis record."""
    analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    res = analysis.result
    return {
        "analysis_id": analysis.analysis_id,
        "media_type": analysis.media_type,
        "original_filename": analysis.original_filename,
        "file_size": analysis.file_size,
        "duration": analysis.duration,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
        "result": {
            "final_decision": res.final_decision if res else None,
            "fused_score": res.fused_score if res else None,
            "visual_score": res.visual_score if res else None,
            "audio_score": res.audio_score if res else None,
            "text_score": res.text_score if res else None,
            "explanation": res.explanation_text if res else None,
            "timeline_data": res.timeline_data if res else [],
            "heatmap_paths": res.heatmap_paths if res else [],
            "model_versions": res.model_versions if res else {}
        } if res else None
    }

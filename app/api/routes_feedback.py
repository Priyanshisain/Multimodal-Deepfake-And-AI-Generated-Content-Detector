from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.database.models import Analysis, Feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackCreate(BaseModel):
    analysis_id: str
    is_correct: bool
    user_comment: Optional[str] = None

@router.post("")
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    """Allows user to mark detection prediction as correct or incorrect with comment."""
    analysis = db.query(Analysis).filter(Analysis.analysis_id == payload.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    fb = Feedback(
        analysis_id=payload.analysis_id,
        is_correct=payload.is_correct,
        user_comment=payload.user_comment
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return {
        "status": "success",
        "feedback_id": fb.feedback_id,
        "analysis_id": fb.analysis_id,
        "is_correct": fb.is_correct,
        "message": "Feedback successfully recorded for model calibration."
    }

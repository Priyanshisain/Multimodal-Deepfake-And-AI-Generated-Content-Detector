from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.database.models import Analysis
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/{analysis_id}/pdf")
def download_pdf_report(analysis_id: str, db: Session = Depends(get_db)):
    """Generates and serves verification PDF report."""
    analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
    if not analysis or not analysis.result:
        raise HTTPException(status_code=404, detail="Completed analysis record not found")

    pdf_path_str = ReportService.generate_pdf_report(analysis, analysis.result)
    pdf_path = Path(pdf_path_str)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Verification_Report_{analysis.analysis_id[:8]}.pdf"
    )

@router.get("/{analysis_id}/json")
def download_json_report(analysis_id: str, db: Session = Depends(get_db)):
    """Generates structured verification JSON report."""
    analysis = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
    if not analysis or not analysis.result:
        raise HTTPException(status_code=404, detail="Completed analysis record not found")

    data = ReportService.generate_json_report(analysis, analysis.result)
    return JSONResponse(content=data)

from fastapi import APIRouter
from app.api.routes_auth import router as auth_router
from app.api.routes_analysis import router as analysis_router
from app.api.routes_webcam import router as webcam_router
from app.api.routes_history import router as history_router
from app.api.routes_feedback import router as feedback_router
from app.api.routes_reports import router as reports_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(analysis_router)
api_router.include_router(webcam_router)
api_router.include_router(history_router)
api_router.include_router(feedback_router)
api_router.include_router(reports_router)

__all__ = ["api_router"]

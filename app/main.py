from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import BASE_DIR, STORAGE_DIR
from app.database.connection import init_db
from app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title="Multimodel Deepfake and AI Generated Content Detector",
    description="Multimodal deepfake and synthetic AI content detection platform with Grad-CAM explainability.",
    version="2.2.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and media storage mounting
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "app" / "static")), name="static")
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Mount production React Authentication frontend if built
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/auth", StaticFiles(directory=str(frontend_dist), html=True), name="auth")

# Include API endpoints
app.include_router(api_router)

# Main UI Dashboard Endpoint
@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
@app.get("/signin", response_class=HTMLResponse)
@app.get("/signup", response_class=HTMLResponse)
@app.get("/register", response_class=HTMLResponse)
async def serve_dashboard():
    index_file = BASE_DIR / "app" / "templates" / "index.html"
    with open(index_file, "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

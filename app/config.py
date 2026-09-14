import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Storage configuration
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
HEATMAPS_DIR = STORAGE_DIR / "heatmaps"
REPORTS_DIR = STORAGE_DIR / "reports"

for dir_path in [STORAGE_DIR, UPLOADS_DIR, HEATMAPS_DIR, REPORTS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'multimodel_detector.db'}")

# Thresholds according to Business Rules
CONFIDENCE_THRESHOLD_FAKE = 0.75
CONFIDENCE_THRESHOLD_REAL = 0.35

# File Upload Limits & Formats
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB
SUPPORTED_VIDEO_EXTS = {".mp4", ".avi", ".mov"}
SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SUPPORTED_AUDIO_EXTS = {".wav", ".mp3", ".ogg"}
SUPPORTED_TEXT_EXTS = {".txt"}

# Model Version Registry
MODEL_VERSIONS = {
    "visual_detector": "ResNet-GradCAM-v2.1",
    "audio_detector": "SpectralFlux-VocoderNet-v1.4",
    "text_detector": "Perplexity-Burstiness-v1.8",
    "fusion_engine": "AdaptiveLateFusion-v2.0"
}

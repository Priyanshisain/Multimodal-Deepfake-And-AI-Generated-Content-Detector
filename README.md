# SYNTHGUARD AI — Real-Time Deepfake & AI-Generated Content Detector

> **High-Assurance Multimodal Forensic AI System** analyzing video, audio, text, and real-time live webcam streams to detect deepfakes, synthetic voice cloning, and generative AI content with calibrated confidence, Test-Time Augmentation (TTA), cross-modal synchronization verification, and penultimate-layer Grad-CAM heatmaps.

---

## 🌟 Key Upgrades (v2.2)

1. **Accuracy Improvements**:
   - **Visual Modality**: Face quality filtering (Laplacian sharpness variance & resolution checks), motion-adaptive frame sampling (sampling densely in high-motion sequences), Test-Time Augmentation (TTA: multi-scale + horizontal flip averaging), and quality-aware confidence dampening on blurry/degraded frames.
   - **Acoustic Modality**: Voice Activity Detection (VAD: silence stripping) for clean speech analysis, standard 16 kHz resample, spectral flux, brick-wall vocoder cutoffs (HiFi-GAN, WaveGlow, VITS), and acoustic pitch jitter perturbation.
   - **Textual Modality**: Statistical token perplexity proxy, sentence burstiness (length coefficient of variation), and canonical LLM transitional phrasing markers.
   - **Cross-Modal Consistency**: Correlates facial/mouth movement with acoustic speech energy envelopes to flag audio dubbing and voice cloning on authentic video.
   - **Platt / Temperature Calibration**: Calibrates raw outputs so the confidence percentage represents true empirical probability.
2. **User Authentication & Privacy**:
   - User registration (Sign Up) and authentication (Sign In).
   - Secure NIST-compliant password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and per-user random 16-byte salts.
   - JWT session management (`HS256`, 7-day expiration).
   - Protected personal analysis history: users can only view their own private forensic case log.
   - "Continue as Guest" mode for transient, unauthenticated public evaluations.
3. **Professional Forensic UI**:
   - Obsidian/Charcoal dark theme with subtle glassmorphism borders and electric cyan accents.
   - Live Webcam HUD with real-time face bounding boxes, Face Quality Index, and live Grad-CAM thermal canvas.
   - Segment-by-segment interactive suspicious timeline.
   - Side-by-side original frame vs. Grad-CAM attention heatmap gallery.
   - Downloadable Forensic PDF Dossier and JSON export.
   - Floating toast notification system and skeleton loaders.

---

## 📂 Project Structure

```
Project_9/
├── app/
│   ├── config.py                 # Configuration, 200MB limit, thresholds, paths
│   ├── database/
│   │   ├── connection.py         # SQLAlchemy engine with automatic SQLite migration
│   │   └── models.py             # User, Analysis, DetectionResult, Feedback models
│   ├── api/
│   │   ├── deps.py               # Session, get_current_user, and get_optional_user
│   │   ├── routes_auth.py        # /api/auth/signup, /api/auth/signin, /api/auth/me
│   │   ├── routes_analysis.py    # Media upload and multimodal analysis
│   │   ├── routes_webcam.py      # Live webcam frame analysis & Grad-CAM overlay
│   │   ├── routes_history.py     # Protected paginated history log
│   │   ├── routes_feedback.py    # Prediction accuracy feedback
│   │   └── routes_reports.py     # Downloadable forensic PDF & JSON dossiers
│   ├── models/                   # AI Detection Engines
│   │   ├── visual_detector.py    # Face quality filter, TTA, 2D FFT, CNN Grad-CAM
│   │   ├── audio_detector.py     # VAD silence removal, vocoder cutoffs, pitch jitter
│   │   ├── text_detector.py      # Perplexity, burstiness, stylistic markers
│   │   ├── fusion.py             # Cross-modal consistency & Platt temperature calibration
│   │   └── explainer.py          # Forensic natural language explainer
│   ├── services/
│   │   ├── auth_service.py       # PBKDF2-HMAC-SHA256 hashing & JWT tokens
│   │   ├── media_service.py      # File validation, disk storage, audio demuxing
│   │   ├── pipeline_service.py   # Full pipeline execution & database persistence
│   │   └── report_service.py     # ReportLab PDF & JSON dossier generator
│   ├── static/
│   │   ├── css/style.css         # Dark forensic styling, glassmorphism, toasts, skeleton
│   │   └── js/
│   │       ├── auth.js           # Auth manager, JWT storage, modal controls
│   │       ├── app.js            # Main client controller, drag-and-drop, toasts
│   │       ├── webcam.js         # Live webcam HUD, face quality gauge, Grad-CAM
│   │       ├── results.js        # Verdict banner, score cards, timeline, heatmaps
│   │       └── history.js        # Protected history table & case viewer
│   ├── templates/
│   │   └── index.html            # Forensic single-page application dashboard
│   └── main.py                   # FastAPI application entrypoint
├── storage/                      # Organized file system storage
│   ├── uploads/                  # /storage/uploads/YYYY/MM/...
│   ├── heatmaps/                 # /storage/heatmaps/YYYY/MM/...
│   └── reports/                  # /storage/reports/...
├── tests/
│   ├── test_auth.py              # Password hashing, JWT, signup, signin, protected routes
│   ├── test_detectors.py         # Face quality filter, TTA, VAD, spectral, text
│   ├── test_fusion.py            # Late fusion, decision thresholds, cross-modal desync
│   ├── test_api.py               # Integration tests for FastAPI endpoints
│   └── test_e2e_media.py         # End-to-end video and audio file synthesis and analysis
├── Dockerfile                    # Containerization definition
├── requirements.txt              # Project dependencies
└── README.md                     # Full documentation and API reference
```

---

## 🚀 Quickstart & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser to:
```
http://127.0.0.1:8000
```

---

## 🧪 Running Automated Tests

Run the complete test suite with pytest:
```bash
python -m pytest -v tests/
```

All 20 test cases will execute across authentication, detection models, fusion calibration, and API routes.

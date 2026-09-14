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

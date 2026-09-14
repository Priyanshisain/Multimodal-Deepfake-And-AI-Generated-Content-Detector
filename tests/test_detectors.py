import numpy as np
import cv2
import pytest
from app.models.visual_detector import VisualDeepfakeDetector
from app.models.audio_detector import AudioDeepfakeDetector
from app.models.text_detector import TextDeepfakeDetector

def test_visual_detector_frame():
    detector = VisualDeepfakeDetector()
    # Create test dummy image (128x128 BGR)
    dummy_img = np.zeros((128, 128, 3), dtype=np.uint8)
    cv2.circle(dummy_img, (64, 64), 30, (200, 200, 200), -1)

    result = detector.analyze_frame(dummy_img)
    assert "score" in result
    assert 0.0 <= result["score"] <= 1.0
    assert "quality_score" in result
    assert "anomalies" in result
    assert "overlay_frame" in result
    assert "heatmap_frame" in result

def test_visual_detector_gradcam():
    detector = VisualDeepfakeDetector()
    face_sample = np.ones((100, 100, 3), dtype=np.uint8) * 120
    overlay, heatmap, prob = detector.generate_gradcam(face_sample)

    assert overlay.shape == face_sample.shape
    assert heatmap.shape == face_sample.shape
    assert 0.0 <= prob <= 1.0

def test_visual_detector_quality_assessment():
    detector = VisualDeepfakeDetector()
    # Crisp face
    crisp = np.random.randint(50, 220, (100, 100, 3), dtype=np.uint8)
    q_score, is_ok, msg = detector.assess_face_quality(crisp)
    assert 0.0 <= q_score <= 1.0
    assert is_ok is True

    # Heavily blurred face
    blurry = cv2.GaussianBlur(crisp, (31, 31), 0)
    q_blurry, is_ok_blurry, msg_blurry = detector.assess_face_quality(blurry)
    assert q_blurry < q_score

def test_audio_detector_spectral_and_vad():
    detector = AudioDeepfakeDetector()
    sr = 16000
    # Generate 1 second of synthetic harmonic tone
    t = np.linspace(0, 1.0, sr)
    data = 0.5 * np.sin(2 * np.pi * 440 * t)

    cutoff_score = detector.compute_spectral_cutoff(data, sr)
    jitter_score = detector.compute_jitter_shimmer(data, sr)
    flux_score = detector.compute_spectral_flux(data, sr)

    assert 0.0 <= cutoff_score <= 1.0
    assert 0.0 <= jitter_score <= 1.0
    assert 0.0 <= flux_score <= 1.0

    # VAD test
    clean_audio, energy_curve = detector.apply_vad(data, sr)
    assert len(clean_audio) > 0
    assert len(energy_curve) > 0

def test_text_detector_perplexity_and_burstiness():
    detector = TextDeepfakeDetector()
    ai_text = (
        "In summary, artificial intelligence plays a pivotal role in the ever-evolving modern technological landscape. "
        "Furthermore, it is important to remember that machine learning models harness the power of deep neural architectures. "
        "Moreover, this seamless integration represents a testament to ongoing innovation."
    )
    res = detector.analyze_text(ai_text)
    assert 0.0 <= res["text_score"] <= 1.0
    assert res["metrics"]["ai_marker_count"] >= 3
    assert any("LLM" in a for a in res["anomalies"])

def test_text_detector_human_text():
    detector = TextDeepfakeDetector()
    human_text = "I went down to the local diner yesterday. Great coffee! Ordered pancakes with extra butter and maple syrup."
    res = detector.analyze_text(human_text)
    assert 0.0 <= res["text_score"] <= 1.0

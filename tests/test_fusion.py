import pytest
from app.models.fusion import MultimodalLateFusion

def test_fusion_decision_boundaries():
    fusion = MultimodalLateFusion()

    # Case 1: High fake score (>= 0.75)
    score, decision, weights, anomaly = fusion.fuse(visual_score=0.85, audio_score=0.80, text_score=0.75)
    assert decision == "Likely Fake"
    assert score >= 0.75

    # Case 2: Low score (<= 0.35)
    score, decision, weights, anomaly = fusion.fuse(visual_score=0.20, audio_score=0.15, text_score=0.25)
    assert decision == "Real"
    assert score <= 0.35

    # Case 3: Suspicious score (0.35 < score < 0.75)
    score, decision, weights, anomaly = fusion.fuse(visual_score=0.55, audio_score=0.60, text_score=0.50)
    assert decision == "Suspicious"
    assert 0.35 < score < 0.75

def test_fusion_missing_modalities():
    fusion = MultimodalLateFusion()

    # Missing audio
    score, decision, weights, anomaly = fusion.fuse(visual_score=0.90, text_score=0.80)
    assert "audio" not in weights
    assert "visual" in weights
    assert "text" in weights
    # Re-normalized weights sum to 1.0
    assert abs(sum(weights.values()) - 1.0) < 1e-5

    # Text only
    score, decision, weights, anomaly = fusion.fuse(text_score=0.20)
    assert decision == "Real"
    assert weights == {"text": 1.0}

def test_cross_modal_consistency():
    fusion = MultimodalLateFusion()

    # Anti-correlated signals (high speech energy while face is still)
    visual_motion = [1.0, 1.2, 0.9, 1.1, 0.8, 1.0, 0.9, 1.1]
    audio_energy = [0.8, 0.9, 0.7, 0.85, 0.95, 0.75, 0.8, 0.9]

    # Inverted pattern to simulate extreme desync
    audio_inverted = [0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1]
    visual_inverted = [0.1, 0.9, 0.1, 0.9, 0.1, 0.9, 0.1, 0.9]

    penalty, anomaly = fusion.compute_cross_modal_consistency(visual_inverted, audio_inverted)
    assert penalty > 0.0
    assert anomaly is not None
    assert "desynchronization" in anomaly.lower() or "coherence" in anomaly.lower()

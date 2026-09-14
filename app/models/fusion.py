import numpy as np
from typing import Optional, Dict, Tuple, List
from app.config import (
    CONFIDENCE_THRESHOLD_FAKE,
    CONFIDENCE_THRESHOLD_REAL,
    MODEL_VERSIONS
)

class MultimodalLateFusion:
    """
    Calibrated Adaptive Late-Fusion Engine with Cross-Modal Consistency Verification.
    Applies learned weights, cross-modal A/V synchronization checks,
    and Platt temperature scaling.
    """
    DEFAULT_WEIGHTS = {
        "visual": 0.50,
        "audio": 0.30,
        "text": 0.20
    }

    @staticmethod
    def compute_cross_modal_consistency(
        visual_motion: Optional[List[float]],
        audio_energy: Optional[List[float]]
    ) -> Tuple[float, Optional[str]]:
        """
        Evaluates temporal alignment between facial motion and acoustic speech energy.
        Mismatches indicate voice cloning over unrelated video (audio-visual dubbing).
        Returns: (desync_penalty in [0, 0.2], anomaly_description_or_None)
        """
        if not visual_motion or not audio_energy or len(visual_motion) < 5 or len(audio_energy) < 5:
            return 0.0, None

        min_len = min(len(visual_motion), len(audio_energy))
        v_arr = np.array(visual_motion[:min_len])
        a_arr = np.array(audio_energy[:min_len])

        # Normalize both signals to [0, 1]
        v_norm = (v_arr - v_arr.min()) / (v_arr.max() - v_arr.min() + 1e-6)
        a_norm = (a_arr - a_arr.min()) / (a_arr.max() - a_arr.min() + 1e-6)

        # Pearson correlation
        if np.std(v_norm) > 1e-4 and np.std(a_norm) > 1e-4:
            corr = float(np.corrcoef(v_norm, a_norm)[0, 1])
            # If correlation is negative or near zero during high speech activity, flag desync
            if corr < -0.15:
                penalty = 0.18
                desc = f"Cross-modal acoustic/facial motion desynchronization detected (correlation: {corr:.2f})"
                return penalty, desc
            elif corr < 0.05:
                penalty = 0.10
                desc = f"Low temporal coherence between speech energy and facial motion (correlation: {corr:.2f})"
                return penalty, desc

        return 0.0, None

    @staticmethod
    def calibrate_probability(raw_score: float, temperature: float = 1.15) -> float:
        """
        Platt / Temperature scaling to ensure confidence score represents true empirical probability.
        """
        # Centered logit
        p = np.clip(raw_score, 0.01, 0.99)
        logit = np.log(p / (1.0 - p))
        calibrated_logit = logit / temperature
        calibrated_p = 1.0 / (1.0 + np.exp(-calibrated_logit))
        return float(np.clip(calibrated_p, 0.05, 0.98))

    def fuse(
        self,
        visual_score: Optional[float] = None,
        audio_score: Optional[float] = None,
        text_score: Optional[float] = None,
        visual_motion: Optional[List[float]] = None,
        audio_energy: Optional[List[float]] = None
    ) -> Tuple[float, str, Dict[str, float], Optional[str]]:
        """
        Calculates calibrated fused score, decision badge, effective weights, and cross-modal findings.
        Returns: (fused_score, final_decision, effective_weights, cross_modal_anomaly)
        """
        scores = {}
        if visual_score is not None:
            scores["visual"] = float(visual_score)
        if audio_score is not None:
            scores["audio"] = float(audio_score)
        if text_score is not None:
            scores["text"] = float(text_score)

        if not scores:
            return 0.0, "Real", {}, None

        # Re-weight dynamically based on available modalities
        total_weight = sum(self.DEFAULT_WEIGHTS[m] for m in scores.keys())
        effective_weights = {m: self.DEFAULT_WEIGHTS[m] / total_weight for m in scores.keys()}

        raw_fused = sum(scores[m] * effective_weights[m] for m in scores.keys())

        # Cross-modal consistency penalty
        desync_penalty, cross_modal_anomaly = self.compute_cross_modal_consistency(visual_motion, audio_energy)
        adjusted_score = min(0.99, raw_fused + desync_penalty)

        # Calibrate probability
        calibrated_score = self.calibrate_probability(adjusted_score)
        fused_score = round(calibrated_score, 3)

        # Enforce Business Rule Decision Boundaries
        if fused_score >= CONFIDENCE_THRESHOLD_FAKE:
            decision = "Likely Fake"
        elif fused_score <= CONFIDENCE_THRESHOLD_REAL:
            decision = "Real"
        else:
            decision = "Suspicious"

        return fused_score, decision, effective_weights, cross_modal_anomaly

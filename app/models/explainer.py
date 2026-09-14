from typing import List, Optional, Dict

class DetectionExplainer:
    """
    Synthesizes multi-modal observations into clear, human-understandable
    analytical findings for the Multimodel Deepfake and AI Generated Content Detector.
    """
    @staticmethod
    def generate_explanation(
        decision: str,
        fused_score: float,
        visual_score: Optional[float] = None,
        audio_score: Optional[float] = None,
        text_score: Optional[float] = None,
        visual_anomalies: Optional[List[str]] = None,
        audio_anomalies: Optional[List[str]] = None,
        text_anomalies: Optional[List[str]] = None,
    ) -> str:
        findings = []

        if visual_score is not None:
            if visual_score >= 0.65:
                v_desc = f"Visual stream demonstrates severe synthetic anomalies (confidence: {visual_score*100:.1f}%)"
                if visual_anomalies:
                    v_desc += f": {'; '.join(visual_anomalies[:2])}"
                findings.append(v_desc)
            elif visual_score >= 0.40:
                findings.append(f"Visual stream displays subtle boundary or spectral inconsistencies ({visual_score*100:.1f}%)")
            else:
                findings.append("Visual features and facial gradients appear organic and continuous")

        if audio_score is not None:
            if audio_score >= 0.65:
                a_desc = f"Acoustic analysis detected synthetic vocoder or voice clone artifacts ({audio_score*100:.1f}%)"
                if audio_anomalies:
                    a_desc += f": {'; '.join(audio_anomalies[:2])}"
                findings.append(a_desc)
            elif audio_score >= 0.40:
                findings.append(f"Acoustic track exhibits borderline harmonic regularity ({audio_score*100:.1f}%)")
            else:
                findings.append("Acoustic spectrum shows natural human vocal jitter and ambient room noise floor")

        if text_score is not None:
            if text_score >= 0.65:
                t_desc = f"Textual content exhibits prominent generative LLM patterns ({text_score*100:.1f}%)"
                if text_anomalies:
                    t_desc += f": {'; '.join(text_anomalies[:2])}"
                findings.append(t_desc)
            elif text_score >= 0.40:
                findings.append(f"Textual structure shows moderate perplexity uniformity ({text_score*100:.1f}%)")
            else:
                findings.append("Text demonstrates organic lexical diversity, human burstiness, and natural cadence")

        # Header conclusion
        confidence_pct = fused_score * 100
        if decision == "Likely Fake":
            verdict_header = (
                f"DETECTION ASSESSMENT: LIKELY SYNTHETIC / DEEPFAKE (Overall Confidence: {confidence_pct:.1f}%).\n"
                "Multiple high-confidence digital manipulation signatures were identified across analyzed modalities."
            )
        elif decision == "Real":
            verdict_header = (
                f"DETECTION ASSESSMENT: AUTHENTIC / REAL (Authenticity Confidence: {(1 - fused_score)*100:.1f}%).\n"
                "No definitive signatures of generative neural models, face replacement, or voice cloning were detected."
            )
        else:
            verdict_header = (
                f"DETECTION ASSESSMENT: SUSPICIOUS / INCONCLUSIVE (Risk Confidence: {confidence_pct:.1f}%).\n"
                "Mixed indicators detected. Compression artifacts or borderline generative patterns warrant review."
            )

        bullet_points = "\n".join(f"• {f}" for f in findings)
        return f"{verdict_header}\n\nKey Evidentiary Findings:\n{bullet_points}"

# Backward-compatibility alias
ForensicExplainer = DetectionExplainer

import re
import math
from collections import Counter
from typing import Dict, List

AI_STYLISTIC_MARKERS = [
    r"\bin summary\b", r"\bfurthermore\b", r"\bmoreover\b", r"\bin conclusion\b",
    r"\bit is crucial to\b", r"\bit is important to remember\b", r"\ba testament to\b",
    r"\bdelve into\b", r"\btapestry\b", r"\bharnessing the power\b", r"\bever-evolving\b",
    r"\bseamless integration\b", r"\bpivotal role\b", r"\bnavigate the complexities\b"
]

class TextDeepfakeDetector:
    """
    AI-generated text detector analyzing perplexity, burstiness, n-gram entropy,
    and synthetic LLM stylistic signatures.
    """
    def __init__(self):
        self.marker_regexes = [re.compile(p, re.IGNORECASE) for p in AI_STYLISTIC_MARKERS]

    def tokenize(self, text: str) -> List[str]:
        return re.findall(r"\b\w+\b", text.lower())

    def split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r"[.!?]+", text)
        return [s.strip() for s in sentences if len(s.strip().split()) >= 3]

    def compute_perplexity_proxy(self, words: List[str]) -> float:
        """
        N-gram frequency cross-entropy proxy.
        Human text displays unpredictable, diverse vocabulary (higher entropy / perplexity).
        LLM generated text gravitates towards high-frequency expected tokens.
        """
        if len(words) < 5:
            return 35.0

        counts = Counter(words)
        total = len(words)
        entropy = 0.0
        for count in counts.values():
            p = count / total
            entropy -= p * math.log2(p)

        # Perplexity = 2^entropy
        perplexity = 2 ** entropy
        return perplexity

    def compute_burstiness(self, sentences: List[str]) -> float:
        """
        Calculates variance of sentence lengths and local perplexity across sentences.
        Humans write with high burstiness (mixing short declarative and long complex sentences).
        LLMs maintain uniform sentence length and structure.
        """
        if len(sentences) < 2:
            return 0.5  # Neutral default for single sentence

        lengths = [len(s.split()) for s in sentences]
        mean_len = sum(lengths) / len(lengths)
        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)

        # Coefficient of variation (burstiness indicator)
        cv = std_dev / (mean_len + 1e-6)
        return float(cv)

    def compute_repetition_entropy(self, words: List[str]) -> float:
        """Type-Token Ratio (TTR) measuring lexical diversity."""
        if not words:
            return 1.0
        unique_tokens = len(set(words))
        return unique_tokens / len(words)

    def analyze_text(self, text: str) -> Dict:
        """
        Evaluates input text and computes synthetic probability score and explanation.
        """
        clean_text = text.strip()
        words = self.tokenize(clean_text)
        sentences = self.split_sentences(clean_text)

        if len(words) < 10:
            return {
                "text_score": 0.2,
                "anomalies": ["Text sample is too brief for statistical perplexity analysis"],
                "metrics": {
                    "word_count": len(words),
                    "sentence_count": len(sentences),
                    "perplexity_proxy": 0.0,
                    "burstiness": 0.0,
                    "lexical_diversity": 0.0,
                    "ai_marker_count": 0
                }
            }

        perplexity = self.compute_perplexity_proxy(words)
        burstiness = self.compute_burstiness(sentences)
        ttr = self.compute_repetition_entropy(words)

        # Check AI stylistic cliches
        marker_hits = []
        for r in self.marker_regexes:
            matches = r.findall(clean_text)
            if matches:
                marker_hits.extend(matches)
        marker_count = len(marker_hits)

        # Heuristic scoring
        # 1. Low burstiness (cv < 0.35) is characteristic of LLMs
        burst_score = 0.85 if burstiness < 0.30 else (0.65 if burstiness < 0.45 else 0.20)

        # 2. Moderate/low perplexity proxy (high uniformity)
        perp_score = 0.80 if perplexity < 16.0 else (0.55 if perplexity < 25.0 else 0.20)

        # 3. AI cliche markers
        marker_score = min(0.95, 0.3 + 0.2 * marker_count) if marker_count > 0 else 0.20

        # Weighted aggregate score
        fake_score = float(0.35 * burst_score + 0.35 * perp_score + 0.30 * marker_score)
        fake_score = float(min(0.98, max(0.05, fake_score)))

        anomalies = []
        if burstiness < 0.35 and len(sentences) >= 3:
            anomalies.append(f"Unnaturally uniform sentence cadence (low burstiness: {burstiness:.2f})")
        if perplexity < 20.0:
            anomalies.append(f"Constrained statistical token distribution typical of greedy LLM sampling (perplexity proxy: {perplexity:.1f})")
        if marker_count >= 1:
            anomalies.append(f"Identified {marker_count} canonical LLM transition phrasing markers ({', '.join(set(marker_hits[:3]))})")
        if not anomalies:
            anomalies.append("Organic lexical burstiness and natural stylistic entropy observed")

        return {
            "text_score": round(fake_score, 3),
            "anomalies": anomalies,
            "metrics": {
                "word_count": len(words),
                "sentence_count": len(sentences),
                "perplexity_proxy": round(perplexity, 2),
                "burstiness": round(burstiness, 3),
                "lexical_diversity": round(ttr, 3),
                "ai_marker_count": marker_count
            }
        }

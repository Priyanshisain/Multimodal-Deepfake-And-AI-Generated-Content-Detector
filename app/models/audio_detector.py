import numpy as np
import soundfile as sf
from scipy import signal
from typing import Dict, List, Tuple, Optional
import os

class AudioDeepfakeDetector:
    """
    Acoustic analyzer detecting synthetic speech, voice cloning,
    vocoder artifacts, and neural voice synthesis anomalies with Voice Activity Detection (VAD).
    """
    def __init__(self, sample_rate: int = 16000):
        self.target_sr = sample_rate

    def load_audio(self, audio_path: str) -> Tuple[np.ndarray, int]:
        """Loads audio file, converts to mono and standard sample rate."""
        data, sr = sf.read(audio_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)  # Convert stereo to mono
        data = data.astype(np.float32)

        # Resample to target_sr if necessary
        if sr != self.target_sr and len(data) > 0:
            target_len = int(len(data) * self.target_sr / sr)
            data = signal.resample(data, target_len)
            sr = self.target_sr

        # Normalize amplitude
        max_val = np.max(np.abs(data)) + 1e-8
        data = data / max_val
        return data, sr

    def apply_vad(self, data: np.ndarray, sr: int, energy_threshold: float = 0.02) -> Tuple[np.ndarray, np.ndarray]:
        """
        Voice Activity Detection (VAD):
        Strips non-speech/silence frames so ambient noise doesn't corrupt spectral analysis.
        Returns: (active_speech_samples, energy_envelope)
        """
        frame_len = int(sr * 0.030)  # 30ms window
        hop = int(sr * 0.015)        # 15ms hop
        num_frames = max(1, (len(data) - frame_len) // hop)

        active_indices = []
        energy_curve = []

        for i in range(num_frames):
            frame = data[i * hop : i * hop + frame_len]
            rms = float(np.sqrt(np.mean(frame ** 2)))
            energy_curve.append(rms)
            if rms >= energy_threshold:
                active_indices.extend(range(i * hop, min(len(data), i * hop + frame_len)))

        if len(active_indices) > sr * 0.2:  # At least 200ms of active speech
            clean_indices = np.unique(active_indices)
            return data[clean_indices], np.array(energy_curve)
        return data, np.array(energy_curve)

    def compute_spectral_cutoff(self, data: np.ndarray, sr: int) -> float:
        """
        Detects artificial brick-wall frequency cutoffs typical of neural vocoders
        (e.g., HiFi-GAN, MelGAN, VITS often cut abruptly at 8kHz or 11kHz).
        """
        freqs, times, Sxx = signal.spectrogram(data, fs=sr, nperseg=512, noverlap=256)
        mean_spectrum = np.mean(Sxx, axis=1)

        total_bins = len(freqs)
        high_band_start = int(total_bins * 0.8)
        mid_band_start = int(total_bins * 0.2)
        mid_band_end = int(total_bins * 0.6)

        high_energy = np.mean(mean_spectrum[high_band_start:]) + 1e-12
        mid_energy = np.mean(mean_spectrum[mid_band_start:mid_band_end]) + 1e-12

        ratio = high_energy / mid_energy
        if ratio < 0.0001:
            return 0.88  # Strong indication of neural vocoder cutoff
        elif ratio < 0.005:
            return 0.65
        else:
            return 0.18

    def compute_jitter_shimmer(self, data: np.ndarray, sr: int) -> float:
        """
        Evaluates pitch jitter and micro-tremor variance.
        Human vocal cords exhibit organic cycle-to-cycle perturbation.
        Cloned or TTS voices often have robotic uniformity.
        """
        frame_len = int(sr * 0.025)
        hop = int(sr * 0.010)
        num_frames = (len(data) - frame_len) // hop

        if num_frames < 2:
            return 0.3

        zcr = []
        energy = []
        for i in range(num_frames):
            frame = data[i * hop : i * hop + frame_len]
            z = np.sum(np.abs(np.diff(frame > 0))) / frame_len
            e = np.sum(frame ** 2) / frame_len
            zcr.append(z)
            energy.append(e)

        zcr = np.array(zcr)
        energy = np.array(energy)
        voiced_frames = zcr[energy > 0.01]

        if len(voiced_frames) < 5:
            return 0.25

        jitter_proxy = float(np.std(voiced_frames))
        if jitter_proxy < 0.015:
            return 0.82  # Robotic pitch uniformity
        elif jitter_proxy > 0.18:
            return 0.74  # Phase instability / synthesis glitch
        else:
            return 0.15  # Organic human vocal variation

    def compute_spectral_flux(self, data: np.ndarray, sr: int) -> float:
        """
        Spectral flux measures rate of spectral change between successive frames.
        Neural vocoders often produce unnatural phase discontinuities at phoneme boundaries.
        """
        freqs, times, Sxx = signal.spectrogram(data, fs=sr, nperseg=512, noverlap=256)
        Sxx = np.log1p(Sxx)
        diff = np.diff(Sxx, axis=1)
        flux = float(np.sqrt(np.mean(diff ** 2)))

        norm_flux = float(np.clip((flux - 0.2) / 0.8, 0.05, 0.95))
        return norm_flux

    def analyze_audio(self, audio_path: str, segment_duration: float = 2.0) -> Dict:
        """
        Runs full acoustic analysis on audio file with VAD and temporal segments.
        """
        try:
            data, sr = self.load_audio(audio_path)
        except Exception as e:
            return {
                "audio_score": 0.0,
                "timeline": [],
                "anomalies": [f"Could not load audio file: {str(e)}"],
                "duration": 0.0,
                "energy_envelope": []
            }

        total_duration = len(data) / sr
        if total_duration < 0.2:
            return {
                "audio_score": 0.2,
                "timeline": [],
                "anomalies": ["Audio track too short for acoustic evaluation"],
                "duration": total_duration,
                "energy_envelope": []
            }

        # Apply VAD preprocessing
        speech_data, energy_envelope = self.apply_vad(data, sr)

        cutoff_score = self.compute_spectral_cutoff(speech_data, sr)
        jitter_score = self.compute_jitter_shimmer(speech_data, sr)
        flux_score = self.compute_spectral_flux(speech_data, sr)

        overall_score = float(0.45 * cutoff_score + 0.35 * jitter_score + 0.20 * flux_score)

        anomalies = []
        if cutoff_score >= 0.65:
            anomalies.append("Artificial high-frequency cutoff detected (characteristic of neural vocoder resynthesis)")
        if jitter_score >= 0.7:
            anomalies.append("Abnormal pitch/harmonic stability with low organic vocal jitter (synthetic voice clone signature)")
        if flux_score >= 0.65:
            anomalies.append("Unnatural spectral flux and acoustic phoneme transition artifacts observed")
        if not anomalies:
            anomalies.append("Organic harmonic distribution and natural vocal micro-tremors detected across speech segments")

        # Timeline breakdown in chunks
        chunk_samples = int(segment_duration * sr)
        num_chunks = max(1, len(data) // chunk_samples)
        timeline = []

        for i in range(num_chunks):
            chunk = data[i * chunk_samples : (i + 1) * chunk_samples]
            if len(chunk) < chunk_samples * 0.4:
                continue
            t_start = round(i * segment_duration, 2)
            c_cut = self.compute_spectral_cutoff(chunk, sr)
            c_jit = self.compute_jitter_shimmer(chunk, sr)
            seg_score = float(0.55 * c_cut + 0.45 * c_jit)

            timeline.append({
                "timestamp": t_start,
                "duration": segment_duration,
                "score": round(seg_score, 3),
                "is_suspicious": bool(seg_score >= 0.6)
            })

        # Downsample energy envelope to ~20 points for cross-modal check
        downsampled_energy = []
        if len(energy_envelope) > 0:
            step = max(1, len(energy_envelope) // 25)
            downsampled_energy = [round(float(np.mean(energy_envelope[i:i+step])), 4) for i in range(0, len(energy_envelope), step)][:25]

        return {
            "audio_score": round(overall_score, 3),
            "timeline": timeline,
            "anomalies": anomalies,
            "duration": round(total_duration, 2),
            "energy_envelope": downsampled_energy
        }

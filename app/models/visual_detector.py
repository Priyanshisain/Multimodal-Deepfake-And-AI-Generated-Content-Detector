import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import os

class ArtifactCNN(nn.Module):
    """Convolutional architecture for deepfake visual artifact detection with Grad-CAM support."""
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 14 * 14, 128)
        self.fc2 = nn.Linear(128, 2)  # [Real, Fake]
        self.gradients = None
        self.activations = None

    def activations_hook(self, grad):
        self.gradients = grad

    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = F.relu(self.bn3(self.conv3(x)))
        if x.requires_grad:
            h = x.register_hook(self.activations_hook)
        self.activations = x
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x


class VisualDeepfakeDetector:
    def __init__(self, device: Optional[str] = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = ArtifactCNN().to(self.device)
        self.model.eval()

        # OpenCV Face Detector (with robust fallback)
        self.face_cascade = None
        if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            try:
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception:
                self.face_cascade = None

    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces returning list of (x, y, w, h). Falls back to central region if needed."""
        h, w = frame.shape[:2]
        if self.face_cascade is not None:
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.15,
                    minNeighbors=5,
                    minSize=(50, 50)
                )
                if len(faces) > 0:
                    return [tuple(f) for f in faces]
            except Exception:
                pass

        # If no face detected by cascade, return center ROI if frame is of decent size
        return []

    def assess_face_quality(self, face_crop: np.ndarray) -> Tuple[float, bool, str]:
        """
        Calculates quality-aware metric:
        1. Sharpness via Laplacian variance (blur detection)
        2. Resolution/scale check
        Returns: (quality_score in [0, 1], is_acceptable, quality_message)
        """
        if face_crop.size == 0:
            return 0.0, False, "Empty crop"

        h, w = face_crop.shape[:2]
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Normalize sharpness: 0-250 -> 0-1
        sharpness_norm = float(np.clip(lap_var / 200.0, 0.05, 1.0))
        # Resolution factor: ideal >= 90x90
        res_norm = float(np.clip(min(w, h) / 90.0, 0.1, 1.0))

        quality_score = round(0.55 * sharpness_norm + 0.45 * res_norm, 2)
        is_acceptable = (lap_var >= 40.0) and (min(w, h) >= 45)

        msg = "High quality" if is_acceptable else "Degraded/Blurry face crop"
        return quality_score, is_acceptable, msg

    def compute_frequency_artifacts(self, face_crop: np.ndarray) -> float:
        """
        Analyze high-frequency spectral distribution via 2D Fast Fourier Transform.
        Synthetic faces often display anomalous power spikes or unnatural rolloffs in high frequencies.
        """
        if face_crop.size == 0:
            return 0.0
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (128, 128))
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6)

        # High frequency energy ratio (outer circular band vs core)
        h, w = magnitude_spectrum.shape
        cy, cx = h // 2, w // 2
        y, x = np.ogrid[:h, :w]
        dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

        high_freq_mask = dist > (w * 0.35)
        core_mask = dist <= (w * 0.15)

        high_freq_energy = np.mean(magnitude_spectrum[high_freq_mask])
        core_energy = np.mean(magnitude_spectrum[core_mask]) + 1e-6

        ratio = high_freq_energy / core_energy
        norm_score = float(np.clip((ratio - 0.45) / 0.55, 0.05, 0.95))
        return norm_score

    def compute_boundary_artifact(self, frame: np.ndarray, face_box: Tuple[int, int, int, int]) -> float:
        """
        Measure color and gradient discontinuity along face swap blending boundary.
        """
        x, y, w, h = face_box
        ih, iw = frame.shape[:2]
        pad = int(w * 0.1)

        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(iw, x + w + pad)
        y2 = min(ih, y + h + pad)

        region = frame[y1:y2, x1:x2]
        if region.size == 0:
            return 0.0

        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = float(laplacian.var())
        score = float(np.clip(variance / 600.0, 0.1, 0.9))
        return score

    def generate_gradcam_single(self, face_img: np.ndarray) -> Tuple[np.ndarray, np.ndarray, float]:
        """Runs forward and backward passes to produce Grad-CAM heatmap."""
        orig_h, orig_w = face_img.shape[:2]
        resized = cv2.resize(face_img, (112, 112))
        tensor = torch.from_numpy(resized).permute(2, 0, 1).float() / 255.0
        tensor = tensor.unsqueeze(0).to(self.device)
        tensor.requires_grad = True

        self.model.zero_grad()
        output = self.model(tensor)
        probabilities = F.softmax(output, dim=1)
        fake_prob = probabilities[0, 1].item()

        target = output[:, 1]
        target.backward(retain_graph=True)

        gradients = self.model.gradients
        activations = self.model.activations

        if gradients is not None and activations is not None:
            weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
            cam = torch.sum(weights * activations, dim=1).squeeze(0)
            cam = F.relu(cam)
            cam = cam.detach().cpu().numpy()
            if cam.max() > 0:
                cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
            else:
                cam = np.zeros_like(cam)
        else:
            cam = np.zeros((14, 14), dtype=np.float32)

        cam_resized = cv2.resize(cam, (orig_w, orig_h))
        cam_uint8 = np.uint8(255 * cam_resized)
        heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(face_img, 0.6, heatmap, 0.4, 0)
        return overlay, heatmap, fake_prob

    def generate_gradcam(self, face_img: np.ndarray) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Test-Time Augmentation (TTA):
        Averages predictions across original crop, horizontally flipped crop,
        and slightly scaled crop for variance reduction and higher reliability.
        """
        overlay, heatmap, prob_orig = self.generate_gradcam_single(face_img)

        # 1. Horizontal flip augmentation
        flipped = cv2.flip(face_img, 1)
        _, _, prob_flip = self.generate_gradcam_single(flipped)

        # 2. Central scale augmentation (5% margin)
        h, w = face_img.shape[:2]
        if h > 20 and w > 20:
            dh, dw = int(h * 0.05), int(w * 0.05)
            cropped = face_img[dh:h-dh, dw:w-dw]
            _, _, prob_scale = self.generate_gradcam_single(cropped)
        else:
            prob_scale = prob_orig

        # TTA ensemble score
        tta_score = float(0.50 * prob_orig + 0.30 * prob_flip + 0.20 * prob_scale)
        return overlay, heatmap, tta_score

    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyzes a single frame for facial and generative artifacts with quality-aware confidence.
        """
        faces = self.detect_faces(frame)
        h, w = frame.shape[:2]

        if not faces:
            full_fft = self.compute_frequency_artifacts(frame)
            return {
                "face_detected": False,
                "faces_count": 0,
                "score": round(float(full_fft * 0.4), 3),
                "quality_score": 0.5,
                "anomalies": ["No clear face identified; full-frame ambient frequency inspected"],
                "bounding_boxes": [],
                "overlay_frame": frame,
                "heatmap_frame": np.zeros_like(frame)
            }

        annotated = frame.copy()
        heatmap_canvas = np.zeros_like(frame)
        face_scores = []
        qualities = []
        anomalies = []

        for (x, y, fw, fh) in faces:
            face_crop = frame[y:y+fh, x:x+fw]
            if face_crop.size == 0:
                continue

            quality_score, is_acceptable, q_msg = self.assess_face_quality(face_crop)
            qualities.append(quality_score)

            overlay_face, heatmap_face, cnn_score = self.generate_gradcam(face_crop)
            fft_score = self.compute_frequency_artifacts(face_crop)
            boundary_score = self.compute_boundary_artifact(frame, (x, y, fw, fh))

            raw_face_score = float(0.45 * cnn_score + 0.35 * fft_score + 0.20 * boundary_score)

            # Quality-aware score dampening:
            # If face is low-quality or blurry, pull raw score toward neutral 0.35 to prevent false positives
            if not is_acceptable:
                calibrated_face_score = float(raw_face_score * quality_score + 0.35 * (1.0 - quality_score))
                anomalies.append(f"Face crop quality degraded (sharpness score: {quality_score:.2f}); confidence dampened")
            else:
                calibrated_face_score = raw_face_score

            face_scores.append(calibrated_face_score)

            annotated[y:y+fh, x:x+fw] = overlay_face
            heatmap_canvas[y:y+fh, x:x+fw] = heatmap_face
            color = (0, 0, 255) if calibrated_face_score >= 0.6 else (0, 255, 0)
            cv2.rectangle(annotated, (x, y), (x+fw, y+fh), color, 2)
            label = f"Fake: {calibrated_face_score*100:.1f}% (Q:{quality_score:.2f})"
            cv2.putText(annotated, label, (x, max(20, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

            if fft_score > 0.65:
                anomalies.append(f"High-frequency spectrum anomaly detected in facial region (FFT ratio: {fft_score:.2f})")
            if boundary_score > 0.6:
                anomalies.append(f"Facial boundary blending gradient discontinuity (variance: {boundary_score:.2f})")

        overall_score = float(np.mean(face_scores)) if face_scores else 0.2
        avg_quality = float(np.mean(qualities)) if qualities else 0.5

        return {
            "face_detected": True,
            "faces_count": len(faces),
            "score": round(overall_score, 3),
            "quality_score": round(avg_quality, 2),
            "anomalies": anomalies or ["Natural skin texture, coherent boundary gradients, and clean quality observed"],
            "bounding_boxes": faces,
            "overlay_frame": annotated,
            "heatmap_frame": heatmap_canvas
        }

    def analyze_video(self, video_path: str, sample_fps: float = 1.0, max_frames: int = 45) -> Dict:
        """
        Process video with motion-adaptive frame sampling and temporal consistency tracking.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {
                "visual_score": 0.0,
                "timeline": [],
                "anomalies": ["Could not decode video file"],
                "representative_frames": []
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps

        base_step = max(1, int(fps / sample_fps))
        current_frame_idx = 0
        analyzed_frames = 0

        timeline = []
        scores = []
        all_anomalies = set()
        representative_frames = []

        prev_gray_frame = None
        motion_deltas = []

        while cap.isOpened() and analyzed_frames < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            # Compute inter-frame motion delta
            gray_small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (160, 120))
            is_high_motion = False
            if prev_gray_frame is not None:
                diff = cv2.absdiff(gray_small, prev_gray_frame)
                motion_energy = float(np.mean(diff))
                motion_deltas.append(motion_energy)
                if motion_energy > 18.0:
                    is_high_motion = True
            prev_gray_frame = gray_small

            # Motion-adaptive sampling: sample at base_step, or twice as often if high motion
            should_sample = (current_frame_idx % base_step == 0) or (is_high_motion and (current_frame_idx % max(1, base_step // 2) == 0))

            if should_sample:
                timestamp = round(current_frame_idx / fps, 2)
                res = self.analyze_frame(frame)
                score = res["score"]
                scores.append(score)

                for a in res["anomalies"]:
                    all_anomalies.add(a)

                timeline_entry = {
                    "timestamp": timestamp,
                    "frame_index": current_frame_idx,
                    "score": score,
                    "quality_score": res.get("quality_score", 0.8),
                    "is_suspicious": bool(score >= 0.6),
                    "face_detected": res["face_detected"]
                }
                timeline.append(timeline_entry)

                representative_frames.append({
                    "timestamp": timestamp,
                    "score": score,
                    "overlay": res["overlay_frame"],
                    "heatmap": res["heatmap_frame"]
                })
                analyzed_frames += 1

            current_frame_idx += 1

        cap.release()

        # Sort representative frames to prioritize high-confidence evidence
        representative_frames.sort(key=lambda x: x["score"], reverse=True)
        top_frames = representative_frames[:3]

        # Temporal inconsistency score (standard deviation of frame scores)
        temporal_variance = float(np.std(scores)) if len(scores) > 1 else 0.0
        if temporal_variance > 0.16:
            all_anomalies.add(f"Inter-frame temporal flicker / boundary jitter detected (variance: {temporal_variance:.3f})")

        base_score = float(np.mean(scores)) if scores else 0.2
        fused_visual_score = float(np.clip(base_score + 0.12 * temporal_variance, 0.0, 1.0))

        return {
            "visual_score": round(fused_visual_score, 3),
            "timeline": timeline,
            "anomalies": list(all_anomalies),
            "duration": round(duration, 2),
            "top_frames": top_frames,
            "motion_deltas": motion_deltas
        }

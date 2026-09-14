import os
import cv2
import numpy as np
import soundfile as sf
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from app.main import app

client = TestClient(app)

def test_video_analysis_pipeline(tmp_path):
    # 1. Generate a small synthetic test MP4 video (30 frames, 640x480)
    video_file = tmp_path / "synthetic_test.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(video_file), fourcc, 10.0, (320, 240))

    for i in range(25):
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        # Draw simulated face circle with movement
        center = (160 + int(10 * np.sin(i / 3.0)), 120 + int(5 * np.cos(i / 3.0)))
        cv2.circle(frame, center, 40, (180, 150, 130), -1)
        # Add high-frequency noise checker to simulate synthetic artifact
        noise = np.random.randint(0, 50, (240, 320, 3), dtype=np.uint8)
        frame = cv2.add(frame, noise)
        out.write(frame)
    out.release()

    # 2. Upload video file to API
    with open(video_file, "rb") as f:
        resp = client.post(
            "/api/analyze/upload",
            files={"file": ("synthetic_test.mp4", f, "video/mp4")}
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["media_type"] == "video"
    res = data["result"]
    assert res["visual_score"] is not None
    assert "final_decision" in res
    assert "explanation" in res
    assert len(res["timeline_data"]) > 0

    # 3. Verify that Grad-CAM heatmaps were generated
    if res["heatmap_paths"]:
        first_cam = res["heatmap_paths"][0]
        assert "overlay_url" in first_cam
        assert "heatmap_url" in first_cam

def test_audio_analysis_pipeline(tmp_path):
    # 1. Generate a synthetic WAV audio file
    audio_file = tmp_path / "synthetic_audio.wav"
    sr = 16000
    t = np.linspace(0, 2.0, sr * 2)
    # Generate vocoder-like monotonic sound
    tone = 0.4 * np.sin(2 * np.pi * 300 * t) + 0.2 * np.sin(2 * np.pi * 600 * t)
    sf.write(str(audio_file), tone, sr)

    # 2. Upload audio file to API
    with open(audio_file, "rb") as f:
        resp = client.post(
            "/api/analyze/upload",
            files={"file": ("synthetic_audio.wav", f, "audio/wav")}
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["media_type"] == "audio"
    res = data["result"]
    assert res["audio_score"] is not None
    assert len(res["timeline_data"]) > 0

def test_image_analysis_pipeline(tmp_path):
    # 1. Generate a synthetic test JPEG image
    image_file = tmp_path / "synthetic_face.jpg"
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    cv2.circle(frame, (160, 120), 50, (200, 170, 150), -1)
    noise = np.random.randint(0, 40, (240, 320, 3), dtype=np.uint8)
    frame = cv2.add(frame, noise)
    cv2.imwrite(str(image_file), frame)

    # 2. Upload image file to API
    with open(image_file, "rb") as f:
        resp = client.post(
            "/api/analyze/upload",
            files={"file": ("synthetic_face.jpg", f, "image/jpeg")}
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["media_type"] == "image"
    res = data["result"]
    assert res["visual_score"] is not None
    assert "final_decision" in res
    assert "explanation" in res
    assert len(res["timeline_data"]) > 0
    assert res["timeline_data"][0]["modality"] == "image"
    if res["heatmap_paths"]:
        assert "overlay_url" in res["heatmap_paths"][0]
        assert "heatmap_url" in res["heatmap_paths"][0]


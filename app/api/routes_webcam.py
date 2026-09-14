import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.models.visual_detector import VisualDeepfakeDetector
from app.config import CONFIDENCE_THRESHOLD_FAKE, CONFIDENCE_THRESHOLD_REAL

router = APIRouter(prefix="/api/webcam", tags=["webcam"])
visual_detector = VisualDeepfakeDetector()

class WebcamFramePayload(BaseModel):
    image_base64: str  # Data URI or raw base64 string

@router.post("/analyze_frame")
def analyze_webcam_frame(payload: WebcamFramePayload):
    """
    Receives base64-encoded webcam frame, computes real-time face detection,
    spatial FFT analysis, and Grad-CAM activation heatmap overlay.
    """
    raw_b64 = payload.image_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(raw_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    result = visual_detector.analyze_frame(frame)
    score = result["score"]

    if score >= CONFIDENCE_THRESHOLD_FAKE:
        decision = "Likely Fake"
    elif score <= CONFIDENCE_THRESHOLD_REAL:
        decision = "Real"
    else:
        decision = "Suspicious"

    # Encode annotated frame and heatmap back to base64 JPEG
    _, annotated_buf = cv2.imencode(".jpg", result["overlay_frame"], [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(annotated_buf).decode("utf-8")

    _, heatmap_buf = cv2.imencode(".jpg", result["heatmap_frame"], [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    heatmap_b64 = "data:image/jpeg;base64," + base64.b64encode(heatmap_buf).decode("utf-8")

    return {
        "score": score,
        "decision": decision,
        "confidence_percent": round(score * 100, 1),
        "quality_score": result.get("quality_score", 0.8),
        "face_detected": result["face_detected"],
        "faces_count": result["faces_count"],
        "anomalies": result["anomalies"],
        "bounding_boxes": result["bounding_boxes"],
        "annotated_frame": annotated_b64,
        "heatmap_frame": heatmap_b64
    }

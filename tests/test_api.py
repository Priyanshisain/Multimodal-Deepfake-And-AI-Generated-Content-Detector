import base64
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import init_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()

client = TestClient(app)

def test_get_dashboard():
    response = client.get("/")
    assert response.status_code == 200
    assert "Multimodel Deepfake and AI Generated Content Detector" in response.text

def test_analyze_text_upload():
    response = client.post(
        "/api/analyze/upload",
        data={"text_input": "Furthermore, in summary this generative model showcases remarkable capabilities."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "analysis_id" in data
    assert "result" in data
    assert "final_decision" in data["result"]
    assert "fused_score" in data["result"]

def test_webcam_analyze_frame():
    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", dummy)
    b64_str = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

    response = client.post(
        "/api/webcam/analyze_frame",
        json={"image_base64": b64_str}
    )
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "decision" in data
    assert "annotated_frame" in data

def test_history_and_feedback():
    import uuid
    uid = uuid.uuid4().hex[:8]
    # 0. Create user and get token
    signup_resp = client.post("/api/auth/signup", json={
        "username": f"user_{uid}",
        "email": f"user_{uid}@detection.ai",
        "password": "Password123!"
    })
    assert signup_resp.status_code == 201
    token = signup_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Run an analysis with auth
    analysis_resp = client.post(
        "/api/analyze/upload",
        data={"text_input": "Natural human conversation sample for historical logging verification."},
        headers=auth_headers
    )
    analysis_id = analysis_resp.json()["analysis_id"]

    # 2. Check history with auth
    hist_resp = client.get("/api/history", headers=auth_headers)
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["total"] >= 1

    # 3. Check history detail
    detail_resp = client.get(f"/api/history/{analysis_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["analysis_id"] == analysis_id

    # 4. Submit feedback
    fb_resp = client.post(
        "/api/feedback",
        json={"analysis_id": analysis_id, "is_correct": True, "user_comment": "Accurate prediction."}
    )
    assert fb_resp.status_code == 200
    assert fb_resp.json()["status"] == "success"

def test_report_downloads():
    # Run analysis
    analysis_resp = client.post(
        "/api/analyze/upload",
        data={"text_input": "Verification report generation test text sequence."}
    )
    analysis_id = analysis_resp.json()["analysis_id"]

    # PDF download
    pdf_resp = client.get(f"/api/reports/{analysis_id}/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"

    # JSON download
    json_resp = client.get(f"/api/reports/{analysis_id}/json")
    assert json_resp.status_code == 200
    data = json_resp.json()
    assert "metadata" in data
    assert "detection_results" in data

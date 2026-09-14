from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_session_timeout_implementation():
    response = client.get('/')
    assert response.status_code == 200
    html = response.text
    
    assert 'detector_last_activity' in html
    assert 'SESSION_TIMEOUT_MS' in html
    assert 'checkSessionTimeout' in html
    assert 'resetInactivityClock' in html
    assert 'Session expired due to inactivity' in html

def test_modality_icons_on_hover_markup_and_css():
    response = client.get('/')
    assert response.status_code == 200
    html = response.text
    
    assert 'data-mode="video"' in html
    assert 'data-mode="image"' in html
    assert 'data-mode="audio"' in html
    assert 'data-mode="text"' in html
    
    assert 'fileModalityHoverBadge' in html
    assert 'fileModalityHoverIcon' in html
    assert 'fileModalityHoverLabel' in html
    assert 'previewModalityHoverOverlay' in html
    assert 'videoModalityHoverOverlay' in html
    assert 'audioModalityHoverOverlay' in html
    assert 'filePillModalityIcon' in html
    
    assert '🎙️' in html
    assert '🖼️' in html
    assert '🎥' in html
    assert '📝' in html
    
    assert '.file-modality-hover-badge' in html
    assert '.selected-file-pill:hover .file-modality-hover-badge' in html
    assert '.preview-modality-hover-overlay' in html

def test_clear_uploaded_file_on_page_change():
    response = client.get('/')
    assert response.status_code == 200
    html = response.text
    
    assert 'window.clearUploadedFile' in html
    
    with open('app/static/js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
    
    assert 'window.clearUploadedFile' in app_js
    assert 'tabId !== "upload-tab"' in app_js
    assert 'currentFile = null' in app_js
    assert 'fileInput.value = ""' in app_js
    assert 'applyModalityHoverIcon' in app_js
    assert 'MODALITY_MAP' in app_js

def test_auth_js_inactivity_and_cleanup():
    with open('app/static/js/auth.js', 'r', encoding='utf-8') as f:
        auth_js = f.read()
        
    assert 'detector_last_activity' in auth_js
    assert 'window.checkSessionTimeout' in auth_js
    assert 'window.clearUploadedFile' in auth_js
    assert 'Session expired due to inactivity' in auth_js

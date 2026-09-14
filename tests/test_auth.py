import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService
from app.database.connection import init_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()

client = TestClient(app)

def test_password_hashing():
    password = "SuperSecurePassword123!"
    salt = AuthService.generate_salt()
    pw_hash = AuthService.hash_password(password, salt)

    assert AuthService.verify_password(password, salt, pw_hash) is True
    assert AuthService.verify_password("WrongPassword!", salt, pw_hash) is False

def test_jwt_token_creation_and_decoding():
    token = AuthService.create_access_token("test-user-id", "testagent", "agent@agency.org")
    assert isinstance(token, str)

    payload = AuthService.decode_token(token)
    assert payload is not None
    assert payload["sub"] == "test-user-id"
    assert payload["username"] == "testagent"
    assert payload["email"] == "agent@agency.org"

def test_signup_and_signin_flow():
    import uuid
    uid = uuid.uuid4().hex[:8]
    username = f"analyst_{uid}"
    email = f"analyst_{uid}@detection.ai"
    password = "ClassifiedSecret99!"

    # 1. Sign up
    signup_resp = client.post("/api/auth/signup", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert signup_resp.status_code == 201
    signup_data = signup_resp.json()
    assert "access_token" in signup_data
    token = signup_data["access_token"]
    assert signup_data["user"]["username"] == username

    # 2. Duplicate signup should be rejected
    dup_resp = client.post("/api/auth/signup", json={
        "username": username,
        "email": f"different_{uid}@detection.ai",
        "password": password
    })
    assert dup_resp.status_code == 400

    # 3. Sign in with username
    signin_resp = client.post("/api/auth/signin", json={
        "username_or_email": username,
        "password": password
    })
    assert signin_resp.status_code == 200
    assert "access_token" in signin_resp.json()

    # 4. Sign in with email
    signin_email_resp = client.post("/api/auth/signin", json={
        "username_or_email": email,
        "password": password
    })
    assert signin_email_resp.status_code == 200

    # 5. Invalid credentials rejected
    bad_signin = client.post("/api/auth/signin", json={
        "username_or_email": username,
        "password": "IncorrectPassword"
    })
    assert bad_signin.status_code == 401

    # 6. Profile check with token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == username

    # 7. Profile check without token rejected
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401

def test_history_protected_by_auth():
    import uuid
    uid = uuid.uuid4().hex[:8]
    # Unauthenticated history request rejected
    resp = client.get("/api/history")
    assert resp.status_code == 401

    # Authenticated user can view history
    signup_resp = client.post("/api/auth/signup", json={
        "username": f"tester_{uid}",
        "email": f"tester_{uid}@detection.ai",
        "password": "Password123!"
    })
    assert signup_resp.status_code == 201
    token = signup_resp.json()["access_token"]

    auth_hist = client.get("/api/history", headers={"Authorization": f"Bearer {token}"})
    assert auth_hist.status_code == 200
    assert "items" in auth_hist.json()

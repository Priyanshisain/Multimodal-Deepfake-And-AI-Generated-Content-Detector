from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_index_page_routes():
    for route in ['/', '/login', '/signin', '/signup', '/register']:
        response = client.get(route)
        assert response.status_code == 200, f'Failed on {route}'
        html = response.text
        assert 'id="navLoginBtn"' in html
        assert 'id="navSignUpBtn"' in html
        assert 'id="authTabSignIn"' in html
        assert 'id="authTabSignUp"' in html
        assert 'id="portalSignInForm"' in html
        assert 'id="portalSignUpForm"' in html
        assert 'portal-switch-row' in html
        assert 'window.switchAuthTab' in html

def test_signup_signin_e2e_flow():
    uname = f'user_{uuid.uuid4().hex[:6]}'
    email = f'{uname}@agency.org'
    password = 'SecretPassword123!'
    
    # 1. Sign up
    res = client.post('/api/auth/signup', json={'username': uname, 'email': email, 'password': password})
    assert res.status_code == 201
    data = res.json()
    token = data['access_token']
    assert token
    
    # 2. Sign in
    res2 = client.post('/api/auth/signin', json={'username_or_email': uname, 'password': password})
    assert res2.status_code == 200
    assert res2.json()['access_token']
    
    # 3. /me check
    res3 = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert res3.status_code == 200
    assert res3.json()['username'] == uname

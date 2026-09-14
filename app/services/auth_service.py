import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from pydantic import BaseModel, EmailStr, Field

JWT_SECRET = os.getenv("JWT_SECRET", "multimodel-detector-auth-key-9f8a7b6c5d4e3f2a1b0c")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class AuthService:
    @staticmethod
    def generate_salt() -> str:
        """Generates a secure 16-byte random hex salt."""
        return secrets.token_hex(16)

    @classmethod
    def hash_password(cls, password: str, salt: str) -> str:
        """
        NIST-compliant PBKDF2-HMAC-SHA256 with 100,000 iterations.
        """
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        return key.hex()

    @classmethod
    def verify_password(cls, password: str, salt: str, password_hash: str) -> bool:
        """Constant-time password hash comparison."""
        computed_hash = cls.hash_password(password, salt)
        return secrets.compare_digest(computed_hash, password_hash)

    @staticmethod
    def create_access_token(user_id: str, username: str, email: str) -> str:
        """Creates a signed JWT access token."""
        payload = {
            "sub": user_id,
            "username": username,
            "email": email,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Validates and decodes JWT access token."""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

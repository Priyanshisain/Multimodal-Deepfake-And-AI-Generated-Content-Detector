import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.database.models import User
from app.services.auth_service import AuthService, UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user account with secure password hashing."""
    # Check if username or email already exists
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered. Please choose another."
        )
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use."
        )

    salt = AuthService.generate_salt()
    pw_hash = AuthService.hash_password(payload.password, salt)

    user = User(
        user_id=str(uuid.uuid4()),
        username=payload.username,
        email=payload.email,
        password_hash=pw_hash,
        salt=salt,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = AuthService.create_access_token(user.user_id, user.username, user.email)
    return {
        "status": "success",
        "message": "Account created successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/signin")
def signin(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user credentials and issues a signed JWT token."""
    identifier = payload.username_or_email.strip()
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    if not AuthService.verify_password(payload.password, user.salt, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    token = AuthService.create_access_token(user.user_id, user.username, user.email)
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        }
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information and analysis stats for current user."""
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat(),
        "total_analyses": len(current_user.analyses) if current_user.analyses else 0
    }

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models import User, UserRole
from app.schemas import LoginRequest, RegisterRequest, Token
from app.utils.auth import create_access_token, get_password_hash, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    try:
        user_count = db.query(User).count()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while checking user count")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )

    if user_count > 0:
        raise HTTPException(
            status_code=403,
            detail="Registration is disabled. Contact an administrator.",
        )

    try:
        existing_user = db.query(User).filter(User.email == data.email).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while checking existing email")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        user = User(
            name=data.name,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=UserRole.ADMIN,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while registering user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user due to a database error."
        )

    token = create_access_token({"sub": str(user.user_id), "role": user.role.value})
    return Token(access_token=token, role=user.role, name=user.name)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == data.email).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred during login query")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")
    token = create_access_token({"sub": str(user.user_id), "role": user.role.value})
    return Token(access_token=token, role=user.role, name=user.name)

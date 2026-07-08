import sys
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt
import bcrypt
from fastapi.concurrency import run_in_threadpool
from app.config import settings

def hash_password_sync(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

async def get_password_hash(password: str) -> str:
    return await run_in_threadpool(hash_password_sync, password)

def verify_password_sync(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    return await run_in_threadpool(verify_password_sync, plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, scope: str = "default") -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "db_context": scope
    })
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
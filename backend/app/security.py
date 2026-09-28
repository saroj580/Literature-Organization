import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.database import get_conn

bearer = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8   # session lasts 8 hours; re-login required after

def hash_password(password: str) -> str:
    """Hash a password using native bcrypt (bypassing broken passlib 1.7.4 on Python 3.12)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hashed password string."""
    try:
        plain_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False

def get_jwt_secret() -> str:
    conn = get_conn()
    row = conn.execute("SELECT value FROM settings WHERE key = 'jwt_secret'").fetchone()
    conn.close()
    if not row:
        raise RuntimeError("JWT secret not initialized in database settings.")
    return row["value"]

def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    """FastAPI dependency — validates Bearer token on every protected route."""
    conn = get_conn()
    has_user = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
    conn.close()

    # If no user exists yet, allow initial setup/unauthenticated access
    if not has_user:
        return "setup-pending"

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(credentials.credentials, get_jwt_secret(), algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise ValueError
        return username
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

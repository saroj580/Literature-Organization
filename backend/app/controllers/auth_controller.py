from fastapi import HTTPException
from app.database import get_conn
from app.security import hash_password, verify_password, create_token, TOKEN_EXPIRE_HOURS
from app.schemas import AuthRequest

class AuthController:
    @staticmethod
    def get_status() -> dict:
        conn = get_conn()
        user = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
        conn.close()
        return {"setup_required": user is None}

    @staticmethod
    def setup(req: AuthRequest) -> dict:
        conn = get_conn()
        existing = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="App already set up. Use /auth/login.")
        if len(req.password) < 4:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")
        hashed = hash_password(req.password)
        username = req.username.strip() or "admin"
        conn.execute(
            "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
            (username, hashed),
        )
        conn.commit()
        conn.close()
        return {"message": "Account created. You can now log in."}

    @staticmethod
    def login(req: AuthRequest) -> dict:
        conn = get_conn()
        user = conn.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
        conn.close()
        if not user or not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Incorrect username or password.")
        token = create_token(req.username)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in_hours": TOKEN_EXPIRE_HOURS,
        }

    @staticmethod
    def change_password(req: AuthRequest) -> dict:
        conn = get_conn()
        user = conn.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found.")
        if len(req.password) < 4:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")
        hashed = hash_password(req.password)
        conn.execute("UPDATE users SET hashed_password = ? WHERE username = ?", (hashed, req.username))
        conn.commit()
        conn.close()
        return {"message": "Password changed successfully."}

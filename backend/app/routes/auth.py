from fastapi import APIRouter, Depends
from app.schemas import AuthRequest
from app.security import verify_token
from app.controllers.auth_controller import AuthController

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/status")
def auth_status():
    """Returns whether the app needs first-run setup or just login."""
    return AuthController.get_status()

@router.post("/setup")
def auth_setup(req: AuthRequest):
    """
    First-run only: creates the single local user account.
    Fails if a user already exists (prevents account hijacking).
    """
    return AuthController.setup(req)

@router.post("/login")
def auth_login(req: AuthRequest):
    """Verify credentials and return a signed JWT (valid for 8 hours)."""
    return AuthController.login(req)

@router.post("/change-password")
def change_password(req: AuthRequest, _: str = Depends(verify_token)):
    """Change password (requires current valid session)."""
    return AuthController.change_password(req)

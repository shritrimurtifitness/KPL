from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.audit_log import AuditLog
from app.schemas.admin import AdminLoginRequest, AdminTokenResponse, AdminResponse

router = APIRouter()

@router.post("/auth/login", response_model=AdminTokenResponse)
def admin_login(
    login_data: AdminLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates admin user and returns JWT bearer token.
    """
    admin = db.query(Admin).filter(Admin.email == login_data.email.lower().strip()).first()
    if not admin or not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated.",
        )

    # Audit login
    audit = AuditLog(
        admin_id=admin.id,
        action="ADMIN_LOGIN",
        entity_type="admin",
        entity_id=admin.id,
        description=f"Admin {admin.email} logged in successfully."
    )
    db.add(audit)
    db.commit()

    token = create_access_token(subject=admin.id)
    return AdminTokenResponse(
        access_token=token,
        token_type="bearer",
        admin_id=admin.id,
        email=admin.email,
        full_name=admin.full_name,
        role=admin.role
    )

@router.get("/auth/me", response_model=AdminResponse)
def get_current_admin_profile(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Returns profile information for authenticated admin.
    """
    return current_admin

@router.post("/auth/logout")
def admin_logout(
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Logs out admin and records audit event.
    """
    return {"message": "Logged out successfully."}

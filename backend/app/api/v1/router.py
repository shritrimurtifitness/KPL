from fastapi import APIRouter
from app.api.v1.endpoints import (
    public,
    admin_auth,
    admin_dashboard,
    admin_payments,
    admin_settings
)

api_router = APIRouter()

# Public Routes
api_router.include_router(public.router, tags=["Public"])

# Admin Routes
api_router.include_router(admin_auth.router, prefix="/admin", tags=["Admin Auth"])
api_router.include_router(admin_dashboard.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(admin_payments.router, prefix="/admin", tags=["Admin Payments"])
api_router.include_router(admin_settings.router, prefix="/admin", tags=["Admin Settings"])

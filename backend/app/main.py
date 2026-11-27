from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security import get_password_hash
from app.database.session import engine, Base, SessionLocal
from app.models.admin import Admin
from app.models.league_settings import LeagueSettings
from app.api.v1.router import api_router
from app.services.slot_manager import SlotManager

def init_db():
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE registrations ADD COLUMN photo_path VARCHAR(500)"))
            conn.commit()
    except Exception:
        pass
    db = SessionLocal()
    try:
        # 1. Seed initial admin if none exists
        admin_count = db.query(Admin).count()
        if admin_count == 0:
            initial_admin = Admin(
                email=settings.INITIAL_ADMIN_EMAIL.lower().strip(),
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name=settings.INITIAL_ADMIN_NAME,
                role="superadmin",
                is_active=True
            )
            db.add(initial_admin)
            db.commit()
            print(f"[Init] Seeded initial admin: {settings.INITIAL_ADMIN_EMAIL}")

        # 2. Seed initial league settings if none exists
        settings_row = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
        if not settings_row:
            default_settings = LeagueSettings(
                id=1,
                league_name="Karnataka Premier League",
                tournament_title="KPL Cricket Championship Season 2027",
                registration_fee=100.00,
                maximum_registrations=120,
                registration_open=True,
                reservation_minutes=15,
                upi_id="indrajeet.shirgaonkar-1@okaxis",
                upi_display_name="INDUJI",
                upi_qr_path="/images/official_upi_qr.png",
                whatsapp_number="+919876543210",
                registration_prefix="KPL",
                registration_year=2027,
                terms_and_conditions=(
                    "1. Registration is strictly non-transferable and valid for one participant only.\n"
                    "2. Players must carry a government photo ID (Aadhaar/Driving License/Voter ID) to trials.\n"
                    "3. Registration fee of ₹100 is non-refundable once approved.\n"
                    "4. All matches follow standard BCCI/ICC T20 tournament playing conditions.\n"
                    "5. The organizing committee's decision regarding schedule and disputes is final."
                ),
                registration_instructions=(
                    "1. Fill out your accurate player profile and submit to temporarily reserve your slot for 15 minutes.\n"
                    "2. Pay ₹100 to the official UPI ID or scan the UPI QR code.\n"
                    "3. Enter your 12-digit UPI UTR reference number and upload the screenshot proof.\n"
                    "4. Once submitted, our admin team will review and confirm your registration."
                ),
                max_upload_size_mb=3
            )
            db.add(default_settings)
            db.commit()
            print("[Init] Seeded default League Settings.")

        # 3. Clean up any expired reservations on boot
        expired_count = SlotManager.cleanup_expired_reservations(db)
        if expired_count > 0:
            print(f"[Init] Cleaned up {expired_count} expired reservations.")

    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cricket League Registration, Concurrency Slot Reservation & Manual UPI Payment Management System",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV,
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please try again later."},
    )

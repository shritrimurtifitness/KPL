import os
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.models.admin import Admin
from app.models.league_settings import LeagueSettings
from app.main import app

# Test database
TEST_DB_FILE = "./test_cricket.db"
TEST_SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 15}
)

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=15000")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def default_league_settings(db_session):
    settings_obj = db_session.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    if not settings_obj:
        settings_obj = LeagueSettings(
            id=1,
            league_name="KPL Cricket Championship",
            tournament_title="Season 2027",
            registration_fee=100.00,
            maximum_registrations=120,
            registration_open=True,
            reservation_minutes=10,
            upi_id="kpl@upi",
            upi_display_name="KPL Official",
            whatsapp_number="+919876543210",
            registration_prefix="KPL",
            registration_year=2027
        )
        db_session.add(settings_obj)
        db_session.commit()
        db_session.refresh(settings_obj)
    return settings_obj

@pytest.fixture
def test_admin(db_session):
    admin = db_session.query(Admin).filter(Admin.email == "testadmin@cricket.com").first()
    if not admin:
        admin = Admin(
            email="testadmin@cricket.com",
            password_hash=get_password_hash("AdminPass123"),
            full_name="Test Administrator",
            role="superadmin",
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return admin

@pytest.fixture
def admin_headers(test_admin):
    token = create_access_token(subject=test_admin.id)
    return {"Authorization": f"Bearer {token}"}

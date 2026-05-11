import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app, get_db
from app.models import Base

TEST_DB_URL = "sqlite:///./test_commute.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()

client = TestClient(app)

def test_get_settings():
    response = client.get("/settings")
    assert response.status_code == 200
    data = response.json()
    assert "salary" in data
    assert data["salary"] == 192000

def test_update_settings():
    new_settings = {"salary": 200000}
    response = client.post("/settings", json=new_settings)
    assert response.status_code == 200
    assert response.json()["salary"] == 200000
    
    # Verify it persisted
    response = client.get("/settings")
    assert response.json()["salary"] == 200000

def test_calculate_endpoint():
    # Test a simple driving calculation
    calc_request = {
        "one_way_miles": 25,
        "use_irs_rate": True,
        "commute_type": "driving"
    }
    response = client.post("/calculate", json=calc_request)
    assert response.status_code == 200
    data = response.json()
    assert "annual_cost" in data
    assert "adjusted_salary" in data
    # 192k salary + 7537.5 cost + (time cost if included)
    # If we default to 0 time in the request, it should be at least salary + driving cost
    assert data["adjusted_salary"] >= 192000 + 7537.5

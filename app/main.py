from fastapi import FastAPI, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models import Base, UserSettings
from app.schemas import UserSettingsSchema, CalculateRequest, CalculateResponse
from app.calculations import CalculationEngine

SQLALCHEMY_DATABASE_URL = "sqlite:///./commute.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_settings(db: Session):
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.get("/settings", response_model=UserSettingsSchema)
def read_settings(db: Session = Depends(get_db)):
    return get_current_settings(db)

@app.post("/settings", response_model=UserSettingsSchema)
def update_settings(settings_update: UserSettingsSchema, db: Session = Depends(get_db)):
    db_settings = get_current_settings(db)
    for key, value in settings_update.model_dump(exclude_unset=True).items():
        setattr(db_settings, key, value)
    db.commit()
    db.refresh(db_settings)
    return db_settings

@app.post("/calculate", response_model=CalculateResponse)
def calculate(request: CalculateRequest, db: Session = Depends(get_db)):
    s = get_current_settings(db)
    engine = CalculationEngine(
        salary=s.salary,
        work_weeks=s.work_weeks,
        work_days_per_week=s.work_days_per_week,
        fuel_price=s.fuel_price,
        mpg_city=s.mpg_city,
        mpg_hwy=s.mpg_hwy,
        irs_rate=s.irs_rate
    )
    
    if request.commute_type == "driving":
        drive_costs = engine.calculate_driving_costs(request.one_way_miles, request.use_irs_rate, request.is_highway)
        time_costs = engine.calculate_time_cost(request.one_way_minutes)
        
        annual_cost = drive_costs['annual_cost']
        annual_hours_wasted = time_costs['annual_hours_wasted']
        annual_time_cost = time_costs['annual_time_cost']
    else: # mixed
        mixed = engine.calculate_mixed_mode(
            request.drive_one_way_miles,
            request.transit_daily_cost,
            request.transit_one_way_minutes,
            request.drive_one_way_minutes,
            request.use_irs_rate
        )
        annual_cost = mixed['annual_total_cost']
        annual_hours_wasted = mixed['annual_hours_wasted']
        annual_time_cost = mixed['annual_time_cost']
        
    adjusted_salary = s.salary + annual_cost + annual_time_cost
    
    # Effective hourly rate: Salary / (Work hours + Commute hours)
    total_hours = engine.annual_work_hours + annual_hours_wasted
    effective_hourly_rate = s.salary / total_hours
    
    ebike_roi = None
    if request.one_way_miles <= 25:
        ebike_roi = engine.calculate_ebike_roi(request.one_way_miles, 4000, 100)
        
    return {
        "annual_cost": annual_cost,
        "annual_hours_wasted": annual_hours_wasted,
        "annual_time_cost": annual_time_cost,
        "adjusted_salary": adjusted_salary,
        "effective_hourly_rate": effective_hourly_rate,
        "ebike_roi": ebike_roi
    }

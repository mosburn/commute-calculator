from sqlalchemy import Column, Integer, Float, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    salary = Column(Float, default=192000.0)
    work_weeks = Column(Integer, default=45)
    work_days_per_week = Column(Float, default=5.0)
    fuel_price = Column(Float, default=5.45)
    mpg_city = Column(Float, default=12.0)
    mpg_hwy = Column(Float, default=16.0)
    irs_rate = Column(Float, default=0.67)
    use_metric = Column(Boolean, default=False)

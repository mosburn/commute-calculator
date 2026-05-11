from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    salary: Optional[float] = None
    work_weeks: Optional[int] = None
    work_days_per_week: Optional[int] = None
    fuel_price: Optional[float] = None
    mpg_city: Optional[float] = None
    mpg_hwy: Optional[float] = None
    irs_rate: Optional[float] = None
    use_metric: Optional[bool] = None

class CalculateRequest(BaseModel):
    one_way_miles: float
    one_way_minutes: Optional[float] = 0
    use_irs_rate: Optional[bool] = True
    is_highway: Optional[bool] = False
    commute_type: str = "driving" # driving, mixed
    
    # For mixed mode
    drive_one_way_miles: Optional[float] = 0
    drive_one_way_minutes: Optional[float] = 0
    transit_daily_cost: Optional[float] = 0
    transit_one_way_minutes: Optional[float] = 0

class CalculateResponse(BaseModel):
    annual_cost: float
    annual_hours_wasted: float
    annual_time_cost: float
    adjusted_salary: float
    effective_hourly_rate: float
    ebike_roi: Optional[dict] = None

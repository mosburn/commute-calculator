import pytest
from app.calculations import CalculationEngine

@pytest.fixture
def default_engine():
    # Default settings from design doc
    return CalculationEngine(
        salary=192000,
        work_weeks=45,
        work_days_per_week=5,
        fuel_price=5.45,
        mpg_city=12,
        mpg_hwy=16,
        irs_rate=0.67
    )

def test_driving_cost_irs(default_engine):
    # 25 miles one way, 50 miles round trip
    # 225 days * 50 miles = 11,250 miles
    # 11,250 * 0.67 = 7537.5
    result = default_engine.calculate_driving_costs(
        one_way_miles=25,
        use_irs_rate=True
    )
    assert result['annual_cost'] == 7537.5

def test_driving_cost_fuel(default_engine):
    # 25 miles one way, 50 miles round trip, 225 days = 11,250 miles
    # Using highway mpg (16)
    # 11,250 / 16 = 703.125 gallons
    # 703.125 * 5.45 = 3832.03125
    result = default_engine.calculate_driving_costs(
        one_way_miles=25,
        use_irs_rate=False,
        is_highway=True
    )
    assert pytest.approx(result['annual_cost'], 0.01) == 3832.03

def test_time_cost(default_engine):
    # 192,000 salary / (45 weeks * 5 days * 8 hours) = 106.666...
    # 1 hour each way = 2 hours/day
    # 225 days * 2 hours = 450 hours
    # 450 * 106.666... = 48,000
    result = default_engine.calculate_time_cost(one_way_minutes=60)
    assert pytest.approx(result['annual_time_cost'], 0.01) == 48000
    assert result['annual_hours_wasted'] == 450

def test_mixed_mode_rtd(default_engine):
    # Drive 27km (16.777 miles) to station, then train
    # Driving cost (IRS): 16.777 * 2 * 225 * 0.67 = 5058.27
    # Train cost: $5.50/day * 225 = 1237.5
    # Total annual cost: 6295.77
    
    # 27km = 16.777 miles
    drive_miles = 27 * 0.621371
    
    result = default_engine.calculate_mixed_mode(
        drive_one_way_miles=drive_miles,
        transit_daily_cost=5.50,
        transit_one_way_minutes=45,
        drive_one_way_minutes=20
    )
    
    # Annual Driving: drive_miles * 2 * 225 * 0.67
    expected_drive_cost = drive_miles * 2 * 225 * 0.67
    expected_transit_cost = 5.50 * 225
    assert pytest.approx(result['annual_total_cost'], 0.1) == expected_drive_cost + expected_transit_cost

def test_ebike_roi(default_engine):
    # Trek FX+ $4000 + $100 charger = $4100
    # Replacing a 10 mile one-way commute (20 miles daily)
    # Daily savings (IRS): 20 * 0.67 = 13.4
    # Days to break even: 4100 / 13.4 = 305.97
    result = default_engine.calculate_ebike_roi(
        one_way_miles=10,
        bike_cost=4000,
        extra_costs=100
    )
    assert result['eligible'] is True
    assert pytest.approx(result['break_even_days'], 0.1) == 305.97

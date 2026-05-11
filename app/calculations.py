class CalculationEngine:
    def __init__(self, salary, work_weeks, fuel_price, mpg_city, mpg_hwy, irs_rate=0.67, commute_days_per_week=5):
        self.salary = salary
        self.work_weeks = work_weeks
        self.fuel_price = fuel_price
        self.mpg_city = mpg_city
        self.mpg_hwy = mpg_hwy
        self.irs_rate = irs_rate
        self.commute_days_per_week = commute_days_per_week

        # Salary basis always assumes a full 5-day work week
        self.annual_work_hours = work_weeks * 5 * 8
        self.hourly_rate = self.salary / self.annual_work_hours
        # Commute only happens on in-office days
        self.annual_work_days = work_weeks * commute_days_per_week

    def calculate_driving_costs(self, one_way_miles, use_irs_rate=True, is_highway=False):
        daily_miles = one_way_miles * 2
        annual_miles = daily_miles * self.annual_work_days
        
        if use_irs_rate:
            annual_cost = annual_miles * self.irs_rate
        else:
            mpg = self.mpg_hwy if is_highway else self.mpg_city
            annual_gallons = annual_miles / mpg
            annual_cost = annual_gallons * self.fuel_price
            
        return {
            "annual_cost": annual_cost,
            "annual_miles": annual_miles
        }

    def calculate_time_cost(self, one_way_minutes):
        daily_hours = (one_way_minutes * 2) / 60
        annual_hours_wasted = daily_hours * self.annual_work_days
        annual_time_cost = annual_hours_wasted * self.hourly_rate
        
        return {
            "annual_hours_wasted": annual_hours_wasted,
            "annual_time_cost": annual_time_cost
        }

    def calculate_mixed_mode(self, drive_one_way_miles, transit_daily_cost, transit_one_way_minutes, drive_one_way_minutes, use_irs_rate=True):
        drive_stats = self.calculate_driving_costs(drive_one_way_miles, use_irs_rate=use_irs_rate)
        transit_annual_cost = transit_daily_cost * self.annual_work_days
        
        total_one_way_minutes = transit_one_way_minutes + drive_one_way_minutes
        time_stats = self.calculate_time_cost(total_one_way_minutes)
        
        return {
            "annual_driving_cost": drive_stats['annual_cost'],
            "annual_transit_cost": transit_annual_cost,
            "annual_total_cost": drive_stats['annual_cost'] + transit_annual_cost,
            "annual_hours_wasted": time_stats['annual_hours_wasted'],
            "annual_time_cost": time_stats['annual_time_cost']
        }

    def calculate_ebike_roi(self, one_way_miles, bike_cost, extra_costs=0):
        # Eligible if under 25 miles
        eligible = one_way_miles <= 25
        
        total_investment = bike_cost + extra_costs
        # Savings compared to driving (IRS rate)
        daily_miles = one_way_miles * 2
        daily_savings = daily_miles * self.irs_rate
        
        break_even_days = total_investment / daily_savings if daily_savings > 0 else float('inf')
        
        return {
            "eligible": eligible,
            "total_investment": total_investment,
            "daily_savings": daily_savings,
            "break_even_days": break_even_days,
            "break_even_months": break_even_days / (self.annual_work_days / self.work_weeks * 4.33) # rough month estimate
        }

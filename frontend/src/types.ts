export interface UserSettings {
  salary: number;
  work_weeks: number;
  work_days_per_week: number;
  fuel_price: number;
  mpg_city: number;
  mpg_hwy: number;
  irs_rate: number;
  use_metric: boolean;
}

export interface CalculateRequest {
  one_way_miles: number;
  one_way_minutes: number;
  use_irs_rate: boolean;
  is_highway: boolean;
  commute_type: 'driving' | 'mixed';
  drive_one_way_miles?: number;
  drive_one_way_minutes?: number;
  transit_daily_cost?: number;
  transit_one_way_minutes?: number;
  ebike_price?: number;
  ebike_extra_costs?: number;
}

export interface CalculateResponse {
  annual_cost: number;
  annual_hours_wasted: number;
  annual_time_cost: number;
  adjusted_salary: number;
  effective_hourly_rate: number;
  ebike_roi?: {
    eligible: boolean;
    total_investment: number;
    daily_savings: number;
    break_even_days: number;
    break_even_months: number;
  };
}

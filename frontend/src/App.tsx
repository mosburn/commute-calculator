import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Settings, 
  Car, 
  Train, 
  Bike, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { UserSettings, CalculateRequest, CalculateResponse } from './types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// 2025 federal tax brackets, single filer
const FEDERAL_BRACKETS = [
  { limit: 11925,  rate: 0.10 },
  { limit: 48475,  rate: 0.12 },
  { limit: 103350, rate: 0.22 },
  { limit: 197300, rate: 0.24 },
  { limit: 250525, rate: 0.32 },
  { limit: 626350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
];

function federalMarginalRate(salary: number): number {
  for (const bracket of FEDERAL_BRACKETS) {
    if (salary <= bracket.limit) return bracket.rate;
  }
  return 0.37;
}

function App() {
  const [settings, setSettings] = useState<UserSettings>({
    salary: 192000,
    work_weeks: 45,
    work_days_per_week: 5,
    fuel_price: 5.45,
    mpg_city: 12,
    mpg_hwy: 16,
    irs_rate: 0.67,
    use_metric: false
  });

  const [timeOff, setTimeOff] = useState({ vacation_days: 15, holiday_days: 10 });
  const [officeFreqMode, setOfficeFreqMode] = useState<'week' | 'month'>('week');
  const [daysPerMonth, setDaysPerMonth] = useState(16);

  const deriveWorkWeeks = (vacDays: number, holDays: number) =>
    Math.max(1, (52 * 5 - vacDays - holDays) / 5);

  const handleTimeOffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...timeOff, [e.target.name]: parseInt(e.target.value) || 0 };
    setTimeOff(updated);
    const weeks = deriveWorkWeeks(updated.vacation_days, updated.holiday_days);
    updateSettings({ work_weeks: parseFloat(weeks.toFixed(2)) });
  };

  const [calcParams, setCalcParams] = useState<CalculateRequest>({
    one_way_miles: 25,
    one_way_minutes: 45,
    use_irs_rate: true,
    is_highway: false,
    commute_type: 'driving',
    drive_one_way_miles: 16.7,
    drive_one_way_minutes: 20,
    transit_daily_cost: 5.50,
    transit_one_way_minutes: 45,
    ebike_price: 4000,
    ebike_extra_costs: 100
  });

  const [results, setResults] = useState<CalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [parkingIncluded, setParkingIncluded] = useState(false);
  const [dailyParkingCost, setDailyParkingCost] = useState(15);
  const [stateTaxRate, setStateTaxRate] = useState(4.63); // Colorado default

  const annualParkingCost = parkingIncluded
    ? 0
    : dailyParkingCost * settings.work_weeks * settings.work_days_per_week;

  const federalRate = federalMarginalRate(settings.salary);
  const totalMarginalRate = federalRate + stateTaxRate / 100;
  const grossUpFactor = 1 / (1 - totalMarginalRate);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const res = await axios.post('/api/settings', newSettings);
      setSettings(res.data);
    } catch (err) {
      console.error("Error updating settings", err);
    }
  };

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/calculate', calcParams);
      setResults(res.data);
    } catch (err) {
      console.error("Error calculating", err);
    } finally {
      setLoading(false);
    }
  }, [calcParams]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    calculate();
  }, [calculate, settings]);

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : parseFloat(value);
    updateSettings({ [name]: val });
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const val = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value);
    setCalcParams(prev => ({ ...prev, [name]: val }));
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const chartData = results ? [
    { name: 'Fuel/Maint', value: results.annual_cost },
    { name: 'Time Value', value: results.annual_time_cost },
    ...(annualParkingCost > 0 ? [{ name: 'Parking', value: annualParkingCost }] : []),
  ] : [];

  const unitDist = settings.use_metric ? "km" : "miles";
  const distLabel = (val: number) => settings.use_metric ? (val * 1.60934).toFixed(1) : val.toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Annual Salary</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="number" name="salary" value={settings.salary} onChange={handleSettingChange}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Federal marginal: {(federalRate * 100).toFixed(0)}%</span>
              <span>Total marginal: {(totalMarginalRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">State Income Tax Rate (%)</label>
            <input
              type="number" step="0.1" min="0" max="20" value={stateTaxRate}
              onChange={(e) => setStateTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">In-Office Frequency</label>
                <div className="flex rounded-md border border-gray-300 overflow-hidden text-xs font-medium">
                  {(['week', 'month'] as const).map(mode => (
                    <button key={mode} onClick={() => {
                      setOfficeFreqMode(mode);
                      if (mode === 'week') {
                        const perWeek = Math.min(5, Math.max(1, Math.round(daysPerMonth / 4.33)));
                        updateSettings({ work_days_per_week: perWeek });
                      } else {
                        const perMonth = Math.round(settings.work_days_per_week * 4.33);
                        setDaysPerMonth(perMonth);
                        updateSettings({ work_days_per_week: parseFloat((daysPerMonth / 4.33).toFixed(2)) });
                      }
                    }}
                    className={`px-3 py-1 ${officeFreqMode === mode ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                      /{mode}
                    </button>
                  ))}
                </div>
              </div>
              {officeFreqMode === 'week' ? (
                <input
                  type="number" min="1" max="5" name="work_days_per_week" value={settings.work_days_per_week} onChange={handleSettingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <>
                  <input
                    type="number" min="1" max="23" value={daysPerMonth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setDaysPerMonth(val);
                      updateSettings({ work_days_per_week: parseFloat((val / 4.33).toFixed(2)) });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-400">≈ {(daysPerMonth / 4.33).toFixed(1)} days/week</p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vacation Days</label>
                <input
                  type="number" name="vacation_days" value={timeOff.vacation_days} onChange={handleTimeOffChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Holidays</label>
                <input
                  type="number" name="holiday_days" value={timeOff.holiday_days} onChange={handleTimeOffChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>{52 * 5 - timeOff.vacation_days - timeOff.holiday_days} working days/year</span>
              <span>{settings.work_weeks.toFixed(1)} weeks</span>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-gray-700">Vehicle Config</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fuel Price ($/gal)</label>
              <input 
                type="number" step="0.01" name="fuel_price" value={settings.fuel_price} onChange={handleSettingChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">MPG City</label>
                <input 
                  type="number" name="mpg_city" value={settings.mpg_city} onChange={handleSettingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">MPG Hwy</label>
                <input 
                  type="number" name="mpg_hwy" value={settings.mpg_hwy} onChange={handleSettingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Parking Included</span>
              <button
                onClick={() => setParkingIncluded(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${parkingIncluded ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${parkingIncluded ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {!parkingIncluded && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Daily Parking Cost ($)</label>
                <input
                  type="number" step="0.50" min="0" value={dailyParkingCost}
                  onChange={(e) => setDailyParkingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400">{formatCurrency(annualParkingCost)}/year</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <span className="text-sm font-medium text-gray-700">Metric Units</span>
            <button 
              onClick={() => updateSettings({ use_metric: !settings.use_metric })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.use_metric ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.use_metric ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Commute Calculator</h2>
              <p className="text-gray-500 mt-1">Factor in the hidden costs of your daily travel.</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 font-medium">
                {results ? results.annual_hours_wasted.toFixed(0) : 0} hrs lost annually
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inputs Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-2 rounded-lg ${calcParams.commute_type === 'driving' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 cursor-pointer'}`}
                    onClick={() => setCalcParams(p => ({ ...p, commute_type: 'driving' }))}>
                    <Car className="w-6 h-6" />
                  </div>
                  <div className={`p-2 rounded-lg ${calcParams.commute_type === 'mixed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 cursor-pointer'}`}
                    onClick={() => setCalcParams(p => ({ ...p, commute_type: 'mixed' }))}>
                    <Train className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {calcParams.commute_type === 'driving' ? 'Driving Details' : 'Mixed Mode (Drive + Transit)'}
                  </h3>
                </div>

                {calcParams.commute_type === 'driving' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">One-way Distance ({unitDist})</label>
                        <input
                          type="range" min="1" max="100" name="one_way_miles"
                          value={calcParams.one_way_miles} onChange={handleParamChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number" min="0.1" step="0.1" name="one_way_miles"
                            value={distLabel(calcParams.one_way_miles)}
                            onChange={(e) => {
                              const raw = parseFloat(e.target.value);
                              const miles = settings.use_metric ? raw / 1.60934 : raw;
                              setCalcParams(prev => ({ ...prev, one_way_miles: miles }));
                            }}
                            className="w-24 px-2 py-1 text-right text-sm font-bold text-blue-600 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-sm font-medium text-blue-600">{unitDist}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">One-way Time (minutes)</label>
                        <input 
                          type="range" min="5" max="180" step="5" name="one_way_minutes" 
                          value={calcParams.one_way_minutes} onChange={handleParamChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-right font-bold text-blue-600">{calcParams.one_way_minutes} min</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="use_irs_rate" checked={calcParams.use_irs_rate} onChange={handleParamChange} className="w-4 h-4 rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Use IRS Standard Rate ($0.67/mi)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="is_highway" checked={calcParams.is_highway} onChange={handleParamChange} className="w-4 h-4 rounded text-blue-600" />
                        <span className="text-sm text-gray-700">Mostly Highway</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Drive to Station ({unitDist})</label>
                        <input 
                          type="number" name="drive_one_way_miles" value={calcParams.drive_one_way_miles} onChange={handleParamChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Transit Daily Cost ($)</label>
                        <input 
                          type="number" step="0.25" name="transit_daily_cost" value={calcParams.transit_daily_cost} onChange={handleParamChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Drive Time (one-way min)</label>
                        <input 
                          type="number" name="drive_one_way_minutes" value={calcParams.drive_one_way_minutes} onChange={handleParamChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Transit Time (one-way min)</label>
                        <input 
                          type="number" name="transit_one_way_minutes" value={calcParams.transit_one_way_minutes} onChange={handleParamChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg text-white">
                  <div className="flex items-center gap-2 mb-2 opacity-80">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wider">Required Salary</span>
                  </div>
                  <div className="text-4xl font-bold">
                    {results ? formatCurrency(settings.salary + (results.annual_cost + annualParkingCost) * grossUpFactor + results.annual_time_cost) : '...'}
                  </div>
                  <div className="mt-2 text-lg font-semibold opacity-90">
                    {results ? formatCurrency((settings.salary + (results.annual_cost + annualParkingCost) * grossUpFactor + results.annual_time_cost) / (settings.work_weeks * 5 * 8)) : '...'} /hr
                  </div>
                  {results && (() => {
                    const annual = settings.salary + (results.annual_cost + annualParkingCost) * grossUpFactor + results.annual_time_cost;
                    return (
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-blue-500 pt-3">
                        {[['Weekly', annual / 52], ['Bi-weekly', annual / 26], ['Monthly', annual / 12]].map(([label, val]) => (
                          <div key={label as string}>
                            <div className="text-xs opacity-70">{label}</div>
                            <div className="text-sm font-semibold">{formatCurrency(val as number)}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="mt-3 text-sm opacity-80 leading-relaxed">
                    This is what you need to earn to break even with a remote role, factoring in all costs and time value.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                      <ArrowRightLeft className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wider">Effective Hourly Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {results ? formatCurrency(results.effective_hourly_rate) : '...'} /hr
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-white rounded shadow-xs text-xs font-bold text-gray-400">vs</div>
                    <div className="text-sm text-gray-600 font-medium">
                      Remote: {formatCurrency(settings.salary / (settings.work_weeks * 5 * 8))} /hr
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Rate Impact */}
              {results && (() => {
                const annualWorkHours = settings.work_weeks * 5 * 8;
                const baseRate = settings.salary / annualWorkHours;
                const timeImpact = baseRate - results.effective_hourly_rate;
                const grossedUpDirectCosts = (results.annual_cost + annualParkingCost) * grossUpFactor;
                const costImpact = grossedUpDirectCosts / annualWorkHours;
                const totalImpact = timeImpact + costImpact;
                return (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                      <ArrowRightLeft className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wider">Hourly Rate Impact of Commuting</span>
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-4xl font-bold text-red-500">-{formatCurrency(Math.abs(totalImpact))}/hr</span>
                      <span className="text-sm text-gray-400 mb-1">vs. remote equivalent</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                        <div className="flex justify-between w-full text-sm">
                          <span className="text-gray-500">Time dilution ({results.annual_hours_wasted.toFixed(0)} hrs/yr)</span>
                          <span className="font-semibold text-gray-800">-{formatCurrency(Math.abs(timeImpact))}/hr</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                        <div className="flex justify-between w-full text-sm">
                          <span className="text-gray-500">
                            Direct costs ({formatCurrency(results.annual_cost + annualParkingCost)}/yr post-tax
                            → {formatCurrency(grossedUpDirectCosts)}/yr pre-tax @ {(totalMarginalRate * 100).toFixed(1)}%)
                          </span>
                          <span className="font-semibold text-gray-800">-{formatCurrency(Math.abs(costImpact))}/hr</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t flex justify-between text-sm font-bold">
                        <span className="text-gray-700">True effective rate</span>
                        <span className="text-gray-900">{formatCurrency(baseRate - totalImpact)}/hr</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* E-bike ROI */}
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white">
                    <Bike className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-900">E-bike Analysis</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-700">Bike Price ($)</label>
                    <input
                      type="number" step="100" min="0" value={calcParams.ebike_price}
                      onChange={(e) => setCalcParams(p => ({ ...p, ebike_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-700">Extra Costs ($)</label>
                    <input
                      type="number" step="10" min="0" value={calcParams.ebike_extra_costs}
                      onChange={(e) => setCalcParams(p => ({ ...p, ebike_extra_costs: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    />
                  </div>
                </div>
                {results?.ebike_roi?.eligible ? (
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-700 text-sm">
                      Pays for itself in <span className="font-bold">{results.ebike_roi.break_even_days.toFixed(0)} work days</span>.
                    </p>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">~{results.ebike_roi.break_even_months.toFixed(1)}</div>
                      <div className="text-xs font-medium text-emerald-500 uppercase">Months</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-600 text-sm">Set one-way distance ≤ 25 miles to see break-even analysis.</p>
                )}
              </div>
            </div>

            {/* Sidebar Charts/Info */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                <h3 className="font-bold text-gray-800 mb-6">Annual Cost Breakdown</h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fuel/Maint (post-tax)</span>
                    <span className="font-bold text-gray-900">{results ? formatCurrency(results.annual_cost) : '...'}</span>
                  </div>
                  {annualParkingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Parking (post-tax)</span>
                      <span className="font-bold text-gray-900">{formatCurrency(annualParkingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross-up @ {(totalMarginalRate * 100).toFixed(1)}%</span>
                    <span className="font-bold text-gray-900">{results ? formatCurrency((results.annual_cost + annualParkingCost) * (grossUpFactor - 1)) : '...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Time Opportunity Cost</span>
                    <span className="font-bold text-gray-900">{results ? formatCurrency(results.annual_time_cost) : '...'}</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between font-bold text-blue-600">
                    <span>Total Pre-Tax Impact</span>
                    <span>{results ? formatCurrency((results.annual_cost + annualParkingCost) * grossUpFactor + results.annual_time_cost) : '...'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Did you know?</h4>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                    The average American spends over 200 hours a year commuting. That's more than 8 full days!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

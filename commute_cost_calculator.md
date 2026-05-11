# Implementation Plan - Commute Cost Calculator

Build a full-stack application to calculate the true cost of commuting, including time-value compensation, mixed-mode transit (Denver RTD), and an e-bike break-even analysis.

## User Profile & Persistence
- **Storage**: SQLite database via SQLAlchemy.
- **Settings**: MPG, Fuel Price, Current Salary, Work Weeks, Holidays/Sick days, Default Units (Metric/Imperial).

## Backend Architecture (FastAPI)
- `app/main.py`: API routes for settings and calculations.
- `app/calculations.py`: Core logic for:
    - Driving costs (IRS rate vs. Fuel/MPG).
    - Transit costs (RTD fare structures).
    - Time value (Shadow hourly rate and salary adjustment).
    - E-bike ROI (Trek FX+ $4,000 + charger cost).
- `app/models.py`: SQLAlchemy models for user settings.
- `app/schemas.py`: Pydantic models for request/response validation.

## Frontend Architecture (Vite + React + TS)
- **State Management**: React state or `react-query` for sync with backend.
- **UI Components**:
    - **Input Form**: Sliders and toggles for MPG, distance, transit time, and salary.
    - **Unit Toggle**: Global switch for km/miles and liters/gallons.
    - **Dashboard**: High-level metrics cards.
    - **Visuals**: Pie chart (using Recharts) for cost breakdown (Fuel/Maint vs. Time Value vs. Fares).
    - **E-bike Module**: Conditional section showing break-even point in days/months if distance < 25 miles.

## Implementation Steps

### Phase 0: Test Development (TDD Approach)
1. **Define Test Suite**: Create `tests/test_calculations.py` to define expected outputs for:
    - Fuel-only vs. IRS rate cost calculations.
    - Mixed-mode transit time and cost (RTD).
    - E-bike break-even threshold and ROI.
    - Time-compensation salary adjustments.
2. **Endpoint Tests**: Create `tests/test_api.py` to test the Pydantic schemas and FastAPI endpoint responses.
3. **Run Tests**: Execute tests to ensure they fail as expected (Red phase).

### Phase 1: Backend Implementation
1. Initialize FastAPI project and SQLite database.
2. Create `Settings` model and CRUD endpoints.
3. Implement `CalculationEngine` in `calculations.py` to satisfy the failing tests.
    - Standardize all internal units to Miles/USD.
    - Implement RTD fare logic ($2.75/3-hour, $5.50/day).
    - Implement E-bike ROI calculation ($4,000 bike + ~$100 charger).
4. Verify tests pass (Green phase).

### Phase 2: Frontend Foundation
1. Initialize Vite + React + Tailwind CSS.
2. Build the main layout with a sidebar for settings and a main dashboard for results.
3. Implement the Metric/Imperial conversion utility.

### Phase 3: Dashboard & Visuals
1. Create metric cards for "Adjusted Salary", "Effective Hourly Rate", and "Hours Wasted".
2. Integrate Recharts for the cost breakdown pie chart.
3. Add the E-bike comparison card (conditionally rendered).

### Phase 4: Integration & Refinement
1. Connect frontend forms to the FastAPI backend.
2. Add "Save Profile" functionality.
3. Final styling and mobile responsiveness.

## Verification & Testing
- **Unit Tests**: Test calculation engine with known values (e.g., 25-mile commute @ IRS rate vs. Fuel).
- **Manual QA**: Verify e-bike card appears/disappears correctly at the 25-mile threshold.
- **Integration**: Ensure unit toggle correctly updates all displayed values without changing backend precision.

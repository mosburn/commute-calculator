# Commute Cost Calculator

Calculates the true cost of commuting — factoring in vehicle costs, time value, post-tax gross-up, parking, and e-bike break-even analysis.

## Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Recharts

## Setup

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:5173` (proxied to backend via `/api`).

## Running Tests

```bash
source .venv/bin/activate
pytest tests/ -v

# Single test
pytest tests/test_calculations.py::test_driving_cost_irs -v
```

## Key Calculations

- **Required Salary**: salary + gross-up(direct costs) + time opportunity cost. Direct costs (fuel, parking) are grossed up from post-tax to pre-tax using the marginal federal + state rate.
- **Effective Hourly Rate**: salary ÷ (annual work hours + annual commute hours). Salary basis always uses a 5-day work week; commute frequency uses in-office days only.
- **E-bike Break-even**: total investment ÷ daily IRS-rate savings. Shown when one-way distance ≤ 25 miles.

## Configuration

All settings persist to `commute.db` (SQLite). Key inputs:

| Setting | Notes |
|---|---|
| Annual Salary | Drives federal marginal rate auto-calculation |
| State Tax Rate | Combined with federal for gross-up |
| In-Office Frequency | Enter as days/week or days/month |
| Vacation & Holidays | Derive effective work weeks from 52-week year |
| Parking | Toggle included/excluded; daily cost if not included |
| IRS Rate vs Fuel+MPG | Two methods for driving cost |

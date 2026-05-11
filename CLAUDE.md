# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
# Activate venv first
source .venv/bin/activate

# Install dependencies (use requirements-dev.txt for tests)
pip install -r requirements-dev.txt

# Run the FastAPI server
uvicorn app.main:app --reload

# Run all tests
python -m pytest tests/ -v

# Run a single test
python -m pytest tests/test_calculations.py::test_driving_cost_irs -v
python -m pytest tests/test_api.py::test_calculate_endpoint -v
```

**Dependency files**: `requirements.txt` (runtime), `requirements-dev.txt` (adds pytest + httpx). When adding or upgrading a Python package, update the pinned version in the appropriate file. When adding an npm package, `package.json` and `package-lock.json` update automatically.

### Frontend
```bash
cd frontend
npm run dev       # dev server (Vite)
npm run build     # tsc + vite build
npm run lint      # eslint
```

## Architecture

This is a full-stack commute cost calculator with a FastAPI backend and Vite+React frontend. They are developed independently and communicate via REST.

### Backend (`app/`)

- **`calculations.py`** — All math lives here in `CalculationEngine`. Instantiated with user profile settings; exposes `calculate_driving_costs`, `calculate_time_cost`, `calculate_mixed_mode`, and `calculate_ebike_roi`. All internal units are miles/USD.
- **`models.py`** — Single `UserSettings` SQLAlchemy model. The app always uses the first row; there is no multi-user concept.
- **`schemas.py`** — Pydantic models for request/response validation. `CalculateRequest` handles both `"driving"` and `"mixed"` commute types via a `commute_type` discriminator field.
- **`main.py`** — FastAPI app. `/settings` (GET/POST) manages user profile; `/calculate` (POST) instantiates `CalculationEngine` from stored settings and runs the requested calculation.
- **`commute.db`** — SQLite database (do not commit).

### Key domain logic
- **Adjusted salary**: `salary + annual_driving_cost + annual_time_cost` — the salary needed to break even given commute burden.
- **Effective hourly rate**: `salary / (annual_work_hours + annual_commute_hours)` — true value of an hour.
- **E-bike ROI**: Only calculated when `one_way_miles <= 25`. Uses IRS rate savings vs. Trek FX+ ($4,000) + charger ($100).
- **RTD mixed-mode**: Driving cost to a transit stop + flat RTD fare ($2.75/3-hr or $5.50/day) + total time cost.

### Tests (`tests/`)
- `test_calculations.py` — unit tests for `CalculationEngine` with known numeric values.
- `test_api.py` — integration tests using FastAPI's `TestClient`. Uses a separate `test_commute.db` with a fresh schema per test (via `autouse` fixture with `drop_all`/`create_all`). The `get_db` dependency is overridden so tests never touch the real `commute.db`.

### Frontend (`frontend/src/`)
- React + TypeScript + Tailwind CSS + Recharts.
- `types.ts` holds shared TypeScript types that mirror the Pydantic schemas.
- The backend runs on `http://localhost:8000` by default; axios is used for API calls.

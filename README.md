# CapitalYou-Card

Hackathon project for the Capital One Tech Summit.

This repository implements a web application that classifies card transactions into categories and provides spending summaries. The repository contains a backend API and a frontend user interface.

---

## What this repository contains

- `backend/` - FastAPI application that loads a saved machine learning model and exposes endpoints to summarize transactions.
- `frontend/` - React application (Vite) that consumes the backend API and displays summaries.
- `backend/ml model/` - Saved model files used for merchant category classification.
- `backend/example.csv` - Example transaction data used by the user summary endpoint.

---

## Backend - description

- Implemented with FastAPI.
- Loads a saved merchant-category classifier at startup.
- Exposes the following endpoints:
  - `GET /` - Welcome message.
  - `GET /api/health` - Health check.
  - `GET /api/test` - Test endpoint.
  - `POST /api/transactions/summary` - Accepts a JSON list of transactions and returns total spending and breakdown by predicted category.
  - `GET /api/users/{user_id}/spending-categories` - Reads `backend/example.csv` and returns a per-user spending summary.

---

## Backend - how to run

1. Navigate to the `backend` directory.
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
4. Start the server:
   ```powershell
   uvicorn main:app --reload --port 8000
   ```
5. Verify the backend is running by calling the health endpoint:
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```

Notes:
- If endpoints return 503, the model failed to load at startup. Confirm `backend/ml model/models/merchant_category_model.pkl` exists.
- CORS is configured for `http://localhost:5173` and `http://localhost:3000`.

---

## Frontend - description

- Implemented with React and Vite.
- Uses `frontend/src/services/api.js` to communicate with the backend at `http://localhost:8000`.

---

## Frontend - how to run

1. Navigate to the `frontend` directory.
2. Install node dependencies:
   ```powershell
   npm install
   ```
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Open `http://localhost:5173` in a browser.

---

## API examples

- Health check:
  ```bash
  curl http://127.0.0.1:8000/api/health
  ```

- Transaction summary example:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/transactions/summary" \
    -H "Content-Type: application/json" \
    -d '{"transactions":[{"merchant":"DoorDash","amount":25.5},{"merchant":"Shell","amount":40.0}]}'
  ```

- Per-user summary:
  ```bash
  curl http://127.0.0.1:8000/api/users/1/spending-categories
  ```

---

## Troubleshooting

- 503 responses indicate the model did not load. Verify the model file exists.
- 400/404 responses may indicate malformed requests or missing user data in `example.csv`.

---

## Next steps (optional)

- Add a single script to start backend and frontend concurrently.
- Add automated tests or a Postman collection.



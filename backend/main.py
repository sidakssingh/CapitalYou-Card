from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist

from ml_pipeline import load_category_model, summarize_transactions, summarize_user_spending


class Transaction(BaseModel):
    merchant: str
    amount: float
    user_id: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None


class CategorySummary(BaseModel):
    category: str
    total_spent: float
    percentage_of_total: float


class TransactionSummaryResponse(BaseModel):
    total_spent: float
    by_category: List[CategorySummary]


class TransactionSummaryRequest(BaseModel):
    transactions: conlist(Transaction, min_length=1)


_category_model = None
_model_load_error: Optional[str] = None
try:
    _category_model = load_category_model()
except Exception as err:
    _model_load_error = str(err)


app = FastAPI(title="CapitalYou Card API", version="1.0.0")

# CORS configuration to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to CapitalYou Card API"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running!"}


@app.get("/api/test")
async def test_endpoint():
    return {"success": True, "data": "This is a test response from FastAPI"}


@app.post("/api/transactions/summary", response_model=TransactionSummaryResponse)
async def transactions_summary(payload: TransactionSummaryRequest):
    if _category_model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Category model unavailable: {_model_load_error or 'unknown error'}",
        )

    df = pd.DataFrame([tx.dict() for tx in payload.transactions])

    try:
        summary = summarize_transactions(df, _category_model)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to summarize transactions: {err}")

    return summary


@app.get("/api/users/{user_id}/spending-categories")
async def user_spending_categories(user_id: int):
    if _category_model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Category model unavailable: {_model_load_error or 'unknown error'}",
        )
    try:
        payload = summarize_user_spending(user_id, _category_model)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=500, detail=f"Failed to summarize spending for user {user_id}: {err}"
        )

    return payload

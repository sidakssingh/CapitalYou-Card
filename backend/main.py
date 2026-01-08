from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist

from ml_pipeline import load_category_model, summarize_transactions, summarize_user_spending

# In-memory storage for uploaded transaction data (more secure than file storage)
_uploaded_data: Optional[pd.DataFrame] = None


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

@app.get("/api/users/{user_id}/spending-categories")
async def user_spending_categories(user_id: int):
    if _category_model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Category model unavailable: {_model_load_error or 'unknown error'}",
        )
    try:
        # Use uploaded data if available, otherwise fall back to example.csv
        if _uploaded_data is not None:
            # Temporarily save to a file for summarize_user_spending to read
            from pathlib import Path
            temp_csv = Path(__file__).parent / "temp_uploaded.csv"
            _uploaded_data.to_csv(temp_csv, index=False)
            payload = summarize_user_spending(user_id, _category_model, csv_path=temp_csv)
            temp_csv.unlink()  # Delete temp file
        else:
            payload = summarize_user_spending(user_id, _category_model)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=500, detail=f"Failed to summarize spending for user {user_id}: {err}"
        )

    return payload


@app.post("/api/transactions/upload")
async def upload_transactions(file: UploadFile = File(...)):
    """Upload a CSV file with transaction data"""
    print(f"Received file upload: {file.filename}")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        print("Error: File is not a CSV")
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV content
        contents = await file.read()
        print(f"File size: {len(contents)} bytes")
        
        # Parse CSV with pandas
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        print(f"Successfully parsed CSV with {len(df)} rows")
        print(f"Columns: {df.columns.tolist()}")
        
        # Validate required columns
        required_columns = ['merchant', 'amount']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"Error: Missing required columns: {missing_columns}")
            raise HTTPException(
                status_code=400, 
                detail=f"CSV missing required columns: {', '.join(missing_columns)}"
            )
        
        # Get the first user_id from the CSV if it exists
        first_user_id = None
        if 'user_id' in df.columns and len(df) > 0:
            first_user_id = str(df['user_id'].iloc[0])
            print(f"First user_id in CSV: {first_user_id}")
        
        # Store data in memory (more secure than saving to disk)
        global _uploaded_data
        _uploaded_data = df
        print(f"Stored {len(df)} transactions in memory")
        
        print("CSV upload successful")
        return {
            "success": True,
            "message": "Transactions uploaded successfully",
            "rows_processed": len(df),
            "columns": df.columns.tolist(),
            "user_id": first_user_id
        }
    
    except pd.errors.EmptyDataError:
        print("Error: Empty CSV file")
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError as e:
        print(f"Error parsing CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

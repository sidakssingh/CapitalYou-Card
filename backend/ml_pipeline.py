"""Helpers for merchant-category classification and summary generation."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Union, List

import joblib
import pandas as pd

DEFAULT_MODEL_PATH = Path(__file__).parent / "ml model" / "models" / "merchant_category_model.pkl"
DEFAULT_TRANSACTIONS_CSV = Path(__file__).parent / "example.csv"

_ALIAS_MAP = {
    "door dash": "doordash",
    "door-dash": "doordash",
    "dd": "doordash",
    "uber eats": "ubereats",
    "netflix inc": "netflix",
}


def _normalize_text(text: object) -> str:
    """Normalize a single merchant string to match training-time logic."""
    t = str(text).lower().strip()
    for alias, replacement in _ALIAS_MAP.items():
        t = t.replace(alias, replacement)
    t = re.sub(r"(?<=\w)[-_](?=\w)", "", t)
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\b(?:[a-z]\s+){1,}[a-z]\b", lambda match: match.group(0).replace(" ", ""), t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def normalize_merchant_series(series: pd.Series) -> pd.Series:
    """Apply consistent normalization to a series of merchant names."""
    return series.fillna("").astype(str).map(_normalize_text)


def load_category_model(model_path: Union[str, Path] = DEFAULT_MODEL_PATH):
    """Load the saved merchant-category classifier."""
    path = Path(model_path)
    if not path.is_absolute():
        path = (Path(__file__).parent / path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Model file not found at {path!r}")
    return joblib.load(path)


def _safe_predict(model, merchants: Iterable[str]) -> List[str]:
    merchant_list = list(merchants)
    try:
        return list(model.predict(merchant_list))
    except Exception:
        return ["unknown"] * len(merchant_list)


def summarize_transactions(
    df: pd.DataFrame,
    model,
    merchant_col: str = "merchant",
    amount_col: str = "amount",
) -> dict:
    """Normalize, predict, and aggregate transactions by predicted category."""
    required_columns = {merchant_col, amount_col}
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.copy()
    df[merchant_col] = normalize_merchant_series(df[merchant_col])
    df[amount_col] = pd.to_numeric(df[amount_col], errors="coerce").fillna(0.0)
    merchants = df[merchant_col]
    df["predicted_category"] = _safe_predict(model, merchants)

    summary = (
        df.groupby("predicted_category")[amount_col]
        .sum()
        .reset_index()
        .rename(columns={amount_col: "total_spent"})
    )

    total_spent = float(summary["total_spent"].sum())
    if total_spent == 0:
        summary["percentage_of_total"] = 0.0
    else:
        summary["percentage_of_total"] = summary["total_spent"] / total_spent * 100

    summary = summary.sort_values("total_spent", ascending=False)

    return {
        "total_spent": float(total_spent),
        "by_category": [
            {
                "category": str(row["predicted_category"]),
                "total_spent": float(row["total_spent"]),
                "percentage_of_total": float(row["percentage_of_total"]),
            }
            for _, row in summary.iterrows()
        ],
    }


def load_transaction_data(
    csv_path: Union[str, Path] = DEFAULT_TRANSACTIONS_CSV,
) -> pd.DataFrame:
    """Load the example transaction dataset."""
    path = Path(csv_path)
    if not path.is_absolute():
        path = (Path(__file__).parent / path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Transactions CSV not found at {path!r}")
    return pd.read_csv(path)


_POINTS_MULTIPLIERS = {
    "fuel": 4,
    "travel": 3,
    "dining": 2,
    "restaurants": 2,
    "e-commerce": 5,
    "online": 5,
}


def _points_multiplier_for_category(category: str) -> int:
    lower_cat = category.lower()
    for key, value in _POINTS_MULTIPLIERS.items():
        if key in lower_cat:
            return value
    return 1


def summarize_user_spending(
    user_id: Union[str, int],
    model,
    csv_path: Union[str, Path] = DEFAULT_TRANSACTIONS_CSV,
) -> dict:
    """Return a summarized view for the requested user_id."""
    df = load_transaction_data(csv_path)
    if "user_id" not in df.columns:
        raise ValueError("Transactions CSV missing 'user_id' column.")

    normalized_user_id = str(user_id)
    user_df = df[df["user_id"].astype(str) == normalized_user_id]
    if user_df.empty:
        raise ValueError(f"No transactions found for user {user_id!r}.")

    summary = summarize_transactions(user_df, model)
    return {
        "user_id": int(normalized_user_id) if normalized_user_id.isdigit() else normalized_user_id,
        "total_spent": summary["total_spent"],
        "categories": [
            {
                "category": entry["category"],
                "total_spent": entry["total_spent"],
                "percentage_of_spend": entry["percentage_of_total"],
                "points_multiplier": _points_multiplier_for_category(entry["category"]),
            }
            for entry in summary["by_category"]
        ],
    }

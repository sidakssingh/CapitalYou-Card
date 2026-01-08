"""Helpers for merchant-category classification and summary generation."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Union, List

import joblib
import pandas as pd

DEFAULT_MODEL_PATH = Path(__file__).parent / "ml model" / "models" / "merchant_category_model.pkl"
DEFAULT_TRANSACTIONS_CSV = Path(__file__).parent / "capital_one_professional_statement.pdf"

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
    """Load the transaction dataset.

    If a PDF path is provided (``.pdf`` suffix), call the `convert_pdf_to_csv`
    helper, then read the produced CSV. Otherwise, read the CSV directly.
    """
    path = Path(csv_path)
    if not path.is_absolute():
        path = (Path(__file__).parent / path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"Transactions CSV not found at {path!r}")

    # Simple PDF handling: import the helper locally and convert to CSV.
    if path.suffix.lower() == ".pdf":
        try:
            from pdf_to_csv import convert_pdf_to_csv
        except Exception as exc:
            raise ImportError(
                "PDF support requires the `pypdf` package and the `pdf_to_csv` helper. "
                "Install with `pip install pypdf` or provide CSV input instead."
            ) from exc

        csv_path = convert_pdf_to_csv(str(path))
        return pd.read_csv(csv_path)

    return pd.read_csv(path)


def _calculate_multiplier(percentage: float, max_percentage: float) -> float:
    """Scale multiplier linearly so the top percentage hits 5x and others are floored at 1x."""
    if max_percentage <= 0:
        return 0.0
    multiplier = 5 * (percentage / max_percentage)
    multiplier = round(multiplier, 1)
    return max(multiplier, 1.0)


def summarize_user_spending(
    user_id: Union[str, int],
    model,
    csv_path: Union[str, Path] = DEFAULT_TRANSACTIONS_CSV,
) -> dict:
    """Return a summarized view for the requested user_id."""
    df = load_transaction_data(csv_path)

    normalized_user_id = str(user_id)

    # If the CSV contains no user identifiers, fall back to a global summary
    # and return it for the requested user id (best-effort demo behavior).
    if "user_id" not in df.columns or df["user_id"].dropna().empty:
        summary = summarize_transactions(df, model)
    else:
        user_df = df[df["user_id"].astype(str) == normalized_user_id]
        if user_df.empty:
            raise ValueError(f"No transactions found for user {user_id!r}.")
        summary = summarize_transactions(user_df, model)

    max_percentage = max(
        (entry["percentage_of_total"] for entry in summary["by_category"]), default=0.0
    )

    categories = []
    for entry in summary["by_category"]:
        multiplier = _calculate_multiplier(entry["percentage_of_total"], max_percentage)
        categories.append(
            {
                "category": entry["category"],
                "total_spent": entry["total_spent"],
                "percentage_of_spend": entry["percentage_of_total"],
                "points_multiplier": multiplier,
            }
        )

    return {
        "user_id": int(normalized_user_id) if normalized_user_id.isdigit() else normalized_user_id,
        "total_spent": summary["total_spent"],
        "categories": categories,
    }

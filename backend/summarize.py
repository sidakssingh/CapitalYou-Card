import sys
import os
import json
import argparse
import re
from pathlib import Path
import pandas as pd
import joblib

BASE_DIR = Path(__file__).parent
DEFAULT_CSV = str(BASE_DIR / "example.csv")
DEFAULT_MODEL = str(BASE_DIR / "ml model" / "models" / "merchant_category_model.pkl")


def load_model(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found at {path!r}. Please train or place the model at this path.")
    try:
        return joblib.load(path)
    except Exception as e:
        raise RuntimeError(f"Failed to load model from {path!r}: {e}")


def normalize(text: str) -> str:
    """Normalize merchant text using the same logic as train.py.
    Collapses separators/dashed letters, removes punctuation, and normalizes aliases.
    """
    t = str(text).lower().strip()
    aliases = {
        "door dash": "doordash",
        "door-dash": "doordash",
        "dd": "doordash",
        "uber eats": "ubereats",
        "netflix inc": "netflix",
    }
    for k, v in aliases.items():
        t = t.replace(k, v)

    # remove separators between letters (e.g., H-E-B -> HEB)
    t = re.sub(r'(?<=\w)[-_](?=\w)', '', t)

    # remove punctuation (keep alnum + space)
    t = re.sub(r"[^a-z0-9\s]", " ", t)

    # collapse spaced letters (h e b -> heb)
    t = re.sub(r"\b(?:[a-z]\s+){1,}[a-z]\b", lambda m: m.group(0).replace(' ', ''), t)

    # whitespace cleanup
    t = re.sub(r"\s+", " ", t).strip()
    return t


def summarize(csv_path: str, model_path: str, output_format: str = "text") -> int:
    # Load model
    model = load_model(model_path)

    # Load CSV
    df = pd.read_csv(csv_path)

    # Validate required columns
    required_cols = {"merchant", "amount"}
    missing = required_cols - set(df.columns)

    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Clean merchant column using the same normalization as training
    df["merchant"] = (
        df["merchant"]
        .fillna("")
        .astype(str)
        .map(normalize)
    )

    # Predict categories (safe fallback on failure)
    try:
        predictions = model.predict(df["merchant"])
    except Exception:
        # If model.predict fails (shape/type mismatch), fallback to unknown
        predictions = ["unknown"] * len(df)

    df["predicted_category"] = predictions

    # Ensure amount is numeric
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    # Aggregate spending by category
    summary = (
        df.groupby("predicted_category")["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "total_spent"})
    )

    # Compute percentages safely
    total_spent = summary["total_spent"].sum()
    if total_spent == 0:
        summary["percentage_of_total"] = 0.0
    else:
        summary["percentage_of_total"] = summary["total_spent"] / total_spent * 100

    # Sort descending by spend
    summary = summary.sort_values("total_spent", ascending=False)

    # Output
    if output_format == "json":
        result = {
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
        print(json.dumps(result, indent=2))
    else:
        print("\n--- Spending Summary by Category ---\n")
        for _, row in summary.iterrows():
            print(
                f"Category: {row['predicted_category']:<20} | "
                f"Total Spent: ${row['total_spent']:>8.2f} | "
                f"Percent of Total: {row['percentage_of_total']:>6.2f}%"
            )

        print(f"\nTOTAL STATEMENT SPEND: ${total_spent:.2f}\n")

    return 0


def main():
    parser = argparse.ArgumentParser(description="Categorize and summarize transactions from a CSV")
    parser.add_argument("csv", nargs="?", default=DEFAULT_CSV, help="Path to CSV with transactions (default: %(default)s)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Path to trained model file")
    parser.add_argument("--output", choices=["text", "json"], default="text", help="Output format")

    args = parser.parse_args()

    try:
        if not os.path.exists(args.csv):
            raise FileNotFoundError(f"CSV file not found: {args.csv!r}")

        # Make model path script-relative by default when the user didn't pass an absolute path
        model_path = args.model
        if not os.path.isabs(model_path):
            model_path = os.path.join(str(Path(__file__).parent), model_path)

        summarize(args.csv, model_path, args.output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

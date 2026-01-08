import sys
import os
import json
import argparse
from pathlib import Path

import pandas as pd

from ml_pipeline import DEFAULT_MODEL_PATH, load_category_model, summarize_transactions

BASE_DIR = Path(__file__).parent
DEFAULT_CSV = str(BASE_DIR / "example.csv")
DEFAULT_MODEL = str(DEFAULT_MODEL_PATH)


def summarize(csv_path: str, model_path: str, output_format: str = "text") -> int:
    model = load_category_model(model_path)
    df = pd.read_csv(csv_path)
    summary = summarize_transactions(df, model)

    if output_format == "json":
        print(json.dumps(summary, indent=2))
    else:
        print("\n--- Spending Summary by Category ---\n")
        for row in summary["by_category"]:
            print(
                f"Category: {row['category']:<20} | "
                f"Total Spent: ${row['total_spent']:>8.2f} | "
                f"Percent of Total: {row['percentage_of_total']:>6.2f}%"
            )

        print(f"\nTOTAL STATEMENT SPEND: ${summary['total_spent']:.2f}\n")

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

        summarize(args.csv, args.model, args.output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

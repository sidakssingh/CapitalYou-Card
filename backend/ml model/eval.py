"""Evaluate the saved merchant->category model on a labeled CSV.

Usage:
  python backend/eval.py --input backend/test/labeled_test.csv --model backend/models/merchant_category_model.pkl --k 3 --plot-calibration

Outputs metrics to stdout: accuracy, top-k accuracy, classification report, confusion matrix, and multiclass Brier score.
Optionally writes a small calibration plot (if matplotlib is installed) to `calibration.png` in the input file directory.
"""
from pathlib import Path
import argparse
import sys
import joblib
import pandas as pd
import numpy as np

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    top_k_accuracy_score,
    brier_score_loss,
)
from sklearn.preprocessing import LabelBinarizer


def safe_load_model(path: Path):
    if not path.exists():
        print(f"Error: model not found at {path}", file=sys.stderr)
        sys.exit(1)
    return joblib.load(path)


def main():
    p = argparse.ArgumentParser(description="Evaluate merchant->category model on labeled data")
    p.add_argument("--input", "-i", type=Path, default=Path(__file__).parent / "test" / "labeled_test.csv", help="Labeled CSV with 'merchant' and 'category' columns")
    p.add_argument("--model", "-m", type=Path, default=Path(__file__).parent / "models" / "merchant_category_model.pkl", help="Path to saved model (joblib)")
    p.add_argument("--k", "-k", type=int, default=3, help="Top-K accuracy (default: 3)")
    p.add_argument("--plot-calibration", action="store_true", help="Produce a calibration plot (requires matplotlib)")

    args = p.parse_args()

    model = safe_load_model(args.model)

    if not args.input.exists():
        print(f"Error: input file not found at {args.input}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(args.input)

    if "merchant" not in df.columns or "category" not in df.columns:
        print("Error: input CSV must contain 'merchant' and 'category' columns", file=sys.stderr)
        print("Columns found:", ", ".join(df.columns), file=sys.stderr)
        sys.exit(1)

    # Preprocess merchants like training
    X = df["merchant"].fillna("").astype(str).str.lower().values
    y_true = df["category"].values

    # Predictions
    y_pred = model.predict(X)

    print("\n--- Evaluation Results ---\n")

    acc = accuracy_score(y_true, y_pred)
    print(f"Accuracy: {acc:.4f}")

    # Probabilities & top-k
    if hasattr(model, "predict_proba"):
        y_proba = model.predict_proba(X)
        try:
            topk = top_k_accuracy_score(y_true, y_proba, k=args.k)
            print(f"Top-{args.k} accuracy: {topk:.4f}")
        except Exception as e:
            print(f"Warning: could not compute top-{args.k} accuracy: {e}")
    else:
        print("Warning: model does not support predict_proba; skipping top-k and Brier computations")
        y_proba = None

    print("\nClassification report:")
    print(classification_report(y_true, y_pred, digits=4))

    print("Confusion matrix:")
    print(confusion_matrix(y_true, y_pred))

    # Brier score (multiclass): average of one-vs-rest Brier scores per class
    if y_proba is not None:
        lb = LabelBinarizer()
        y_true_binarized = lb.fit_transform(y_true)
        # If binary, LabelBinarizer returns column vector; handle that
        if y_true_binarized.ndim == 1:
            y_true_binarized = y_true_binarized.reshape(-1, 1)

        class_names = lb.classes_
        brier_scores = []
        for j, cls in enumerate(class_names):
            # If classes in model are not in LabelBinarizer, find appropriate column
            prob_col = None
            try:
                # model.classes_ aligns with model.predict_proba columns
                model_classes = model.classes_
                idx = list(model_classes).index(cls)
                prob_col = y_proba[:, idx]
            except ValueError:
                # fallback: use binarized truth as "probability" (will be 0/1)
                prob_col = np.zeros(len(y_true))

            brier = brier_score_loss(y_true_binarized[:, j], prob_col)
            brier_scores.append((cls, brier))

        mean_brier = float(np.mean([b for _, b in brier_scores]))
        print(f"\nMulticlass Brier score (mean of OVR): {mean_brier:.6f}")

        # Optional calibration plot (requires matplotlib)
        if args.plot_calibration:
            try:
                import matplotlib.pyplot as plt
                from sklearn.calibration import calibration_curve

                # Choose a class to plot (most frequent)
                counts = pd.Series(y_true).value_counts()
                top_class = counts.index[0]
                model_classes = model.classes_
                if top_class in model_classes:
                    idx = list(model_classes).index(top_class)
                    prob = y_proba[:, idx]
                    true_bin = (y_true == top_class).astype(int)

                    prob_true, prob_pred = calibration_curve(true_bin, prob, n_bins=10)

                    plt.figure()
                    plt.plot(prob_pred, prob_true, marker=".")
                    plt.plot([0, 1], [0, 1], "--", color="gray")
                    plt.xlabel("Predicted probability")
                    plt.ylabel("Observed probability")
                    plt.title(f"Calibration curve for class: {top_class}")
                    outpath = args.input.parent / "calibration.png"
                    plt.savefig(outpath, bbox_inches="tight")
                    plt.close()
                    print(f"Calibration plot saved to {outpath}")
                else:
                    print("Warning: top class not found in model classes; skipping calibration plot")
            except Exception as e:
                print(f"Warning: could not create calibration plot (matplotlib missing or error): {e}")

    print("\nEvaluation complete.\n")


if __name__ == "__main__":
    main()

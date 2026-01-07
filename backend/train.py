"""Train a merchant->category classifier using logistic regression and TF-IDF.

This is a minimal script: it loads the CSV from `backend/data/`, trains a TF-IDF + LogisticRegression
pipeline, prints evaluation metrics, and saves the model to `backend/models/merchant_category_model.pkl`.
"""
from pathlib import Path
import sys

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


def main():
    data_path = Path(__file__).parent / "data" / "structured_synthetic_transactions.csv"
    if not data_path.exists():
        print(f"Error: data file not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(data_path, usecols=["merchant", "category"]).dropna(subset=["merchant", "category"])  # type: ignore
    df["merchant"] = df["merchant"].astype(str).str.lower()

    X = df["merchant"].values
    y = df["category"].values

    # 80/20 split, stratified by category
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
    except ValueError:
        # If stratify fails (very rare classes), fall back to a random split
        print("Warning: stratified split failed; using non-stratified split.")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")

    # Print scikit-learn version for debugging compatibility issues
    try:
        import sklearn
        print(f"scikit-learn version: {sklearn.__version__}")
    except Exception:
        pass

    # Construct LogisticRegression with a fallback for older scikit-learn versions
    try:
        clf = LogisticRegression(multi_class="multinomial", solver="lbfgs", max_iter=1000, n_jobs=-1, random_state=42)
    except TypeError as e:
        # Older scikit-learn may not accept 'multi_class' or 'n_jobs'
        print(f"Note: {e}; using compatible LogisticRegression signature.")
        clf = LogisticRegression(solver="lbfgs", max_iter=1000, random_state=42)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, stop_words="english", min_df=2)),
        ("clf", clf),
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("Classification report:")
    print(classification_report(y_test, y_pred, digits=4))

    print("Confusion matrix:")
    cm = classification_report(y_test, y_pred, output_dict=False)
    print(confusion_matrix(y_test, y_pred))

    model_path = Path(__file__).parent / "models" / "merchant_category_model.pkl"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")


if __name__ == "__main__":
    main()


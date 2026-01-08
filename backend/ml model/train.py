"""Train a merchant->category classifier using logistic regression and TF-IDF.

This is a minimal script: it loads the CSV from `backend/data/`, trains a TF-IDF + LogisticRegression
pipeline, prints evaluation metrics, and saves the model to `backend/models/merchant_category_model.pkl`.
"""
from pathlib import Path
import sys
import re
import numpy as np

import pandas as pd
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, brier_score_loss
from sklearn.preprocessing import LabelBinarizer


def main():
    """Train the merchant->category classifier pipeline and save the model.

    The pipeline combines word and character TF-IDF features and a (calibrated)
    LogisticRegression classifier. Trained model and canonical merchant names
    are saved to the `models/` directory.
    """
    data_path = Path(__file__).parent / "train" / "train_data.csv"
    if not data_path.exists():
        print(f"Error: data file not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(data_path, usecols=["merchant", "category"]).dropna(subset=["merchant", "category"])  # type: ignore
    
    # Preprocess merchant strings for training: normalize casing, punctuation and
    # common aliases (e.g., 'H-E-B' -> 'heb', 'door dash' -> 'doordash'). This helps
    # the TF-IDF features generalize across common variants.
    def preprocess_merchant_series(s: pd.Series) -> pd.Series:
        aliases = {
            "door dash": "doordash",
            "door-dash": "doordash",
            "dd": "doordash",
            "uber eats": "ubereats",
            "netflix inc": "netflix",
        }

        # Normalize individual merchant string: remove separators, punctuation and
        # collapse spaced single-letter tokens into a single token (e.g., 'h e b' -> 'heb').
        def normalize(text):
            t = str(text).lower().strip()
            # replace common aliases first
            for k, v in aliases.items():
                t = t.replace(k, v)

            # remove typical separators inserted between letters (e.g., H-E-B -> HEB)
            t = re.sub(r'(?<=\w)[-_](?=\w)', '', t)

            # remove punctuation (keep alnum + space)
            t = re.sub(r"[^a-z0-9\s]", " ", t)

            # collapse patterns like 'h e b' -> 'heb'
            t = re.sub(r"\b(?:[a-z]\s+){1,}[a-z]\b", lambda m: m.group(0).replace(' ', ''), t)

            # whitespace cleanup
            t = re.sub(r"\s+", " ", t).strip()
            return t

        return s.fillna("").astype(str).map(normalize)

    df["merchant"] = preprocess_merchant_series(df["merchant"])

    # Save canonical merchant list for fuzzy matching at inference time
    merchant_names = sorted(df["merchant"].unique().tolist())
    model_dir = Path(__file__).parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    with open(model_dir / "merchant_names.json", "w", encoding="utf-8") as f:
        json.dump(merchant_names, f, ensure_ascii=False, indent=2)

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

    # Build combined features: word n-grams + char n-grams
    word_vect = TfidfVectorizer(ngram_range=(1, 2), analyzer="word", lowercase=True, stop_words="english", min_df=1)
    char_vect = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=1)

    feats = FeatureUnion([("word", word_vect), ("char", char_vect)])

    # Construct LogisticRegression with a fallback for older scikit-learn versions
    try:
        base_clf = LogisticRegression(multi_class="multinomial", solver="lbfgs", max_iter=2000, n_jobs=-1, random_state=42)
    except TypeError as e:
        # Older scikit-learn may not accept 'multi_class' or 'n_jobs'
        print(f"Note: {e}; using compatible LogisticRegression signature.")
        base_clf = LogisticRegression(solver="lbfgs", max_iter=2000, random_state=42)

    # Calibrate probabilities when possible (isotonic if enough data, else sigmoid)
    try:
        from sklearn.calibration import CalibratedClassifierCV

        calib_method = "isotonic" if len(X_train) >= 200 else "sigmoid"
        # Try different constructor signatures to support multiple sklearn versions
        try:
            clf = CalibratedClassifierCV(base_estimator=base_clf, cv=3, method=calib_method)
            print(f"Using calibrated classifier (base_estimator, method={calib_method})")
        except TypeError:
            try:
                clf = CalibratedClassifierCV(estimator=base_clf, cv=3, method=calib_method)
                print(f"Using calibrated classifier (estimator, method={calib_method})")
            except TypeError:
                # Some sklearn variants need the base estimator prefit and cv='prefit'
                try:
                    print("CalibratedClassifierCV signature mismatch; using prefit strategy")
                    base_clf.fit(feats.transform(X_train), y_train)
                    try:
                        clf = CalibratedClassifierCV(base_estimator=base_clf, cv="prefit", method=calib_method)
                        print(f"Using calibrated classifier (prefit, base_estimator, method={calib_method})")
                    except TypeError:
                        clf = CalibratedClassifierCV(estimator=base_clf, cv="prefit", method=calib_method)
                        print(f"Using calibrated classifier (prefit, estimator, method={calib_method})")
                except Exception as e:
                    print(f"Note: CalibratedClassifierCV prefit approach failed ({e}); using base estimator.")
                    clf = base_clf
    except Exception as e:
        print(f"Note: CalibratedClassifierCV unavailable or failed ({e}); using base estimator.")
        clf = base_clf

    pipeline = Pipeline([
        ("feats", feats),
        ("clf", clf),
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("Classification report:")
    print(classification_report(y_test, y_pred, digits=4))

    print("Confusion matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Compute multiclass Brier score if predict_proba available
    if hasattr(pipeline, "predict_proba"):
        try:
            y_proba = pipeline.predict_proba(X_test)
            lb = LabelBinarizer()
            y_true_binarized = lb.fit_transform(y_test)
            if y_true_binarized.ndim == 1:
                y_true_binarized = y_true_binarized.reshape(-1, 1)

            class_names = lb.classes_
            brier_scores = []
            for j, cls in enumerate(class_names):
                # find corresponding column
                prob_col = None
                try:
                    model_classes = pipeline.named_steps["clf"].classes_
                    idx = list(model_classes).index(cls)
                    prob_col = y_proba[:, idx]
                except Exception:
                    prob_col = np.zeros(len(y_test))

                brier = brier_score_loss(y_true_binarized[:, j], prob_col)
                brier_scores.append((cls, brier))

            mean_brier = float(np.mean([b for _, b in brier_scores]))
            print(f"\nMulticlass Brier score (mean of OVR): {mean_brier:.6f}")
        except Exception as e:
            print(f"Warning: could not compute Brier score: {e}")

    model_path = Path(__file__).parent / "models" / "merchant_category_model.pkl"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")


if __name__ == "__main__":
    main()


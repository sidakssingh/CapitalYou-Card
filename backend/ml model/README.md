# Merchant Category Model (simple and clear)

Overview

This folder holds a small model that learns to put a merchant name into a category. For example, it learns that "Starbucks" is "Dining" and that "Walmart" is "Retail".

Training

- The model is trained from the file `train/train_data.csv`.
- To train the model run:

```bash
python train.py
```

- Steps and method names used in `train.py` and why they are used:
  - `preprocess_merchant_series`: cleans merchant names. It lowercases text, removes separators like `-` or `_`, and collapses spaced letters so `H-E-B`, `H E B`, and `HEB` are the same. This makes matching more reliable.
  - `TfidfVectorizer` (word): creates word n-gram features with `analyzer='word'` and `ngram_range=(1,2)`. This captures whole words and short phrases.
  - `TfidfVectorizer` (char_wb): creates character n-gram features with `analyzer='char_wb'` and `ngram_range=(3,5)`. This helps with typos and rare names.
  - `FeatureUnion`: combines the word and character features so the model sees both kinds of signals.
  - `LogisticRegression` (`base_clf`): the classifier that learns to map features to categories.
  - `CalibratedClassifierCV`: wraps the classifier to calibrate `predict_proba` outputs so confidence matches reality better when there is enough data.
  - `train_test_split`: splits data with `test_size=0.2` to keep a held-out test set for quick checks.
  - `joblib.dump`: saves the trained pipeline to `models/merchant_category_model.pkl`.
  - The training script also writes `models/merchant_names.json` which is a canonical list of merchants used for fuzzy matching at inference time.

What is saved

- The trained pipeline is saved to `models/merchant_category_model.pkl`.
- A list of canonical merchant names is saved to `models/merchant_names.json` for fuzzy matching.

Testing

- To try the model on example data, run:

```bash
python test.py
```

- `test.py` uses the file `test/test_data.csv` and prints each merchant with the predicted category and a confidence number.

Quick one off check in Python

- You can load the saved model and run a single prediction like this:

```py
import joblib
model = joblib.load('models/merchant_category_model.pkl')
print(model.predict(['starbucks']))
print(model.predict_proba(['starbucks']))
```

- The methods `predict` and `predict_proba` return the category and the confidence numbers.

Notes and tips

- There is no interactive script included. Use `test.py` or write a small script that loads the saved model.
- Install Python packages before running commands:

```bash
pip install -r ../requirements.txt
```

- If something does not work, check that `models/merchant_category_model.pkl` exists and that the CSV files are in `train/` and `test/`.

# Merchant Category Model (very simple)

Overview

This folder has a small model that learns to put a merchant name into a category. For example, it learns that "Starbucks" is "Dining" and that "Walmart" is "Retail".

Training

- I trained the model using the file `train/train_data.csv`.
- To train it run:

```bash
python train.py
```

- The model is saved to `models/merchant_category_model.pkl`.

Testing

- To try the model on example data, run:

```bash
python test.py
```

- `test.py` uses the data in the `test/` folder and prints the predicted category and how confident the model is.

Quick interaction

- You can try a single merchant name by running:

```bash
python run.py
```

- Then type a merchant name at the prompt and see the answer.

Why this is done

- We clean merchant names so that small differences or typos do not confuse the model.
- We use both word and character features so the model can learn shapes of names and common parts.
- We calibrate probabilities so reported confidence better matches reality.

Notes

- Install the Python packages in `requirements.txt` before running commands:

```bash
pip install -r ../requirements.txt
```

- If something does not work, check that the model file exists in `models/` and that the CSV files are in the `train/` and `test/` folders.

import pandas as pd
import joblib

# Paths
MODEL_PATH = "models/merchant_category_model.pkl"
TEST_DATA_PATH = "test/test_data.csv"


def main():
    # Load trained model
    model = joblib.load(MODEL_PATH)

    # Load test data
    df = pd.read_csv(TEST_DATA_PATH)

    # Basic validation
    if "merchant" not in df.columns:
        raise ValueError("Test CSV must contain a 'merchant' column")

    # Coerce merchant column to string and lowercase to match training
    df["merchant"] = df["merchant"].fillna("").astype(str).str.lower()

    # Run predictions
    predictions = model.predict(df["merchant"])
    probabilities = model.predict_proba(df["merchant"])

    # Get class labels
    classes = model.named_steps["clf"].classes_

    # Print results
    print("\n--- Model Validation Results ---\n")

    for idx, (predicted_category, probs) in enumerate(zip(predictions, probabilities)):
        row = df.iloc[idx]
        confidence = max(probs)

        print(
            f"User: {row.get('user_id','')} | "
            f"Date: {row.get('date','')} | "
            f"Merchant: {row['merchant']} | "
            f"Predicted Category: {predicted_category} | "
            f"Confidence: {confidence:.2f}"
        )

    print("\nValidation complete.\n")


if __name__ == "__main__":
    main()

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

print("Creating instant EMBER model with 2381 features...")
# Create realistic EMBER-like data - 2381 features like real EMBER
# 50000 samples, 2381 features
np.random.seed(42)
X = np.random.rand(10000, 2381).astype(np.float32)
# Make some features more important like real malware
y = (X[:, 0] + X[:, 100] + X[:, 500] > 1.5).astype(int)

print(f"Training on {X.shape[0]} rows, {X.shape[1]} features...")
model = RandomForestClassifier(n_estimators=30, max_depth=12, n_jobs=-1, random_state=42)
model.fit(X, y)

print(f"Accuracy: {model.score(X, y)*100:.2f}%")

joblib.dump(model, "model.pkl")
# Create fake feature names like EMBER
feature_names = [f"feature_{i}" for i in range(2381)]
joblib.dump(feature_names, "feature_columns.pkl")

print("✅ SUCCESS - model.pkl created with 2381 features!")
print("Now you can run your FastAPI app!")

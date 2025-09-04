import os
import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv

import numpy as np

import sys
sys.path.append("../")

from utils.mlflow_flow import set_tracking
from utils.utils_yose import load_data, make_features

import mlflow
from mlflow.tracking import MlflowClient

print("==========")
print(os.listdir("/app"))
print("==========")

load_dotenv()

ENDPOINT_URL = os.getenv("MLFLOW_TRACKING_URI")
MODEL_NAME = os.getenv("MODEL_NAME")
ALIAS = os.getenv("MODEL_ALIAS")

app = FastAPI(title="Server", version="0.1.0")

@app.get("/")
def hello():
    return "Hello World"

# predict
@app.get("/predict")
def predict():
    set_tracking(ENDPOINT_URL)
    set_tracking(ENDPOINT_URL)
    client = MlflowClient()
    print("\n=== Model Registry ===")
    try:
        rms = client.search_registered_models(max_results=5)
        print("OK, models:", [m.name for m in rms])
    except Exception as e:
        print("Registry falla:", type(e).__name__, str(e)[:200])

    try:
        m = mlflow.pyfunc.load_model("runs:/c5d7f7da87664b67ad1595f33557c4cc/model")
        print("\nCarga del modelo:/ --> OK")
    except Exception as e:
        print("\nCarga del modelo:/ falla:", type(e).__name__, str(e)[:200])
        
        _, df_test = load_data("data/housing_data/")
        X_test = make_features(df_test)
        predictions = dict(np.expm1(m.predict(X_test)))
    return predictions

def main():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
    )

if __name__ == "__main__":
    main()

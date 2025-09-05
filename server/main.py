import os
from fastapi import FastAPI, HTTPException, Body
from typing import Any, Dict, List, Union
from dotenv import load_dotenv
import uvicorn

import numpy as np
import pandas as pd

import sys
sys.path.append("../")

from utils.mlflow_flow import set_tracking
from utils.utils_yose import make_features

import mlflow
from mlflow.tracking import MlflowClient

load_dotenv()

ENDPOINT_URL = os.getenv("MLFLOW_TRACKING_URI")
MODEL_NAME = os.getenv("MODEL_NAME")
ALIAS = os.getenv("MODEL_ALIAS")
DATA_DIR = os.getenv("DATA_DIR", "data/housing_data/")

app = FastAPI(title="Server", version="0.1.0")

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post('/predict')
def predict(
    data: Union[Dict[str, Any], List[Dict[str, Any]]] = Body(...)
):
    set_tracking(ENDPOINT_URL)
    client = MlflowClient()
    print("\n=== Model Registry ===")
    try:
        rms = client.search_registered_models(max_results=5)
        print("OK, models:", [m.name for m in rms])
    except Exception as e:
        print("Registry falla:", type(e).__name__, str(e)[:200])

    m = None
    load_errors = []
    if MODEL_NAME and ALIAS:
        try:
            m = mlflow.pyfunc.load_model(f"models:/{MODEL_NAME}@{ALIAS}")
            print(f"\nCarga por alias OK: models:/{MODEL_NAME}@{ALIAS}")
        except Exception as e:
            err = f"Alias falla: models:/{MODEL_NAME}@{ALIAS} -> {type(e).__name__}: {str(e)[:200]}"
            print(err)
            load_errors.append(err)
    if m is None:
        try:
            m = mlflow.pyfunc.load_model("runs:/c5d7f7da87664b67ad1595f33557c4cc/model")
            print("\nCarga por runs:/ --> OK")
        except Exception as e:
            err = f"Runs falla: {type(e).__name__}: {str(e)[:200]}"
            print(err)
            load_errors.append(err)

    if m is None:
        raise HTTPException(status_code=500, detail={
            "error": "No se pudo cargar el modelo",
            "attempts": load_errors,
        })
    try:
        if isinstance(data, dict):
            df_in = pd.DataFrame([data])
        elif isinstance(data, list):
            if not data:
                raise HTTPException(status_code=400, detail="Payload vacío: envía al menos un registro")
            if not all(isinstance(x, dict) for x in data):
                raise HTTPException(status_code=400, detail="Si envías una lista, debe ser lista de objetos (dict)")
            df_in = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado: usa un objeto JSON o una lista de objetos")

        fe_df = make_features(df_in)
        raw = m.predict(fe_df)
        preds = np.expm1(raw)
        return {"predictions": preds.tolist() if hasattr(preds, "tolist") else list(preds)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al predecir: {type(e).__name__}: {str(e)[:200]}")

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
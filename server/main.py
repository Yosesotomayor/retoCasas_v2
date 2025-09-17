import os
from fastapi import FastAPI, HTTPException, Body
from typing import Any, Dict, List, Union
from dotenv import load_dotenv
import uvicorn
import joblib
import json

import numpy as np
import pandas as pd
import glob, os
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


# ===== Modelos locales (para /predict-app) cargados en startup =====
MODELS = []
WEIGHTS = {}

@app.on_event("startup")
def _load_models_on_startup():
    global MODELS, WEIGHTS
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    weights_path = os.path.join(models_dir, "weights.json")

    MODELS = []
    WEIGHTS = {}

    if os.path.exists(weights_path):
        with open(weights_path, "r") as f:
            WEIGHTS.update(json.load(f))
    else:
        WEIGHTS.update({"elasticnet": 0.5, "lgbm": 0.5})

    # Cargar modelos .pkl (orden determinista por nombre)
    for mf in sorted(glob.glob(os.path.join(models_dir, "*.pkl"))):
        try:
            with open(mf, "rb") as fh:
                MODELS.append(joblib.load(fh))
        except Exception as e:
            print(f"[startup] Warning: no se pudo cargar {mf}: {type(e).__name__}: {e}")

    print(f"[startup] Modelos cargados={len(MODELS)}, weights={WEIGHTS}")


@app.get("/")
def health_check():
    return {"status": "ok"}
@app.post("/predict-app")
def predict_app(
    data: Union[Dict[str, Any], List[Dict[str, Any]]] = Body(...)
):
    """Predice con modelos locales en ./server/models.
    Acepta un objeto JSON o una lista de objetos.
    """
    try:
        # Validar payload
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

        # Features
        fe_df = make_features(df_in)

        # Modelos cargados
        if not MODELS:
            raise HTTPException(status_code=500, detail="Modelos no cargados: sube .pkl a server/models y redeploy")

        if len(MODELS) < 2:
            raise HTTPException(status_code=500, detail="Faltan modelos .pkl (se esperan al menos 2)")

        # Pesos
        w_el = float(WEIGHTS.get("elasticnet", 0.5))
        w_lg = float(WEIGHTS.get("lgbm", 0.5))

        # Predicción (tomamos los dos primeros modelos cargados de forma determinista)
        p_el = np.array(MODELS[0].predict(fe_df))
        p_lg = np.array(MODELS[1].predict(fe_df))
        preds = np.expm1(w_el * p_el + w_lg * p_lg)

        return {"predictions": preds.tolist()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predict-app: {type(e).__name__}: {str(e)[:200]}")
    


















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
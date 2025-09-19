import os
from fastapi import APIRouter, HTTPException, Body
from typing import Any, Dict, List, Union
import joblib
import json
import numpy as np
import pandas as pd
import glob

from utils.mlflow_flow import set_tracking
from utils.utils_yose import make_features
import mlflow
from mlflow.tracking import MlflowClient
from database import Database
from config import setup_logging

logger = setup_logging()

ENDPOINT_URL = os.getenv("MLFLOW_TRACKING_URI")
MODEL_NAME = os.getenv("MODEL_NAME")
ALIAS = os.getenv("MODEL_ALIAS")

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok"}

@router.post("/predict-app")
def predict_app(
    data: Union[Dict[str, Any], List[Dict[str, Any]]] = Body(...)
):
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

        MODELS = []
        WEIGHTS = {}

        # leer los PKL de ./models
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        weights_path = os.path.join(models_dir, "weights.json")

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

        # Modelos cargados
        if not MODELS:
            raise HTTPException(status_code=500, detail="Modelos no cargados: sube .pkl a server/models y redeploy")

        if len(MODELS) < 2:
            raise HTTPException(status_code=500, detail="Faltan modelos .pkl (se esperan al menos 2)")

        # Pesos
        if not WEIGHTS:
            w_el = float(WEIGHTS.get("elasticnet", 0.5))
            w_lg = float(WEIGHTS.get("lgbm", 0.5))

        # leer pesos del json
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

@router.post("/predict")
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

@router.post("/users/")
async def create_user(data: dict = Body(...)):
    try:
        nombre = data.get("nombre")
        email = data.get("email")
        password_hash = data.get("password_hash")
        fecha_registro = data.get("fecha_registro")
        tel = data.get("tel")

        await Database.create_user(nombre, email, password_hash, fecha_registro, tel)
        return {"message": "Usuario creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {type(e).__name__}: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    try:
        await Database.delete_user(user_id)
        return {"message": f"Usuario con ID {user_id} eliminado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar usuario: {type(e).__name__}: {str(e)}")

@router.put("/users/{user_id}")
async def update_user(user_id: int, updates: dict):
    try:
        await Database.update_user(user_id, **updates)
        return {"message": f"Usuario con ID {user_id} actualizado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar usuario: {type(e).__name__}: {str(e)}")

@router.post("/payments/")
async def create_payment(data: dict = Body(...)):
    try:
        id_usuario = data.get("id_usuario")
        monto = data.get("monto")
        fecha_pago = data.get("fecha_pago")
        metodo_pago = data.get("metodo_pago")
        estatus = data.get("estatus")
        id_transac_externa = data.get("id_transac_externa")

        await Database.create_payment(id_usuario, monto, fecha_pago, metodo_pago, estatus, id_transac_externa)
        return {"message": "Pago creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear pago: {type(e).__name__}: {str(e)}")

@router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: int):
    try:
        await Database.delete_payment(payment_id)
        return {"message": f"Pago con ID {payment_id} eliminado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar pago: {type(e).__name__}: {str(e)}")

@router.put("/payments/{payment_id}")
async def update_payment(payment_id: int, updates: dict):
    try:
        await Database.update_payment(payment_id, **updates)
        return {"message": f"Pago con ID {payment_id} actualizado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar pago: {type(e).__name__}: {str(e)}")

@router.post("/consultas/")
async def create_consulta(data: dict = Body(...)):
    try:
        id_usuario = data.get("id_usuario")
        fecha_consulta = data.get("fecha_consulta")
        datos_entrada = data.get("datos_entrada")
        prediccion = data.get("prediccion")

        await Database.create_consulta(id_usuario, fecha_consulta, datos_entrada, prediccion)
        return {"message": "Consulta creada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear consulta: {type(e).__name__}: {str(e)}")

@router.delete("/consultas/{consulta_id}")
async def delete_consulta(consulta_id: int):
    try:
        await Database.delete_consulta(consulta_id)
        return {"message": f"Consulta con ID {consulta_id} eliminada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar consulta: {type(e).__name__}: {str(e)}")

@router.put("/consultas/{consulta_id}")
async def update_consulta(consulta_id: int, updates: dict):
    try:
        await Database.update_consulta(consulta_id, **updates)
        return {"message": f"Consulta con ID {consulta_id} actualizada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar consulta: {type(e).__name__}: {str(e)}")
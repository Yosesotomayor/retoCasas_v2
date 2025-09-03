import os
import sys
import json
import traceback
from typing import Any, Dict

from dotenv import load_dotenv
from flask import Flask, request, jsonify
import mlflow

# Opcional: si usas utilidades propias
# from ML.utils.mlflow_flow import set_tracking  # <- no lo usaremos para evitar confusiones

# Para imports relativos a tu repo
sys.path.append("../../")

# ================== Config ==================
load_dotenv()

TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI") 
REGISTRY_URI = os.getenv("MLFLOW_REGISTRY_URI", TRACKING_URI)
MODEL_NAME   = os.getenv("MODEL_NAME", "elnet_lgbm")
MODEL_ALIAS  = os.getenv("MODEL_ALIAS", "champion")

if not TRACKING_URI:
    raise RuntimeError("MLFLOW_TRACKING_URI no está definido en el entorno (.env o variables del contenedor).")

# Configurar MLflow (tracking + registry)
mlflow.set_tracking_uri(TRACKING_URI)
mlflow.set_registry_uri(REGISTRY_URI)

# ================== App ==================
app = Flask(__name__)

_model = None
_model_info: Dict[str, Any] = {}

def _resolve_alias_debug():
    """Devuelve name/version si el alias existe; útil para diagnosticar 401/404."""
    try:
        from mlflow.tracking import MlflowClient
        c = MlflowClient()
        mv = c.get_model_version_by_alias(MODEL_NAME, MODEL_ALIAS)
        return {"resolved_version": mv.version, "creation_timestamp": mv.creation_timestamp}
    except Exception as e:
        return {"alias_resolution_error": str(e)}

def _load_model() -> None:
    global _model, _model_info
    if _model is not None:
        return
    uri = f"models:/{MODEL_NAME}@{MODEL_ALIAS}"
    try:
        _model = mlflow.pyfunc.load_model(uri)
        _model_info = {"model": MODEL_NAME, "alias": MODEL_ALIAS, "uri": uri}
    except Exception as e:
        # Diagnóstico extra: credenciales presentes / resolución de alias
        has_token   = bool(os.getenv("MLFLOW_TRACKING_TOKEN") or os.getenv("DAGSHUB_TOKEN"))
        has_userpwd = bool(os.getenv("MLFLOW_TRACKING_USERNAME")) and bool(os.getenv("MLFLOW_TRACKING_PASSWORD"))
        diag = {
            "tracking_uri": TRACKING_URI,
            "registry_uri": REGISTRY_URI,
            "auth_token_present": has_token,
            "auth_userpwd_present": has_userpwd,
            **_resolve_alias_debug(),
        }
        hint = (
            "Autenticación MLflow fallida o alias inexistente.\n"
            "- Verifica MLFLOW_TRACKING_URI (y MLFLOW_REGISTRY_URI si difiere).\n"
            "- Exporta MLFLOW_TRACKING_TOKEN (o DAGSHUB_TOKEN) o bien MLFLOW_TRACKING_USERNAME/MLFLOW_TRACKING_PASSWORD.\n"
            "- Confirma que el modelo esté en el Model Registry y que el alias exista."
        )
        raise RuntimeError(f"Failed to load '{MODEL_NAME}@{MODEL_ALIAS}'.\nDiagnostics: {json.dumps(diag)}\n{hint}") from e

# ================== Rutas ==================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "tracking_uri": TRACKING_URI,
        "registry_uri": REGISTRY_URI
    })

@app.route("/test", methods=["GET"])
def test():
    return "ok"

@app.route("/load", methods=["POST", "GET"])
def load_endpoint():
    try:
        _load_model()
        return jsonify({"loaded": True, **_model_info})
    except Exception as e:
        return jsonify({"loaded": False, "error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/predict', methods=['POST'])
def predict_model():
    try:
        _load_model()
        payload = request.get_json(force=True, silent=False)
        if payload is None:
            return jsonify({"error": "Missing JSON body"}), 400

        import pandas as pd
        if "rows" in payload and isinstance(payload["rows"], list):
            X = pd.DataFrame(payload["rows"])
        elif "data" in payload and isinstance(payload["data"], list):
            X = pd.DataFrame(payload["data"])
        else:
            return jsonify({"error": "Provide 'rows' (list of lists) or 'data' (list of dicts)"}), 400

        preds = _model.predict(X)
        preds_out = preds.tolist() if hasattr(preds, "tolist") else list(preds)
        return jsonify({"predictions": preds_out, **_model_info})
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@app.route('/predict-kaggle', methods=['GET'])
def predict_kaggle_ready():
    try:
        _load_model()
        return jsonify({"message": "Model ready", **_model_info})
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

# Versión POST para archivo CSV (si la necesitas):
# @app.route('/predict-kaggle', methods=['POST'])
# def predict_kaggle_file():
#     try:
#         _load_model()
#         if 'file' not in request.files:
#             return jsonify({"error": "Upload a CSV file as form field 'file'"}), 400
#         file = request.files['file']
#         import pandas as pd
#         X = pd.read_csv(file)
#         preds = _model.predict(X)
#         preds_out = preds.tolist() if hasattr(preds, "tolist") else list(preds)
#         return jsonify({"predictions": preds_out, **_model_info})
#     except Exception as e:
#         return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
import os
import sys
import json
import traceback
from typing import Any, Dict

os.listdir("../../")
sys.path.append("../../")

from dotenv import load_dotenv
from flask import Flask, request, jsonify
import mlflow
from ML.utils.mlflow_flow import set_tracking

load_dotenv()
MODEL_NAME = 'elnet_lgbm'
MODEL_ALIAS = 'champion'

app = Flask(__name__)

try:
    mlflow.set_tracking_uri(os.environ["MLFLOW_TRACKING_URI"])
    mlflow.set_registry_uri(os.environ["MLFLOW_REGISTRY_URI"])
except Exception as e:
    print(e)

_model = None
_model_info: Dict[str, Any] = {}


def _load_model() -> None:
    global _model, _model_info
    if _model is not None:
        return
    try:
        uri = f"models:/{MODEL_NAME}@{MODEL_ALIAS}"
        _model = mlflow.pyfunc.load_model(uri)
        _model_info = {"model": MODEL_NAME, "alias": MODEL_ALIAS, "uri": uri}
    except Exception as e:
        msg = str(e)
        hint = (
            "MLflow 401 Unauthorized. Make sure ENDPOINT_URL points to your tracking server "
            "and set either MLFLOW_TRACKING_TOKEN (or DAGSHUB_TOKEN) OR "
            "MLFLOW_TRACKING_USERNAME/MLFLOW_TRACKING_PASSWORD as environment variables."
        )
        raise RuntimeError(f"Failed to load model '{MODEL_NAME}@{MODEL_ALIAS}': {msg}\n{hint}") from e


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "tracking_uri": os.getenv("MLFLOW_TRACKING_URI", "unset")})


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
      
        if "rows" in payload and isinstance(payload["rows"], list):
            import pandas as pd
            X = pd.DataFrame(payload["rows"])  # assumes model handles column order internally
        elif "data" in payload and isinstance(payload["data"], list):
            import pandas as pd
            X = pd.DataFrame(payload["data"])
        else:
            return jsonify({"error": "Provide 'rows' (list of lists) or 'data' (list of dicts)"}), 400

        preds = _model.predict(X)
        if hasattr(preds, 'tolist'):
            preds_out = preds.tolist()
        else:
            preds_out = list(preds)
        return jsonify({"predictions": preds_out, **_model_info})
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@app.route('/predict-kaggle', methods=['GET'])
def predict_kaggle():
    try:
        _load_model()
        return jsonify({"message": "Model ready", **_model_info})
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(host=HOST_NAME, port=PORT)

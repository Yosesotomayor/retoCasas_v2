from __future__ import annotations
import json
import hashlib
from typing import Dict, Optional
from pathlib import Path
import time
import pandas as pd
import mlflow
from mlflow.tracking import MlflowClient
import os
import tempfile
from mlflow.exceptions import RestException


# ---------- Básicos ----------
def set_tracking(uri: str = "http://127.0.0.1:5000"):
    mlflow.set_tracking_uri(uri)
    try:
        mlflow.set_registry_uri(uri)
    except Exception:
        pass

def _wait_until_ready(client: MlflowClient, model_name: str, version: str | int, timeout: int = 180, poll: float = 2.0):
    start = time.time()
    while True:
        mv = client.get_model_version(model_name, str(version))
        status = getattr(mv, "status", "READY")
        if status == "READY":
            return mv
        if time.time() - start > timeout:
            raise TimeoutError(f"Model version {model_name}/{version} not READY after {timeout}s (status={status}).")
        time.sleep(poll)

def _ensure_registered_model_exists(client: MlflowClient, model_name: str):
    try:
        client.get_registered_model(model_name)
    except Exception:
        client.create_registered_model(model_name)

def ensure_experiment(name: str) -> str:
    """
    Crea/selecciona experimento y devuelve su experiment_id.
    """
    mlflow.set_experiment(name)
    client = MlflowClient()
    exp = client.get_experiment_by_name(name)
    if exp is None:
        # set_experiment crea si no existe, pero por si acaso:
        exp_id = mlflow.create_experiment(name)
        return exp_id
    return exp.experiment_id


def hash_config(d: Dict) -> str:
    return hashlib.md5(json.dumps(d, sort_keys=True, default=str).encode()).hexdigest()


# ---------- Utilidades internas ----------
def _abs_or_none(p: Optional[str]) -> Optional[str]:
    if not p:
        return None
    try:
        return str(Path(p).expanduser().resolve())
    except Exception:
        return p  # deja tal cual si falla


def _signature_from_Xtest(X_test: Optional[pd.DataFrame], input_example: Optional[pd.DataFrame]):
    if X_test is None:
        return None



def _sanitize_input_example(X_test: Optional[pd.DataFrame], input_example: Optional[pd.DataFrame]) -> Optional[pd.DataFrame]:
    ex = None
    try:
        ex = input_example if input_example is not None else (X_test.head() if X_test is not None else None)
        if ex is None:
            return None
        ex = ex.copy()
        for _col in ("Id", "id", "index"):
            if _col in ex.columns:
                ex = ex.drop(columns=[_col])
        return ex if not ex.empty else None
    except Exception:
        return None


def _make_run_fingerprint(model, X: Optional[pd.DataFrame], params: Optional[Dict], train_source: Optional[str], test_source: Optional[str]) -> str:
    try:
        model_name = getattr(model, "__class__", type(model)).__name__
    except Exception:
        model_name = str(type(model))
    cols = None
    try:
        if X is not None:
            cols = sorted([c for c in X.columns if c not in ("Id", "id", "index")])
    except Exception:
        cols = None
    payload = {
        "model": model_name,
        "params": (params or {}),
        "n_features": (len(cols) if cols is not None else None),
        "features": cols,
        "train_source": train_source,
        "test_source": test_source,
    }
    return hashlib.md5(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


# ---------- Logging rápido ----------
def log_model_quick(
    *,
    experiment: str,
    run_name: str,
    model,                         # objeto sklearn/pyfunc
    artifact_path: str = "model",
    artifacts: Optional[Dict] = None,
    X_train: Optional[pd.DataFrame] = None,
    y_train: Optional[pd.Series] = None,
    X_test: Optional[pd.DataFrame] = None,
    params: Optional[Dict] = None,
    metrics: Optional[Dict] = None,
    tags: Optional[Dict] = None,
    train_source: Optional[str] = None,
    test_source: Optional[str] = None,
    input_example: Optional[pd.DataFrame] = None,
    config_for_hash: Optional[Dict] = None,      # lo que define “igualdad” de config
    dedupe: bool = True,                          # evitar runs duplicados
):
    client = MlflowClient()
    exp_id = ensure_experiment(experiment)

    # Huella del run para evitar duplicados dentro del experimento
    run_fingerprint = _make_run_fingerprint(
        model,
        X=(X_train if X_train is not None else X_test),
        params=params,
        train_source=train_source,
        test_source=test_source,
    )

    # Dedupe por hash de config
    config_hash = None
    if config_for_hash:
        config_hash = hash_config(config_for_hash)
        if dedupe:
            dup = client.search_runs(
                experiment_ids=[exp_id],
                filter_string=f"tags.config_hash = '{config_hash}'",
                max_results=1,
                order_by=["attributes.start_time DESC"],
            )
            if dup:
                run = dup[0]
                model_uri = f"runs:/{run.info.run_id}/{artifact_path}"
                return {
                    "experiment_id": exp_id,
                    "run_id": run.info.run_id,
                    "model_uri": model_uri,
                    "deduped": True,
                    "config_hash": config_hash,
                }
            if dedupe and run_fingerprint:
                dup2 = client.search_runs(
                    experiment_ids=[exp_id],
                    filter_string=f"tags.run_fingerprint = '{run_fingerprint}'",
                    max_results=1,
                    order_by=["attributes.start_time DESC"],
                )
                if dup2:
                    run = dup2[0]
                    model_uri = f"runs:/{run.info.run_id}/{artifact_path}"
                    return {
                        "experiment_id": exp_id,
                        "run_id": run.info.run_id,
                        "model_uri": model_uri,
                        "deduped": True,
                        "config_hash": config_hash,
                    }

    # Firma (si hay X_test)
    signature = _signature_from_Xtest(X_test, input_example)
    example_clean = _sanitize_input_example(X_test, input_example)

    with mlflow.start_run(run_name=run_name) as run:
        if config_hash:
            mlflow.set_tag("config_hash", config_hash)
        mlflow.set_tag("run_fingerprint", run_fingerprint)
        if params:
            mlflow.log_params({k: (v if v is not None else "None") for k, v in params.items()})

        if metrics:
            for k, v in metrics.items():
                mlflow.log_metric(k, float(v))

        if tags:
            mlflow.set_tags(tags)
        if artifacts:
            import mlflow.pyfunc as mpy
            mpy.log_model(
                artifact_path=artifact_path,
                python_model=model,              # tu clase debe heredar de PythonModel
                artifacts=artifacts,             # {"elasticnet.pkl": "...", "lgbm.pkl": "..."}
                signature=signature,
                input_example=example_clean,
                pip_requirements=[
                    "mlflow==2.22.0",
                    "scikit-learn==1.5.2",
                    "lightgbm==4.5.0",
                    "joblib==1.4.2",
                ],
                code_path=["ML/utils", "ML/models/ensemble_elnet_lgbm/model"], 
            )
        try:
            import mlflow.sklearn as msk
            msk.log_model(
                model,
                artifact_path=artifact_path,
                signature=signature,
                input_example=example_clean,
            )
        except RestException as e:
            # Fallback compatible con servidores que no soportan ciertos endpoints
            msg = str(e).lower()
            if "unsupported endpoint" in msg or "not implemented" in msg:
                import mlflow.sklearn as msk
                with tempfile.TemporaryDirectory() as _tmp:
                    local_dir = os.path.join(_tmp, "model_dir")
                    msk.save_model(
                        model,
                        path=local_dir,
                    )
                    mlflow.log_artifacts(local_dir, artifact_path=artifact_path)
            else:
                raise
        except Exception:
            # Fallback genérico a pyfunc.save_model + log_artifacts
            import mlflow.pyfunc as mpy
            with tempfile.TemporaryDirectory() as _tmp:
                local_dir = os.path.join(_tmp, "model_dir")
                mpy.save_model(
                    path=local_dir,
                    python_model=model,
                )
                mlflow.log_artifacts(local_dir, artifact_path=artifact_path)

        model_uri = f"runs:/{run.info.run_id}/{artifact_path}"
        return {
            "experiment_id": exp_id,
            "run_id": run.info.run_id,
            "model_uri": model_uri,
            "deduped": False,
            "config_hash": config_hash,
        }


# ---------- Registro sin duplicar ----------
def register_if_needed(
    *,
    model_name: str,
    model_uri: str,
    config_hash: Optional[str] = None,
    version_tags: Optional[Dict] = None,
):
    client = MlflowClient()
    try:
        _ensure_registered_model_exists(client, model_name)

        run_id = model_uri.split("/")[1]
        for v in client.search_model_versions(f"name='{model_name}'"):
            if v.run_id == run_id:
                return v.version

        if config_hash:
            for v in client.search_model_versions(f"name='{model_name}'"):
                mv = client.get_model_version(model_name, v.version)
                if getattr(mv, "tags", {}).get("config_hash") == config_hash:
                    return v.version
        mv = mlflow.register_model(model_uri=model_uri, name=model_name)
        mv = _wait_until_ready(client, model_name, mv.version, timeout=180, poll=2.0)

        if version_tags:
            for k, v in version_tags.items():
                client.set_model_version_tag(model_name, mv.version, k, str(v))
        if config_hash:
            client.set_model_version_tag(model_name, mv.version, "config_hash", config_hash)

        return mv.version
    except Exception:
        return None


def set_alias(model_name: str, alias: str, version: str | int):
    try:
        MlflowClient().set_registered_model_alias(model_name, alias, version=version)
    except Exception:
        pass


def quick_log_and_register(
    *,
    experiment: str,
    run_name: str,
    model,
    X, y, X_test,
    params: dict,
    metrics: dict,
    model_name: str,
    artifacts: dict | None = None,
    tags: dict | None = None,
    dedupe: bool = True,
    set_challenger: bool = True,
):
    print("Subiendo modelo...")
    result = log_model_quick(
        experiment=experiment,
        run_name=run_name,
        model=model,
        artifact_path="model",
        X_train=X, y_train=y,
        X_test=X_test,
        params=params,
        metrics=metrics,
        tags=tags,
        artifacts=artifacts,
        config_for_hash={**params, "n_folds": 10, "n_features": X.shape[1]},
        dedupe=dedupe,
    )

    ver = register_if_needed(
        model_name=model_name,
        model_uri=result["model_uri"],
        config_hash=result["config_hash"],
        version_tags={"created_by": "Yose"},
    )

    if set_challenger and ver is not None:
        set_alias(model_name, "challenger", ver)
    print("Modelo subido.")
    return result["model_uri"], ver
from __future__ import annotations
import json
import hashlib
from typing import Dict, Optional
from pathlib import Path

import pandas as pd
import mlflow
from mlflow.models.signature import infer_signature
from mlflow.tracking import MlflowClient


# ---------- Básicos ----------
def set_tracking(uri: str = "http://127.0.0.1:5000"):
    mlflow.set_tracking_uri(uri)


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
    try:
        Xsig = X_test.copy()
        # Remueve columnas identificadoras que no son features (p. ej. "Id")
        for _col in ("Id", "id", "index"):
            if _col in Xsig.columns:
                Xsig = Xsig.drop(columns=[_col])
        example = input_example if input_example is not None else Xsig
        return infer_signature(Xsig, example)
    except Exception:
        return None


# ---------- Logging rápido ----------
def log_model_quick(
    *,
    experiment: str,
    run_name: str,
    model,                         # objeto sklearn/pyfunc
    artifact_path: str = "model",  # en MLflow 3.x esto va en 'name='
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

    # Firma (si hay X_test)
    signature = _signature_from_Xtest(X_test, input_example)

    with mlflow.start_run(run_name=run_name) as run:
        if config_hash:
            mlflow.set_tag("config_hash", config_hash)

        if params:
            mlflow.log_params({k: (v if v is not None else "None") for k, v in params.items()})

        if metrics:
            for k, v in metrics.items():
                mlflow.log_metric(k, float(v))

        if tags:
            mlflow.set_tags(tags)

        # Log del modelo (sklearn preferente; fallback a pyfunc)
        try:
            import mlflow.sklearn as msk
            msk.log_model(
                model,
                name=artifact_path,  # MLflow 3.x
            )
        except Exception:
            mlflow.pyfunc.log_model(
                python_model=model,
                name=artifact_path,  # MLflow 3.x
            )

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
    run_id = model_uri.split("/")[1]

    # ¿ya hay versión para este run?
    for v in client.search_model_versions(f"name='{model_name}'"):
        if v.run_id == run_id:
            return v.version

    # ¿ya hay versión con mismo config_hash?
    if config_hash:
        for v in client.search_model_versions(f"name='{model_name}'"):
            mv = client.get_model_version(model_name, v.version)
            if mv.tags.get("config_hash") == config_hash:
                return v.version

    mv = mlflow.register_model(model_uri=model_uri, name=model_name, tags=(version_tags or {}))
    if config_hash:
        try:
            client.set_model_version_tag(model_name, mv.version, "config_hash", config_hash)
        except Exception:
            pass
    return mv.version


def set_alias(model_name: str, alias: str, version: str | int):
    MlflowClient().set_registered_model_alias(model_name, alias, version=version)


def quick_log_and_register(
    *,
    experiment: str,
    run_name: str,
    model,
    X, y, X_test,
    params: dict,
    metrics: dict,
    model_name: str,
    tags: dict | None = None,
    dedupe: bool = True,
    set_challenger: bool = True,
):
    """
    Atajo: loguea modelo, evita duplicados y registra con alias challenger.
    Retorna (model_uri, version).
    """
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
        config_for_hash={**params, "n_folds": 10, "n_features": X.shape[1]},
        dedupe=dedupe,
    )

    ver = register_if_needed(
        model_name=model_name,
        model_uri=result["model_uri"],
        config_hash=result["config_hash"],
        version_tags={"created_by": "Yose"},
    )

    if set_challenger:
        set_alias(model_name, "challenger", ver)
    print("Modelo subido.")
    return result["model_uri"], ver
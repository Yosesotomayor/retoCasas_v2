import os
import mlflow
from mlflow.tracking import MlflowClient
from pathlib import Path
from typing import Dict, Optional

_CLOUD_HINTS = ("Library/CloudStorage", "OneDrive", "Google Drive", "Dropbox", "iCloud")


def _is_cloud_path(p: Path) -> bool:
    p_str = str(p)
    return any(hint in p_str for hint in _CLOUD_HINTS)


def setup_mlflow(
    experiment: str = "default",
    subdir: str = ".ML",
    *,
    description: Optional[str] = None,
    experiment_tags: Optional[Dict[str, str]] = None,
    registry_uri: Optional[str] = None,
) -> str:
    env_tracking = os.getenv("MLFLOW_TRACKING_URI")
    if env_tracking and env_tracking.startswith("file:"):
        tracking_uri = env_tracking
        mlflow.set_tracking_uri(tracking_uri)
    else:
        base = Path.home() / "Code" / "retoCasas"
        if not base.exists() or _is_cloud_path(base):
            base = Path.home()

        mlruns_path = (base / subdir).resolve()
        mlruns_path.mkdir(parents=True, exist_ok=True)
        tracking_uri = f"file:{mlruns_path}"
        mlflow.set_tracking_uri(tracking_uri)

    if registry_uri:
        mlflow.set_registry_uri(registry_uri)

    mlflow.set_experiment(experiment)
    client = MlflowClient()
    exp = mlflow.get_experiment_by_name(experiment)
    if exp is None:
        exp_id = client.create_experiment(experiment)
        exp = client.get_experiment(exp_id)

    if description:
        client.set_experiment_tag(exp.experiment_id, "mlflow.note.content", description)

    if experiment_tags:
        for k, v in experiment_tags.items():
            client.set_experiment_tag(exp.experiment_id, str(k), str(v))

    print(f"[MLflow] Tracking URI: {mlflow.get_tracking_uri()}")
    try:
        print(f"[MLflow] Registry URI: {mlflow.get_registry_uri()}")
    except Exception:
        pass
    print(f"[MLflow] Experimento:  {exp.name} (id={exp.experiment_id})")
    print(f"[MLflow] Artifact loc:  {exp.artifact_location}")

    return exp.experiment_id

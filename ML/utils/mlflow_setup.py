import mlflow
from mlflow.tracking import MlflowClient
from pathlib import Path

_CLOUD_HINTS = ("Library/CloudStorage", "OneDrive", "Google Drive", "Dropbox", "iCloud")


def _is_cloud_path(p: Path) -> bool:
    p_str = str(p)
    return any(hint in p_str for hint in _CLOUD_HINTS)

def setup_mlflow(
    experiment: str,
    tracking_dir: str | Path = "~/Code/retoCasas/ML",
    description: str = "",
    experiment_tags: dict | None = None,
    registry_uri: str | None = None,
):
    tracking_path = Path(tracking_dir).expanduser().resolve()
    tracking_path.mkdir(parents=True, exist_ok=True)
    
    mlflow.set_tracking_uri(f"file:{tracking_path.as_posix()}")
    if registry_uri:
        mlflow.set_registry_uri(registry_uri)

    exp = mlflow.get_experiment_by_name(experiment)
    if exp is None:
        exp_id = mlflow.create_experiment(
            name=experiment,
            tags=(experiment_tags or {}),
            artifact_location=f"file:{tracking_path.as_posix()}/artifacts"
        )
        client = MlflowClient()
        if description:
            client.set_experiment_tag(exp_id, "description", description)
    else:
        exp_id = exp.experiment_id

    mlflow.set_experiment(experiment)
    #print("Tracking URI:", mlflow.get_tracking_uri())
    #print("Experiment:", experiment, "-> id:", exp_id)
    return exp_id
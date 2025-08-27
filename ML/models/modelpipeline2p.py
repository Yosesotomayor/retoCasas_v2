import os, json, joblib, numpy as np, pandas as pd
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.base import clone
from sklearn.linear_model import ElasticNet
from lightgbm import LGBMRegressor as LGBM

train_data = "data/housing_data/train.csv"
test_data = "data/housing_data/test.csv"

df_train = pd.read_csv(train_data)
df_test = pd.read_csv(test_data)

y = np.log1p(df_train["SalePrice"]).astype(float)
X = df_train.drop(["SalePrice", "Id"], axis=1)

try:
    from datascience.utils_yose import build_preprocessor
except Exception:
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from datascience.utils_yose import build_preprocessor

rstate = 42
base_models = {
    "elasticnet": ElasticNet(alpha=0.0005, l1_ratio=0.9, random_state=rstate),
    "lgbm": LGBM(n_estimators=3000, learning_rate=0.03, max_depth=-1,
                 num_leaves=31, subsample=0.8, colsample_bytree=0.8,
                 random_state=rstate, n_jobs=-1)
}

kf = KFold(n_splits=10, shuffle=True, random_state=rstate)
oof_preds = {name: np.zeros(len(X), dtype=float) for name in base_models}
oof_idx_mask = np.zeros(len(X), dtype=bool)
fold_metrics = []

for fold, (tr_idx, va_idx) in enumerate(kf.split(X, y), 1):
    X_tr, X_va = X.iloc[tr_idx], X.iloc[va_idx]
    y_tr, y_va = y.iloc[tr_idx], y.iloc[va_idx]
    pre = build_preprocessor(X_tr)
    fold_preds = {}
    for name, mdl in base_models.items():
        pipe = Pipeline([("pre", clone(pre)), ("model", clone(mdl))])
        pipe.fit(X_tr, y_tr)
        p = pipe.predict(X_va)
        fold_preds[name] = p
    p_ens = np.mean(np.column_stack([fold_preds[n] for n in base_models]), axis=1)
    rmse = np.sqrt(mean_squared_error(y_va, p_ens))
    r2 = r2_score(y_va, p_ens)
    fold_metrics.append({"fold": fold, "rmse": float(rmse), "r2": float(r2)})
    for name in base_models:
        oof_preds[name][va_idx] = fold_preds[name]
    oof_idx_mask[va_idx] = True

cv_rmse_mean = float(np.mean([m["rmse"] for m in fold_metrics]))
cv_rmse_std  = float(np.std([m["rmse"] for m in fold_metrics]))
cv_r2_mean   = float(np.mean([m["r2"] for m in fold_metrics]))

grid_step = 0.05
best = {"weights": None, "rmse": np.inf, "r2": -np.inf}
M = np.column_stack([oof_preds["elasticnet"], oof_preds["lgbm"]])
y_true = y.values

for w1 in np.arange(0, 1 + 1e-9, grid_step):
            w2 = 1 - w1
            y_pred = w1 * oof_preds["elasticnet"] + w2 * oof_preds["lgbm"]
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            r2 = r2_score(y_true, y_pred)
            if rmse < best["rmse"]:
                best["weights"] = (w1, w2)
                best["rmse"] = rmse
                best["r2"] = r2

opt_weights = {"elasticnet": best["weights"][0], "lgbm": best["weights"][1]}

pre_final = build_preprocessor(X)
final_pipes = {}
for name, mdl in base_models.items():
    pipe = Pipeline([("pre", clone(pre_final)), ("model", clone(mdl))])
    pipe.fit(X, y)
    final_pipes[name] = pipe

out_dir = "datascience/models/pipemodel2p"
os.makedirs(out_dir, exist_ok=True)

joblib.dump(final_pipes["elasticnet"], os.path.join(out_dir, "final_pipe_elasticnet.joblib"))
joblib.dump(final_pipes["lgbm"],  os.path.join(out_dir, "final_pipe_lgbm.joblib"))

meta = {
    "cv": {
        "folds": fold_metrics,
        "rmse_mean": cv_rmse_mean, "rmse_std": cv_rmse_std,
        "r2_mean": cv_r2_mean
    },
    "ensemble_weights": opt_weights,
    "note": "Target en log1p; aplicar expm1 en inferencia para volver a la escala original."
}
with open(os.path.join(out_dir, "meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

preds = np.column_stack([
    final_pipes["elasticnet"].predict(df_test.drop(["Id"], axis=1)),
    final_pipes["lgbm"].predict(df_test.drop(["Id"], axis=1))
])

w_vec = np.array([opt_weights["elasticnet"], opt_weights["lgbm"]], dtype=float)
pred_log = preds @ w_vec
pred_orig = np.expm1(pred_log)

sub_dir = "data/housing_submissions/modelpipeline2p"
os.makedirs(sub_dir, exist_ok=True)
submission = pd.DataFrame({"Id": df_test["Id"], "SalePrice": pred_orig})
submission_path = os.path.join(sub_dir, "submission2p.csv")
submission.to_csv(submission_path, index=False)

print("\n=== RESUMEN CV ===")
print(f"RMSE (mean ± std): {cv_rmse_mean:.5f} ± {cv_rmse_std:.5f}")
print(f"R2   (mean):       {cv_r2_mean:.5f}")
print("Pesos óptimos (OOF):", opt_weights)
print(f"Artefactos guardados en: {out_dir}")
print(f"Submission guardado en: {submission_path}")
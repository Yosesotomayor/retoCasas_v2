import sys

sys.path.append("../../../")
from utils.utils_yose import build_preprocessor

import numpy as np

from sklearn.metrics import r2_score, root_mean_squared_error
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.base import clone
from sklearn.linear_model import ElasticNet

from lightgbm import LGBMRegressor as LGBM


from warnings import filterwarnings

filterwarnings("ignore")

class EnsembleModel:
    def __init__(self, rstate):
        self.weights = None
        self.elasticnet = None
        self.lgbm = None
        self.r2 = None
        self.rmse = None
        self.mse = None
        self.rmse_std = None
        self.rstate = rstate
        self.base_models = {
            "elasticnet": ElasticNet(alpha=0.0005, l1_ratio=0.9, random_state=rstate),
            "lgbm": LGBM(
                n_estimators=3000,
                learning_rate=0.03,
                max_depth=-1,
                num_leaves=31,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=rstate,
                n_jobs=-1,
            ),
        }

    def fit(self, X, y):
        kf = KFold(n_splits=10, shuffle=True, random_state=self.rstate)
        oof_preds = {name: np.zeros(len(X), dtype=float) for name in self.base_models}
        oof_idx_mask = np.zeros(len(X), dtype=bool)
        fold_metrics = []

        for fold, (tr_idx, va_idx) in enumerate(kf.split(X, y), 1):
            X_tr, X_va = X.iloc[tr_idx], X.iloc[va_idx]
            y_tr, y_va = y.iloc[tr_idx], y.iloc[va_idx]
            pre = build_preprocessor(X_tr)
            fold_preds = {}
        for name, mdl in self.base_models.items():
            pipe = Pipeline([("pre", clone(pre)), ("model", clone(mdl))])
            pipe.fit(X_tr, y_tr)
            p = pipe.predict(X_va)
            fold_preds[name] = p
        p_ens = np.mean(
            np.column_stack([fold_preds[n] for n in self.base_models]), axis=1
        )
        rmse = root_mean_squared_error(y_va, p_ens)
        mse = np.mean((y_va - p_ens) ** 2)
        r2 = r2_score(y_va, p_ens)
        fold_metrics.append({"fold": fold, "rmse": float(rmse), "r2": float(r2) ,"mse": float(mse)})
        for name in self.base_models:
            oof_preds[name][va_idx] = fold_preds[name]
        oof_idx_mask[va_idx] = True

        cv_rmse_mean = float(np.mean([m["rmse"] for m in fold_metrics]))
        cv_rmse_std = float(np.std([m["rmse"] for m in fold_metrics]))
        cv_r2_mean = float(np.mean([m["r2"] for m in fold_metrics]))
        cv_mse_mean = float(np.mean([m["mse"] for m in fold_metrics]))

        print(f"CV RMSE mean: {cv_rmse_mean:.4f}")
        print(f"CV RMSE std: {cv_rmse_std:.4f}")
        print(f"CV R2 mean: {cv_r2_mean:.4f}")
        print(f"CV MSE mean: {cv_mse_mean:.4f}")

        grid_step = 0.05
        best = {"weights": None, "rmse": np.inf, "r2": -np.inf}
        y_true = y.values

        for w1 in np.arange(0, 1 + 1e-9, grid_step):
            w2 = 1 - w1
            y_pred = w1 * oof_preds["elasticnet"] + w2 * oof_preds["lgbm"]
            rmse = root_mean_squared_error(y_true, y_pred)
            r2 = r2_score(y_true, y_pred)
            if rmse < best["rmse"]:
                best["weights"] = (w1, w2)
                best["rmse"] = rmse
                best["r2"] = r2
                best['mse'] = mse

        self.weights = {"elasticnet": best["weights"][0], "lgbm": best["weights"][1]}

        pre_final = build_preprocessor(X)
        final_pipes = {}
        for name, mdl in self.base_models.items():
            pipe = Pipeline([("pre", clone(pre_final)), ("model", clone(mdl))])
            pipe.fit(X, y)
            final_pipes[name] = pipe

        self.elasticnet = final_pipes["elasticnet"]
        self.lgbm = final_pipes["lgbm"]
        self.r2 = cv_r2_mean
        self.rmse = cv_rmse_mean
        self.rmse_std = cv_rmse_std
        self.mse = cv_mse_mean
        
        return self

    def predict(self, X):
        p1 = self.elasticnet.predict(X)
        p2 = self.lgbm.predict(X)
        return np.expm1(self.weights["elasticnet"] * p1 + self.weights["lgbm"] * p2)

    def get_params(self):
        return {
            "elasticnet": self.elasticnet.get_params(),
            "lgbm": self.lgbm.get_params(),
        }

    def get_metrics(self):
        return {
            "r2": self.r2,
            "rmse": self.rmse,
            "rmse_std": self.rmse_std,
            "mse": self.mse
        }

    def _build_final_pipes(self, X, y, use_log_target=True):
        pre_final = build_preprocessor(X)
        y_train = np.log1p(y.values) if use_log_target else y.values

        final_pipes = {}
        for name, mdl in self.base_models.items():
            pipe = Pipeline([("pre", clone(pre_final)), ("model", clone(mdl))])
            pipe.fit(X, y_train)
            final_pipes[name] = pipe
        return final_pipes

    def _opt_weights_least_squares(self, y_true, p1, p2, clip01=True):
        A = (p1 - p2).reshape(-1, 1)
        b = y_true - p2
        denom = (A.T @ A)[0, 0]
        if denom <= 1e-12:
            w = 0.5
        else:
            w = float((A.T @ b)[0] / denom)
        if clip01:
            w = float(np.clip(w, 0.0, 1.0))
        return {"elasticnet": w, "lgbm": 1.0 - w}

    def fit_full(
        self, X, y, reuse_cv_weights=True, grid_fallback=False, use_log_target=True
    ):
        final_pipes = self._build_final_pipes(X, y, use_log_target=use_log_target)
        self.elasticnet = final_pipes["elasticnet"]
        self.lgbm = final_pipes["lgbm"]

        if reuse_cv_weights and isinstance(self.weights, dict):
            pass
        else:
            p1 = self.elasticnet.predict(X)
            p2 = self.lgbm.predict(X)

            y_train = np.log1p(y.values) if use_log_target else y.values

            w = self._opt_weights_least_squares(y_train, p1, p2, clip01=True)

            if grid_fallback:
                best = {"w": w["elasticnet"], "rmse": np.inf}
                for w1 in np.linspace(0, 1, 41):  # paso 0.025
                    y_hat = w1 * p1 + (1 - w1) * p2
                    rmse = root_mean_squared_error(y_train, y_hat)
                    if rmse < best["rmse"]:
                        best["w"] = w1
                        best["rmse"] = rmse
                w = {"elasticnet": best["w"], "lgbm": 1 - best["w"]}

            self.weights = w

        y_train_pred = self.weights["elasticnet"] * self.elasticnet.predict(
            X
        ) + self.weights["lgbm"] * self.lgbm.predict(X)
        y_train_true = np.log1p(y.values) if use_log_target else y.values
        self.rmse = float(root_mean_squared_error(y_train_true, y_train_pred))
        self.r2 = float(r2_score(y_train_true, y_train_pred))
        self.rmse_std = None 
        return self

    def predict_full(self, X, trained_on_log=True):
        p1 = self.elasticnet.predict(X)
        p2 = self.lgbm.predict(X)
        pred = self.weights["elasticnet"] * p1 + self.weights["lgbm"] * p2
        return np.expm1(pred) if trained_on_log else pred

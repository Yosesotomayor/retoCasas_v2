import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline

from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.model_selection import train_test_split

from sklearn.base import clone

try:
    # When running as a module:  python -m datascience.models.3modelpipelineRAW
    from ..utils_yose import build_preprocessor  # relative import within the package
except ImportError:
    # Fallback for running the file directly:  python datascience/models/3modelpipelineRAW.py
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from datascience.utils_yose import build_preprocessor  # absolute import after adjusting sys.path

from lightgbm import LGBMRegressor as lgbm
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Lasso

import joblib

train_data = "data/housing_data/train.csv"
test_data = "data/housing_data/test.csv"
df_train = pd.read_csv(train_data)

y = np.log1p(df_train["SalePrice"])  # log1p target
X = df_train.drop(["SalePrice", "Id"], axis=1)
X_train, X_valid, y_train, y_valid = train_test_split(
      X, y, test_size=0.2, random_state=42
)

rstate = 42

kf = KFold(n_splits=10, shuffle=True, random_state=rstate)

rmse_scores = []
r2_scores = []
trained_models = []

for fold, (train_idx, valid_idx) in enumerate(kf.split(X_train, y_train)):
    X_train_fold, X_valid_fold = X_train.iloc[train_idx], X_train.iloc[valid_idx]
    y_train_fold, y_valid_fold = y_train.iloc[train_idx], y_train.iloc[valid_idx]

    pre_fold = build_preprocessor(X_train_fold)
    pre_fold.fit(X_train_fold)

    pipe_lasso_fold = Pipeline([
        ("pre", clone(pre_fold)),
        ("model", Lasso(alpha=0.0005, max_iter=5000, random_state=rstate))
    ])
    pipe_rf_fold = Pipeline([
        ("pre", clone(pre_fold)),
        ("model", RandomForestRegressor(
            n_estimators=600, max_features="sqrt", random_state=rstate, n_jobs=-1
        ))
    ])
    pipe_lgbm_fold = Pipeline([
        ("pre", clone(pre_fold)),
        ("model", lgbm(
            n_estimators=3000, learning_rate=0.03, max_depth=-1,
            num_leaves=31, subsample=0.8, colsample_bytree=0.8,
            random_state=rstate, n_jobs=-1
        ))
    ])

    pipe_lasso_fold.fit(X_train_fold, y_train_fold)
    pipe_rf_fold.fit(X_train_fold, y_train_fold)
    pipe_lgbm_fold.fit(X_train_fold, y_train_fold)

    p_lasso_fold = pipe_lasso_fold.predict(X_valid_fold)
    p_rf_fold    = pipe_rf_fold.predict(X_valid_fold)
    p_lgbm_fold  = pipe_lgbm_fold.predict(X_valid_fold)

    p_ens_fold = (p_lasso_fold + p_rf_fold + p_lgbm_fold) / 3

    rmse_fold = np.sqrt(mean_squared_error(y_valid_fold, p_ens_fold))
    r2_fold = r2_score(y_valid_fold, p_ens_fold)
    
    rmse_scores.append(rmse_fold)
    r2_scores.append(r2_fold)

    trained_models.append({
        'lasso': pipe_lasso_fold,
        'rf': pipe_rf_fold,
        'lgbm': pipe_lgbm_fold
    })

    print(f"Fold {fold+1}: RMSE = {rmse_fold:,.5f}, R2 = {r2_fold:.5f}")

best_fold_index = np.argmin(rmse_scores)
best_rmse = rmse_scores[best_fold_index]
best_r2 = r2_scores[best_fold_index]

best_models = trained_models[best_fold_index]
best_pipe_lasso = best_models['lasso']
best_pipe_rf = best_models['rf']
best_pipe_lgbm = best_models['lgbm']

print("\n---")
print(f"Mejor fold: {best_fold_index + 1}")
print(f"RMSE del mejor fold: {best_rmse:,.5f}")
print(f"R2 del mejor fold  : {best_r2:.5f}")
print("\nLos modelos del mejor fold están guardados en las variables 'best_pipe_lasso', 'best_pipe_rf', y 'best_pipe_lgbm'.")

print("Guardando modelo...")
joblib.dump(best_pipe_lasso, "data/models/housing/3pipemodelRAW/best_pipe_lasso.joblib")
joblib.dump(best_pipe_rf, "data/models/housing/3pipemodelRAW/best_pipe_rf.joblib")
joblib.dump(best_pipe_lgbm, "data/models/housing/3pipemodelRAW/best_pipe_lgbm.joblib")
print("Modelos guardados.")
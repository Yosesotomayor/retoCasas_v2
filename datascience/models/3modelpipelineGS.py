import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, KFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, PowerTransformer
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Lasso
from sklearn.ensemble import RandomForestRegressor
import lightgbm as lgb

from sklearn.metrics import mean_squared_error

import joblib

try:
    from ..utils_yose import build_preprocessor
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from datascience.utils_yose import make_features  # absolute import after adjusting sys.path


warnings.filterwarnings('ignore')
pd.set_option('display.float_format', lambda x: '%.5f' % x)

train_data = "data/housing_data/train.csv"
test_data = "data/housing_data/test.csv"
df_train = pd.read_csv(train_data)

y = np.log1p(df_train["SalePrice"])  # log1p target
X = df_train.drop(["SalePrice", "Id"], axis=1)
X_train, X_valid, y_train, y_valid = train_test_split(
    X, y, test_size=0.2, random_state=42
)

def make_preprocessor():
    try:
        ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        ohe = OneHotEncoder(handle_unknown="ignore", sparse=False)

    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("power", PowerTransformer(method="yeo-johnson", standardize=True)),
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", ohe),
    ])

    return ColumnTransformer([
        ("num", num_pipe, make_column_selector(dtype_include=np.number)),
        ("cat", cat_pipe, make_column_selector(dtype_include=object)),
    ])

base_lasso = Pipeline([
    ("feat", FunctionTransformer(make_features, validate=False)),
    ("pre", make_preprocessor()),
    ("model", Lasso(max_iter=10000))
])

base_rf = Pipeline([
    ("feat", FunctionTransformer(make_features, validate=False)),
    ("pre", make_preprocessor()),
    ("model", RandomForestRegressor(n_jobs=-1, random_state=42))
])

base_lgbm = Pipeline([
    ("feat", FunctionTransformer(make_features, validate=False)),
    ("pre", make_preprocessor()),
    ("model", lgb.LGBMRegressor(n_jobs=-1, random_state=42))
])

lasso_params = {
    "model__alpha": [0.0005, 0.001, 0.005, 0.01],
    "model__max_iter": [10000],
}

rf_params = {
    "model__n_estimators": [400, 600],
    "model__max_features": ["sqrt", "log2"],
    "model__min_samples_leaf": [1, 2, 4],
    "model__max_depth": [None, 12, 20],
}

lgbm_params = {
    "model__n_estimators": [1500],
    "model__learning_rate": [0.01, 0.02],
    "model__num_leaves": [31, 63],
    "model__max_depth": [6],
    "model__subsample": [0.8, 0.9],
    "model__colsample_bytree": [0.8, 1.0],
}

cv = KFold(n_splits=5, shuffle=True, random_state=42)

pipe_lasso_cv = GridSearchCV(
    base_lasso, lasso_params, cv=cv,
    scoring="neg_root_mean_squared_error",
    n_jobs=-1, verbose=1
)

pipe_rf_cv = GridSearchCV(
    base_rf, rf_params, cv=cv,
    scoring="neg_root_mean_squared_error",
    n_jobs=-1, verbose=1
)

pipe_lgbm_cv = GridSearchCV(
    base_lgbm, lgbm_params, cv=cv,
    scoring="neg_root_mean_squared_error",
    n_jobs=-1, verbose=1
)

pipe_lasso_cv.fit(X_train, y_train)
pipe_rf_cv.fit(X_train, y_train)
pipe_lgbm_cv.fit(X_train, y_train)

def show(gs, name):
    print(f"{name} | best RMSE (CV): {-gs.best_score_:.5f}")
    print(f"{name} | best params   : {gs.best_params_}\n")

show(pipe_lasso_cv, "LASSO")
show(pipe_rf_cv,   "RF")
show(pipe_lgbm_cv, "LGBM")

results = []
for name, gs in [("LASSO", pipe_lasso_cv), ("RF", pipe_rf_cv), ("LGBM", pipe_lgbm_cv)]:
    y_valid_pred_log = gs.best_estimator_.predict(X_valid)
    rmse_valid = mean_squared_error(np.expm1(y_valid), np.expm1(y_valid_pred_log), squared=False)
    results.append((name, rmse_valid, gs))
    print(f"{name} | RMSE (hold‑out): {rmse_valid:.5f}")

rmse_mean_3 = np.mean([-pipe_lasso_cv.best_score_, -pipe_rf_cv.best_score_, -pipe_lgbm_cv.best_score_])
print(f"RMSE medio de los 3 (CV): {rmse_mean_3:.5f}")

best_name, best_rmse, best_gs = sorted(results, key=lambda t: t[1])[0]
print(f"\nMejor modelo por hold‑out: {best_name} | RMSE: {best_rmse:.5f}")

joblib.dump(best_gs.best_estimator_, "data/models/housing/best_houseprice_pipeline.joblib")
print('Modelo guardado.')


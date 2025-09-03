import pandas as pd
import numpy as np

import matplotlib.pyplot as plt
import seaborn as sns

import scipy.stats as stats

from typing import Dict, List, Tuple

from sklearn.preprocessing import OneHotEncoder, PowerTransformer
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

import os

import sys

sys.path.append("../../")

plt.style.use("seaborn-v0_8")
sns.set_palette("husl")


def load_data(sub_dir: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    train_data = os.path.join(sub_dir, "train.csv")
    test_data = os.path.join(sub_dir, "test.csv")
    if os.path.exists(train_data):
        df_train = pd.read_csv(train_data)
    else:
        print("No se encuentra el archivo de entrenamiento")

    if os.path.exists(test_data):
        df_test = pd.read_csv(test_data)
    else:
        print("No se encuentra el archivo de prueba")

    return df_train, df_test


def plot_hist_per_columns(df, cols, bins=20):
    if isinstance(cols, str):
        cols = [cols]
    else:
        cols = list(cols)

    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise KeyError(f"Columnas no encontradas en df: {missing}")

    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if len(cols) == 1:
        axs = [axs]
    for i, col in enumerate(cols):
        data = pd.to_numeric(df[col], errors="coerce").dropna()
        axs[i].hist(data, bins=bins)
        axs[i].set_title(col)
        axs[i].grid(alpha=1)
    fig.tight_layout()
    return fig, axs


def plot_scatter_per_columns(df, cols):
    if isinstance(cols, str):
        cols = [cols]
    else:
        cols = list(cols)

    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise KeyError(f"Columnas no encontradas en df: {missing}")

    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if len(cols) == 1:
        axs = [axs]
    for i, col in enumerate(cols):
        axs[i].scatter(df[col], df["SalePrice"])
        axs[i].set_title(col)
        axs[i].grid()
    fig.tight_layout()
    return fig, axs


def plot_box_per_columns(
    df: pd.DataFrame,
    cols,
    *,
    cmap_name: str = "viridis",
    showfliers: bool = False,
    notch: bool = True,
):
    if isinstance(cols, str):
        cols = [cols]
    else:
        cols = list(cols)

    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise KeyError(f"Columnas no encontradas en df: {missing}")

    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if len(cols) == 1:
        axs = [axs]

    cmap = plt.cm.get_cmap(cmap_name, len(cols))
    colors = [cmap(i) for i in range(len(cols))]

    for i, col in enumerate(cols):
        data = pd.to_numeric(df[col], errors="coerce").dropna().values

        if data.size == 0:
            axs[i].set_title(f"{col} (sin datos)")
            axs[i].axis("off")
            continue

        boxprops = dict(facecolor=colors[i], edgecolor=colors[i], linewidth=1.5)
        medianprops = dict(linewidth=1.6)
        whiskerprops = dict(linewidth=1.2)
        capprops = dict(linewidth=1.2)

        axs[i].boxplot(
            [data],
            vert=True,
            patch_artist=True,
            notch=notch,
            showfliers=showfliers,
            boxprops=boxprops,
            medianprops=medianprops,
            whiskerprops=whiskerprops,
            capprops=capprops,
        )

        axs[i].set_title(col)
        axs[i].grid(alpha=1)
        axs[i].set_xticks([])

    fig.tight_layout()
    return fig, axs


def plot_hist_scatter_per_columns(df, col):
    N = 15
    fig, axs = plt.subplots(1, 2, figsize=(N, 5))
    axs[0].set_title(f"Histogram of {col}")
    axs[0].hist(df[col])
    axs[0].grid()
    axs[1].set_title(f"Scatterplot of {col} vs SalePrice")
    axs[1].scatter(df[col], df["SalePrice"])
    axs[1].grid()
    fig.tight_layout()


def outliers_detection(df: pd.Series = None) -> np.array:
    Q1 = df.quantile(0.25)
    Q3 = df.quantile(0.75)
    IQR = Q3 - Q1
    outliers = []
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    for index, value in df.items():
        if not (lower < value < upper):
            outliers.append(index)
            return np.array(outliers)


def shapiro_wilk_test(data: pd.Series, print_results: bool = True) -> bool:
    stadistic, pvalue = stats.shapiro(data)
    if print_results:
        print(f"Shapiro-Wilk test stadistic: {stadistic:.4f}")
        print(f"p-value: {pvalue:.10f}")
    if pvalue < 0.05:
        if print_results:
            print("Data is not normal.")
            return False
    else:
        if print_results:
            print("Data is normal.")
            return True


def jarque_bera_test(data: pd.Series, print_results: bool = True) -> bool:
    stadistic, pvalue = stats.jarque_bera(data)
    if print_results:
        print(f"Jarque_Bera test stadistic: {stadistic:.4f}")
        print(f"p-value: {pvalue:.10f}")
        if pvalue < 0.05:
            if print_results:
                print("Data is not normal.")
                return False
        else:
            if print_results:
                print("Data is normal.")
                return True


def QQPlot(measurements: pd.Series) -> None:
    plt.figure(figsize=(8, 5))
    stats.probplot(measurements.values, dist="norm", plot=plt)
    plt.grid(1)
    plt.title(f"QQ-Plot of {measurements.name}")
    plt.tight_layout()
    plt.show()


def plot_feature_correlations(df: pd.DataFrame, y: pd.Series, top_n: int = 20):
    y_aligned = pd.to_numeric(y.reindex(df.index), errors="coerce")
    X_num = df.select_dtypes(include=[np.number])

    mask = y_aligned.notna()
    X_num = X_num.loc[mask]
    y_aligned = y_aligned.loc[mask]

    corr = X_num.corrwith(y_aligned).abs().sort_values(ascending=False)
    top_corr = corr.head(top_n)

    fig, ax = plt.subplots(figsize=(8, 6))
    top_corr.plot(kind="barh", color="red", ax=ax)
    ax.set_title(
        f"Top {min(top_n, len(top_corr))} correlaciones con {y_aligned.name or 'y'}"
    )
    ax.set_xlabel("Correlación absoluta")
    ax.set_ylabel("Características")
    ax.grid(True, alpha=0.3, axis="x")
    ax.invert_yaxis()  # mayor arriba
    fig.tight_layout()
    plt.show()

    return top_corr, (fig, ax)


def log_transform(data: pd.Series) -> pd.Series:
    if (data < 0).any():
        print("<<Warning>> Data has negative values.")
    elif (data == 0).any():
        print("<<Warning>> Data has 0 values.")
    return np.log1p(data)


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # --- 1) Fuerza numérico en TODAS las columnas que usas en operaciones ---
    num_cols = [
        "TotalBsmtSF",
        "1stFlrSF",
        "2ndFlrSF",
        "FullBath",
        "HalfBath",
        "BsmtFullBath",
        "BsmtHalfBath",
        "OpenPorchSF",
        "EnclosedPorch",
        "3SsnPorch",
        "ScreenPorch",
        "WoodDeckSF",
        "YrSold",
        "YearBuilt",
        "YearRemodAdd",
        "GarageYrBlt",
        "PoolArea",
        "GrLivArea",
        "OverallQual",
        "GarageArea",
    ]
    for c in num_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # --- 2) Features numéricas (ya en float/int) ---
    df["TotalSF"] = (
        df.get("TotalBsmtSF", 0).fillna(0)
        + df.get("1stFlrSF", 0).fillna(0)
        + df.get("2ndFlrSF", 0).fillna(0)
    )

    df["TotalBath"] = (
        df.get("FullBath", 0).fillna(0)
        + 0.5 * df.get("HalfBath", 0).fillna(0)
        + df.get("BsmtFullBath", 0).fillna(0)
        + 0.5 * df.get("BsmtHalfBath", 0).fillna(0)
    )

    df["TotalPorchSF"] = (
        df.get("OpenPorchSF", 0).fillna(0)
        + df.get("EnclosedPorch", 0).fillna(0)
        + df.get("3SsnPorch", 0).fillna(0)
        + df.get("ScreenPorch", 0).fillna(0)
        + df.get("WoodDeckSF", 0).fillna(0)
    )

    yr_sold = df.get("YrSold", 0).fillna(0)
    yb = df.get("YearBuilt", 0).fillna(0)
    yrm = df.get("YearRemodAdd", 0).fillna(0)
    gyr = df.get("GarageYrBlt", pd.Series(index=df.index, dtype=float))

    df["HouseAge"] = yr_sold - yb
    df["SinceRemodel"] = yr_sold - yrm

    garage_year = gyr.fillna(yb)
    df["SinceGarage"] = yr_sold - garage_year

    df["HasPool"] = (df.get("PoolArea", 0).fillna(0) > 0).astype(int)
    df["Has2ndFloor"] = (df.get("2ndFlrSF", 0).fillna(0) > 0).astype(int)
    df["HasBsmt"] = (df.get("TotalBsmtSF", 0).fillna(0) > 0).astype(int)
    df["HasGarage"] = (df.get("GarageArea", 0).fillna(0) > 0).astype(int)

    if "OverallQual" in df.columns and "GrLivArea" in df.columns:
        df["OverallQual_GrLivArea"] = df["OverallQual"].fillna(0) * df[
            "GrLivArea"
        ].fillna(0)

    # --- 3) Copias categóricas sin pisar lo numérico ---
    if "MSSubClass" in df.columns:
        df["MSSubClass_cat"] = df["MSSubClass"].astype(str)
    if "MoSold" in df.columns:
        df["MoSold_cat"] = df["MoSold"].astype(str)
    if "YrSold" in df.columns:
        df["YrSold_cat"] = df["YrSold"].astype(str)

    return df


def fill_domain_na(df_all: pd.DataFrame) -> pd.DataFrame:
    df = df_all.copy()

    none_cols = [
        "PoolQC",
        "MiscFeature",
        "Alley",
        "Fence",
        "FireplaceQu",
        "GarageType",
        "GarageFinish",
        "GarageQual",
        "GarageCond",
        "BsmtQual",
        "BsmtCond",
        "BsmtExposure",
        "BsmtFinType1",
        "BsmtFinType2",
        "MasVnrType",
    ]
    for col in none_cols:
        if col in df.columns:
            df[col] = df[col].fillna("None")

    if "LotFrontage" in df.columns and "Neighborhood" in df.columns:
        df["LotFrontage"] = df.groupby("Neighborhood")["LotFrontage"].transform(
            lambda s: s.fillna(s.median())
        )

    if "GarageYrBlt" in df.columns and "YearBuilt" in df.columns:
        df["GarageYrBlt"] = df["GarageYrBlt"].fillna(df["YearBuilt"])

    if "MasVnrArea" in df.columns and "MasVnrType" in df.columns:
        df.loc[df["MasVnrType"].eq("None"), "MasVnrArea"] = df.loc[
            df["MasVnrType"].eq("None"), "MasVnrArea"
        ].fillna(0)

    mode_fills: Dict[str, str] = {
        "MSZoning": "RL",
        "Functional": "Typ",
        "Electrical": "SBrkr",
        "KitchenQual": "TA",
        "Exterior1st": "VinylSd",
        "Exterior2nd": "VinylSd",
        "SaleType": "WD",
        "Utilities": "AllPub",
    }
    for col, default in mode_fills.items():
        if col in df.columns:
            df[col] = df[col].fillna(default)

    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_columns = df.select_dtypes(include=["object"]).columns.tolist()
    for col in numeric_columns:
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())
    for col in categorical_columns:
        if df[col].isna().any():
            df[col] = df[col].fillna("Unknown")

    return df


def map_ordinal_categories(df_all: pd.DataFrame) -> pd.DataFrame:
    df = df_all.copy()

    qual_map = {"Po": 1, "Fa": 2, "TA": 3, "Gd": 4, "Ex": 5, "None": 0}
    exp_map = {"No": 0, "Mn": 1, "Av": 2, "Gd": 3, "None": 0}
    fin_map = {"Unf": 1, "LwQ": 2, "Rec": 3, "BLQ": 4, "ALQ": 5, "GLQ": 6, "None": 0}
    func_map = {
        "Sal": 1,
        "Sev": 2,
        "Maj2": 3,
        "Maj1": 4,
        "Mod": 5,
        "Min2": 6,
        "Min1": 7,
        "Typ": 8,
    }
    pave_map = {"N": 0, "P": 1, "Y": 2}

    ordinal_specs: List[Tuple[str, Dict[str, int]]] = [
        ("ExterQual", qual_map),
        ("ExterCond", qual_map),
        ("BsmtQual", qual_map),
        ("BsmtCond", qual_map),
        ("HeatingQC", qual_map),
        ("KitchenQual", qual_map),
        ("FireplaceQu", qual_map),
        ("GarageQual", qual_map),
        ("GarageCond", qual_map),
        ("PoolQC", qual_map),
        ("BsmtExposure", exp_map),
        ("BsmtFinType1", fin_map),
        ("BsmtFinType2", fin_map),
        ("Functional", func_map),
        ("PavedDrive", pave_map),
    ]

    for col, mapper in ordinal_specs:
        if col in df.columns:
            df[col] = df[col].map(mapper).fillna(0).astype(int)

    return df


def build_preprocessor(df_all: pd.DataFrame) -> ColumnTransformer:
    numeric_features = df_all.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = df_all.select_dtypes(include=["object"]).columns.tolist()

    try:
        categorical_encoder = OneHotEncoder(
            handle_unknown="ignore", sparse_output=False
        )
    except TypeError:
        categorical_encoder = OneHotEncoder(handle_unknown="ignore", sparse=False)

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("power", PowerTransformer(method="yeo-johnson", standardize=True)),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", categorical_encoder),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_features),
            ("cat", categorical_pipeline, categorical_features),
        ]
    )

    return preprocessor


def make_features(df):
    df = add_engineered_features(df)
    df = fill_domain_na(df)
    df = map_ordinal_categories(df)
    return df


def predict_5pipeline(pipelines, X):
    list_keys = list(pipelines.keys())
    p_lasso = pipelines[list_keys[0]].predict(X)
    p_rf = pipelines[list_keys[1]].predict(X)
    p_lgbm = pipelines[list_keys[2]].predict(X)
    p_xgb = pipelines[list_keys[3]].predict(X)
    p_cat = pipelines[list_keys[4]].predict(X)
    return (p_lasso + p_rf + p_lgbm + p_xgb + p_cat) / 5

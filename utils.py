import pandas as pd 
import numpy as np 
import matplotlib.pyplot as plt 
import scipy.stats as stats 


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
    axs[0].set_title(f'Histogram of {col}')
    axs[0].hist(df[col])
    axs[0].grid()
    axs[1].set_title(f'Scatterplot of {col} vs SalePrice')
    axs[1].scatter(df[col], df["SalePrice"])
    axs[1].grid()
    fig.tight_layout()

def outliers_detection(df: pd.Series = None) -> np.array: 
    description = df.describe() 
    Q1 = description[4] 
    Q3 = description[6] 
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
    plt.figure(figsize=(8,5)) 
    stats.probplot(measurements.values, dist='norm', plot=plt) 
    plt.grid(1) 
    plt.title(f'QQ-Plot of {measurements.name}')
    plt.tight_layout() 
    plt.show() 

def log_transform(data : pd.Series) -> pd.Series: 
    if (data < 0).any(): 
        print('<<Warning>> Data has negative values.')
    elif (data == 0).any(): 
        print('<<Warning>> Data has 0 values.') 
    return np.log(data)
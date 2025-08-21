import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import shapiro

def plot_hist_per_columns(df, cols):
    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if isinstance(axs, str):
        axs = [axs]
    for i, col in enumerate(cols):
        axs[i].hist(df[col])
        axs[i].set_title(col)
        axs[i].grid()
    fig.tight_layout()

def plot_scatter_per_columns(df, cols):
    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if isinstance(axs, str):
        axs = [axs]
    for i, col in enumerate(cols):
        axs[i].scatter(df[col], df["SalePrice"])
        axs[i].set_title(col)
        axs[i].grid()
    fig.tight_layout()

def plot_box_per_columns(df, cols):
    N = 15 if len(cols) > 1 else 5
    fig, axs = plt.subplots(1, len(cols), figsize=(N, 5))
    if isinstance(axs, str):
        axs = [axs]
    
    cmap = plt.cm.viridis
    colors = cmap(np.linspace(0, 1, len(cols)))

    for i, col in enumerate(cols):
        data = df[col].dropna().values
        axs[i].boxplot([data], vert=True, patch_artist=True, notch=True, showfliers=False, boxprops=dict(color=colors[i]))
        axs[i].set_title(col)
        axs[i].grid()
    fig.tight_layout()

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

def shapiro_wilk_test(data, print_results=True):
    statistic, pvalue = shapiro(data)
    if print_results:
        print(f"Shapiro-Wilk test statistic: {statistic:.4f}")
        print(f"p-value: {pvalue:.4f}")
    if pvalue < 0.05:
        if print_results:
            print("The data is not normally distributed. \n")
        return False
    else:
        if print_results:
            print("The data is normally distributed. \n")
        return True
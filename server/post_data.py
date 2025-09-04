import requests
import numpy as np
import pandas as pd
import sys
sys.path.append("../")
from utils.utils_yose import load_data

url = "http://127.0.0.1:8000/predict"
data_url = "../data/housing_data/"

_, test = load_data(data_url)

row = test.iloc[4]
row = row.where(pd.notna(row), None) 

clean = {k: (v.item() if isinstance(v, (np.floating, np.integer)) else v) for k, v in row.to_dict().items()}

resp = requests.post(url, json=clean, timeout=30)
print(resp.status_code, resp.json())
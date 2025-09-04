import requests
import numpy as np
import pandas as pd
import sys
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("test_prediction")
sys.path.append("../")
from utils.utils_yose import load_data

url = "http://127.0.0.1:8000/predict"
data_url = "../data/housing_data/"

_, test = load_data(data_url)

row = test.iloc[4]
row = row.where(pd.notna(row), None) 

clean = {k: (v.item() if isinstance(v, (np.floating, np.integer)) else v) for k, v in row.to_dict().items()}

log.info("Enviando registro Id=%s", clean.get("Id", "-"))
try:
    resp = requests.post(url, json=clean, timeout=30)
    log.info("Status: %s", resp.status_code)
    log.info("Response: %s", resp.json())
except Exception as e:
    log.exception("Fallo el POST: %s", e)
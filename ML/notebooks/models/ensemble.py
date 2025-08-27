import numpy as np
import pandas as pd

import joblib
import mlflow
import json

class WeightedEnsemble(mlflow.pyfunc.PythonModel):
    def load_context(self, context):
        self.model_elnet = joblib.load(context.artifacts["model_elasticnet_pkl"])
        self.model_lgbm  = joblib.load(context.artifacts["model_lgbm_pkl"])
        weights = json.load(open(context.artifacts["weights_json"], "r"))
        self.w_elnet = float(weights["w_elnet"])
        self.w_lgbm  = float(weights["w_lgbm"])

    def predict(self, context, model_input: pd.DataFrame):
        p1 = self.model_elnet.predict(model_input)
        p2 = self.model_lgbm.predict(model_input)
        return np.expm1(self.w_elnet * p1 + self.w_lgbm * p2)
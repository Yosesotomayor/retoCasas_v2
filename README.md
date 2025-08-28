## Comando MLFlow
UI:
     mlflow ui --backend-store-uri file:$HOME/Code/retoCasas/ML --port 5000
Server:
     mlflow server \
       --backend-store-uri file:$HOME/Code/retoCasas/ML \
       --default-artifact-root file:/Users/tu_usuario/Code/retoCasas/ML_artifacts \
       --host 127.0.0.1 --port 5000

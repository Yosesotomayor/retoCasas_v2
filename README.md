🏡 Reto Casas — Predicción de Precios + Producto Web

Proyecto integral de Ciencia de Datos + Ingeniería de Software, enfocado en la predicción de precios de casas y su despliegue como aplicación web.

⚙️ Instalación y uso
🔹 Requisitos

Docker
 y Docker Compose

Python 3.10+ (para desarrollo local)

Node.js 18+ (para frontend)

🔹 Desarrollo con Docker

Levantar servicios en modo desarrollo:

make up-dev

Bajar servicios:

make down-dev

🔹 Local (sin Docker)
cd ML
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

🔹 Configuracion de variables de entorno

```bash
# app/.env

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-replace-with-a-secure-random-string

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=yout_client_secret

# MLFlow

MLFLOW_TRACKING_URI=model_URI
MLFLOW_REGISTRY_URI=model_URI
DAGSHUB_TOKEN=token

MODEL_NAME:elnet_lgbm
MODEL_ALIAS:champion

```

🤖 Machine Learning

Modelos probados: ElasticNet, LightGBM, Ensemble.

Gestión de experimentos con MLflow.

Outputs guardados en ML/models/ y data/housing_submissions/.

🌐 Producto

Backend: expone un API REST para predicciones.

Frontend: interfaz con Next.js y Tailwind para explorar resultados y consultar predicciones.

Ejemplo de endpoint:

POST /predict
{
  "features": { ... }
}

📊 Reportes

EDA Housing (reportes/Reporte EDA Housing.pdf)
Análisis exploratorio de los datos de entrenamiento.

🧑‍💻 Autor

Yose Sotomayor
Data Science & Mathematics Engineering — Tec de Monterrey
LinkedIn
 • GitHub
poner sus nombres cawns

🏡 Reto Casas — Predicción de Precios + Producto Web





Proyecto integral de Ciencia de Datos + Ingeniería de Software, enfocado en la predicción de precios de casas y su despliegue como aplicación web.

📂 Estructura del Proyecto
retoCasas_v2/
├── ML/                  # Modelado y experimentación
│   ├── backend/         # Backend ML (Flask/FastAPI)
│   ├── data/            # Submissions y outputs de modelos
│   ├── models/          # Modelos entrenados
│   ├── notebooks/       # Exploración y experimentación
│   ├── utils/           # Funciones auxiliares y pipelines
│   └── requirements.txt # Dependencias de ML
├── product/             # Producto final
│   ├── backend/         # API para exponer predicciones
│   └── frontendNext/    # Frontend con Next.js + Tailwind
├── data/                # Datos crudos y submissions
├── reportes/            # Reportes en PDF (EDA, resultados)
├── docker-compose.yml   # Orquestación multi-servicio
├── docker-compose.override.yml
└── Makefile             # Comandos de automatización

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

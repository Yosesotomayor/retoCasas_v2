# ML/backend/Dockerfile
FROM python:3.12-slim

# --- Ajustes básicos de Python/Pip ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# --- Dependencias del sistema (para compilar wheels nativos si hace falta) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Instalar dependencias de Python (cache-friendly) ---
# Copiamos SOLO requirements primero para cachear instalaciones
COPY ML/requirements.txt /app/ML/requirements.txt
RUN python -m pip install --upgrade pip \
 && pip install -r /app/ML/requirements.txt

# --- Copiar código del proyecto (solo lo necesario para servir) ---
COPY ML /app/ML

# --- Hacer visible tu módulo 'ensemble' al deserializar el modelo ---
#   IMPORTANTE porque tu modelo pickled intenta: import ensemble
ENV PYTHONPATH=/app:/app/ML:/app/ML/models:/app/ML/models/ensemble_elnet_lgbm

# --- Usuario no-root (opcional pero recomendado) ---
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# --- Puerto de la app ---
EXPOSE 8000

# --- Comando por defecto (Gunicorn en modo producción) ---
#   Si tu app Flask se llama "app" y vive en ML/backend/app.py
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--chdir", "ML/backend", "app:app"]

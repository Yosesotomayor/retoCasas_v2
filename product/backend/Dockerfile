
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1\
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc g++ gfortran \
    cmake \
    git \
    curl \
    libgomp1 \
    libgl1 libglib2.0-0 \
    libpq-dev default-libmysqlclient-dev \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /retoCasas_v2

COPY requirements.txt .

RUN pip install --upgrade pip setuptools wheel \
 && pip install --prefer-binary -r requirements.txt -v

COPY . .

ENV PORT=9000

CMD ["python", "./product/backend/app.py"]

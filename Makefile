# ===== Configuración =====
COMPOSE_FILE := docker-compose.override.yml
SERVICE      := server-backend

# ===== Utilidades =====
.PHONY: help ps prune cfg

help:
	@echo "Targets disponibles:"
	@echo "  up-dev / down-dev / logs-dev / rebuild-dev / restart-dev"
	@echo "  ps / prune / cfg"
	@echo "  shell / pyver / uvicornver / which-py / which-uvicorn"
	@echo "  curl-host / curl-in / healthcheck / ports"

ps:
	docker compose -f $(COMPOSE_FILE) ps

prune:
	docker builder prune -f ; docker system prune -f

cfg:
	docker compose -f $(COMPOSE_FILE) config

# ===== Desarrollo (usa SOLO el override) =====
.PHONY: up-dev down-dev logs-dev rebuild-dev restart-dev shell pyver uvicornver which-py which-uvicorn curl-host curl-in healthcheck ports

up-dev:
	docker compose -f $(COMPOSE_FILE) up -d --build

down-dev:
	docker compose -f $(COMPOSE_FILE) down

logs-dev:
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE)

rebuild-dev:
	docker compose -f $(COMPOSE_FILE) build --no-cache $(SERVICE)
	docker compose -f $(COMPOSE_FILE) up -d $(SERVICE)

restart-dev:
	docker compose -f $(COMPOSE_FILE) restart $(SERVICE)

shell:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) sh -lc "export COLUMNS=$$(tput cols); export LINES=$$(tput lines); exec sh"

pyver:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) python -V || true

uvicornver:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) sh -lc "python -m pip show uvicorn || echo 'uvicorn no instalado'"

which-py:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) which python || true

which-uvicorn:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) which uvicorn || true

curl-host:
	curl -v http://localhost:8000 || true

curl-in:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) sh -lc "python - <<'PY'\nimport urllib.request, sys\ntry:\n    print(urllib.request.urlopen('http://127.0.0.1:8000', timeout=5).read().decode('utf-8'))\nexcept Exception as e:\n    print('ERROR:', e)\n    sys.exit(1)\nPY"

healthcheck:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) sh -lc "python - <<'PY'\nimport socket; s=socket.socket();\ntry:\n    s.bind(('0.0.0.0',8000)); print('PUERTO LIBRE (nada escuchando)');\nexcept OSError as e:\n    print('PUERTO OCUPADO/ESCUCHANDO:', e)\nPY"

ports:
	docker compose -f $(COMPOSE_FILE) port $(SERVICE) 8000 || true
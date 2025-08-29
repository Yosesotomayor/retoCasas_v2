# ===== Configuración =====
COMPOSE_BASE = docker-compose.yml
COMPOSE_DEV = docker-compose.override.yml

# Servicio principal
SERVICE = ml-backend

# ===== Utilidades =====
.PHONY: help ps prune

help:
	@echo "Targets disponibles:"
	@echo "  up-prod / down-prod / logs-prod / rebuild-prod"
	@echo "  up-staging / down-staging / logs-staging / rebuild-staging"
	@echo "  up-dev / down-dev / logs-dev / rebuild-dev"
	@echo "  ps (estado) / prune (limpiar builder/cache)"

ps:
	docker compose ps

prune:
	docker builder prune -f; docker system prune -f

# ===== Producción (Gunicorn, sin volúmenes) =====
.PHONY: up-prod down-prod logs-prod rebuild-prod

up-prod:
	docker compose -f $(COMPOSE_BASE) up -d --build

down-prod:
	docker compose -f $(COMPOSE_BASE) down

logs-prod:
	docker compose -f $(COMPOSE_BASE) logs -f $(SERVICE)

rebuild-prod:
	docker compose -f $(COMPOSE_BASE) build --no-cache
	docker compose -f $(COMPOSE_BASE) up -d


# ===== Desarrollo (Flask debug + override, volúmenes) =====
.PHONY: up-dev down-dev logs-dev rebuild-dev

up-dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) up --build

down-dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) down

logs-dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) logs -f $(SERVICE)

rebuild-dev:
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) build --no-cache
	docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV) up
# ===== Configuración =====
COMPOSE_FILE := docker-compose.override.yml
SERVICE      := server-backend   # cámbialo si tu servicio se llama distinto

# ===== Utilidades =====
.PHONY: help ps prune

help:
	@echo "Targets disponibles:"
	@echo "  up-dev  / down-dev  / logs-dev  / rebuild-dev"
	@echo "  ps (estado) / prune (limpiar builder/cache)"

ps:
	docker compose -f $(COMPOSE_FILE) ps

prune:
	docker builder prune -f ; docker system prune -f

# ===== Desarrollo (usa SOLO el override) =====
.PHONY: up-dev down-dev logs-dev rebuild-dev

up-dev:
	docker compose -f $(COMPOSE_FILE) up -d --build

down-dev:
	docker compose -f $(COMPOSE_FILE) down

logs-dev:
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE)

rebuild-dev:
	docker compose -f $(COMPOSE_FILE) build --no-cache
	docker compose -f $(COMPOSE_FILE) up -d
#!/usr/bin/env bash
# ============================================
# CAISO — Logs do ambiente de produção
# Uso: ./deploy/logs.sh [backend|frontend|all] [--follow]
# Ex.: ./deploy/logs.sh backend --follow
#      ./deploy/logs.sh frontend
# ============================================
set -euo pipefail

cd "$(dirname "$0")/.." # raiz do deploy (public_html)

SERVICE="${1:-all}"
FOLLOW="${2:-}"

case "$SERVICE" in
  backend|back)  COMPOSE_SVC="backend" ;;
  frontend|front) COMPOSE_SVC="frontend" ;;
  all)           COMPOSE_SVC="" ;;
  *) echo "Uso: $0 [backend|frontend|all] [--follow]"; exit 1 ;;
esac

CMD=(docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail 200)
if [ "$FOLLOW" = "--follow" ] || [ "$FOLLOW" = "-f" ]; then
  CMD+=(--follow)
fi
if [ -n "$COMPOSE_SVC" ]; then
  CMD+=("$COMPOSE_SVC")
fi

echo "▶ $ ${CMD[*]}"
"${CMD[@]}"

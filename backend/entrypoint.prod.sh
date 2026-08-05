#!/bin/sh
set -e

echo "================================================"
echo "  SMCORP Backend - Production Startup"
echo "  Banco de dados: EXTERNO"
echo "================================================"
echo ""

# -----------------------------------------------
# 1. Aguardar banco de dados externo ficar pronto
# -----------------------------------------------
echo "[1/4] Verificando conexão com banco de dados externo..."

MAX_RETRIES=${MAX_RETRIES:-30}
RETRY_INTERVAL=${RETRY_INTERVAL:-3}
RETRIES=0

# Extrair esquema, host e porta da DATABASE_URL (mais robusto)
DB_SCHEME=$(echo "$DATABASE_URL" | sed -E 's|^([a-zA-Z0-9+]+)://.*|\1|' || true)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+)(:([0-9]+))?/.*|\1|' || true)
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+)(:([0-9]+))?/.*|\3|' || true)

# Se a porta não estiver presente, usar porto padrão por esquema
if [ -z "$DB_PORT" ]; then
  case "$DB_SCHEME" in
    postgres|postgresql) DB_PORT=5432 ;;
    mysql|mariadb) DB_PORT=3306 ;;
    *) DB_PORT="" ;;
  esac
fi

if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
  echo "[WARN] Não foi possível extrair host/porta da DATABASE_URL."
  echo "[WARN] Pulando verificação de conexão..."
else
  echo "       Host: $DB_HOST | Porta: $DB_PORT"
  
  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
      echo "[ERRO] Banco de dados não respondeu após $MAX_RETRIES tentativas."
      echo "[ERRO] Verifique a DATABASE_URL e a conectividade de rede."
      exit 1
    fi
    echo "       Tentativa $RETRIES/$MAX_RETRIES - Aguardando banco... (${RETRY_INTERVAL}s)"
    sleep "$RETRY_INTERVAL"
  done
  echo "[OK]   Banco de dados acessível!"
fi
echo ""

# -----------------------------------------------
# 2. Executar migrations (se habilitado)
# -----------------------------------------------
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[2/4] Executando Prisma migrations..."
  npx prisma migrate deploy
  echo "[OK]   Migrations aplicadas com sucesso!"
else
  echo "[2/4] Migrations desabilitadas (RUN_MIGRATIONS=false)"
fi
echo ""

# -----------------------------------------------
# 3. Executar seed (se habilitado)
# -----------------------------------------------
if [ "${SEED_ON_STARTUP}" = "true" ]; then
  echo "[3/4] Executando seed do banco..."
  if [ -f "prisma/seed.js" ]; then
    node prisma/seed.js || echo "[WARN] Seed falhou (pode já ter sido aplicado)"
  else
    echo "[WARN] Arquivo prisma/seed.js não encontrado. Tentando fallback via Prisma..."
    npx prisma db seed || echo "[WARN] Seed falhou (pode já ter sido aplicado)"
  fi
  echo "[OK]   Seed concluído!"
else
  echo "[3/4] Seed desabilitado (SEED_ON_STARTUP != true)"
fi
echo ""

# -----------------------------------------------
# 4. Iniciar aplicação
# -----------------------------------------------
echo "[4/4] Iniciando NestJS em modo produção..."
echo "       PORT: ${PORT:-3001}"
echo "       NODE_ENV: ${NODE_ENV:-production}"
echo "================================================"
echo ""

# exec substitui o shell pelo processo node (PID 1 correto para sinais)
ENTRY_FILE="dist/main.js"
if [ -f "dist/src/main.js" ]; then
  ENTRY_FILE="dist/src/main.js"
fi

if [ ! -f "$ENTRY_FILE" ]; then
  echo "[ERRO] Arquivo de entrada não encontrado: $ENTRY_FILE"
  echo "[ERRO] Conteúdo de ./dist:"
  ls -la ./dist || true
  echo "[ERRO] Conteúdo de ./dist/src:"
  ls -la ./dist/src || true
  exit 1
fi

exec node "$ENTRY_FILE"

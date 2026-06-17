#!/usr/bin/env bash
#
# Deploy do Quizz reutilizando um container PostgreSQL já existente no servidor
# (ex.: o do projeto Custo da Soja). Rode direto no servidor (Ubuntu + Docker).
#
# Uso:
#   chmod +x deploy.sh
#   QUIZZ_PASSWORD='uma-senha-forte' ./deploy.sh
#
# Variáveis (todas opcionais, com defaults sensatos):
#   PG_CONTAINER    nome do container Postgres existente   (default: autodetecta)
#   PG_SUPERUSER    superusuário do Postgres               (default: postgres)
#   QUIZZ_DB        banco dedicado ao Quizz                (default: quizz)
#   QUIZZ_USER      role da aplicação                      (default: quizz)
#   QUIZZ_PASSWORD  senha da role da aplicação             (default: quizz  << TROQUE)
#   APP_PORT        porta pública da aplicação             (default: 10000)
#   IMAGE           imagem Docker                          (default: ozkr/quizz:latest)
#
set -euo pipefail

IMAGE="${IMAGE:-ozkr/quizz:latest}"
APP_NAME="${APP_NAME:-quizz}"
APP_PORT="${APP_PORT:-10000}"

PG_CONTAINER="${PG_CONTAINER:-}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"

QUIZZ_DB="${QUIZZ_DB:-quizz}"
QUIZZ_USER="${QUIZZ_USER:-quizz}"
QUIZZ_PASSWORD="${QUIZZ_PASSWORD:-quizz}"

QUIZZ_NETWORK="${QUIZZ_NETWORK:-quizz-net}"
RAW="${RAW:-https://raw.githubusercontent.com/ozkrbr/quizz/main}"

log()  { printf '\033[1;35m[quizz]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[quizz] ERRO:\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "Docker não encontrado no PATH."
command -v curl   >/dev/null || die "curl não encontrado (sudo apt-get install -y curl)."

# ----------------------------------------------------------------------------
# 1) Localizar o container Postgres
# ----------------------------------------------------------------------------
if [ -z "$PG_CONTAINER" ]; then
  PG_CONTAINER="$(docker ps --format '{{.Names}} {{.Image}}' | awk '/postgres/{print $1; exit}')"
  [ -n "$PG_CONTAINER" ] || die "Nenhum container Postgres em execução. Informe PG_CONTAINER=<nome>."
fi
docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER" \
  || die "Container '$PG_CONTAINER' não está em execução."
log "Postgres: container '$PG_CONTAINER'"

# psql como superusuário via socket local (trust — não pede senha)
psql_su() { docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_SUPERUSER" "$@"; }
psql_su -d postgres -tAc 'SELECT 1' >/dev/null 2>&1 \
  || die "Não consegui conectar como '$PG_SUPERUSER'. Ajuste PG_SUPERUSER=<usuario>."

# ----------------------------------------------------------------------------
# 2) Role + banco dedicados (idempotente, sem afetar os dados existentes)
# ----------------------------------------------------------------------------
log "Garantindo role '$QUIZZ_USER' e banco '$QUIZZ_DB'..."
psql_su -d postgres -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${QUIZZ_USER}') THEN
    CREATE ROLE ${QUIZZ_USER} LOGIN PASSWORD '${QUIZZ_PASSWORD}';
  END IF;
END \$\$;"
psql_su -d postgres -c "ALTER ROLE ${QUIZZ_USER} WITH LOGIN PASSWORD '${QUIZZ_PASSWORD}';"
if ! psql_su -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${QUIZZ_DB}'" | grep -q 1; then
  psql_su -d postgres -c "CREATE DATABASE ${QUIZZ_DB} OWNER ${QUIZZ_USER};"
fi

# ----------------------------------------------------------------------------
# 3) Schema + seed (apenas se ainda não houver as tabelas)
# ----------------------------------------------------------------------------
HAS_TABLES="$(psql_su -d "$QUIZZ_DB" -tAc "SELECT to_regclass('public.quiz_sets')" || true)"
if [ -z "$HAS_TABLES" ]; then
  log "Aplicando schema e seed (primeira execução)..."
  curl -fsSL "$RAW/db/schema.sql" | docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_SUPERUSER" -d "$QUIZZ_DB"
  curl -fsSL "$RAW/db/seed.sql"   | docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_SUPERUSER" -d "$QUIZZ_DB"
  # As tabelas foram criadas pelo superusuário; concede acesso à role do app.
  psql_su -d "$QUIZZ_DB" -c "
    GRANT USAGE ON SCHEMA public TO ${QUIZZ_USER};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${QUIZZ_USER};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${QUIZZ_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${QUIZZ_USER};"
else
  log "Schema já existe — mantendo dados atuais."
fi

# Migrações idempotentes — rodam SEMPRE, sem afetar dados existentes.
# Embutidas aqui (não dependem de baixar outro arquivo) para o script ser
# autossuficiente. Adicione novas colunas/ajustes abaixo conforme necessário.
log "Aplicando migrações..."
docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_SUPERUSER" -d "$QUIZZ_DB" <<SQL
alter table public.quiz_sets add column if not exists answer_time smallint not null default 30;
alter table public.quiz_sets add column if not exists auto_advance boolean not null default false;
-- Garante que a role do app possa ler/gravar (cobre colunas recém-adicionadas).
grant select, insert, update, delete on all tables in schema public to ${QUIZZ_USER};
grant usage, select on all sequences in schema public to ${QUIZZ_USER};
SQL

# ----------------------------------------------------------------------------
# 4) Rede compartilhada entre app e Postgres
#    (conecta o Postgres a uma rede dedicada sem mexer nos vínculos atuais)
# ----------------------------------------------------------------------------
docker network inspect "$QUIZZ_NETWORK" >/dev/null 2>&1 || docker network create "$QUIZZ_NETWORK" >/dev/null
docker network connect "$QUIZZ_NETWORK" "$PG_CONTAINER" >/dev/null 2>&1 || true
log "Rede: $QUIZZ_NETWORK (app <-> $PG_CONTAINER)"

# ----------------------------------------------------------------------------
# 5) (Re)subir o container da aplicação na porta desejada
# ----------------------------------------------------------------------------
DATABASE_URL="postgres://${QUIZZ_USER}:${QUIZZ_PASSWORD}@${PG_CONTAINER}:5432/${QUIZZ_DB}"
log "Baixando imagem ${IMAGE}..."
docker pull "$IMAGE" >/dev/null
docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
log "Subindo a aplicação na porta ${APP_PORT}..."
docker run -d --name "$APP_NAME" \
  --restart unless-stopped \
  --network "$QUIZZ_NETWORK" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV=production \
  -p "${APP_PORT}:3000" \
  "$IMAGE" >/dev/null

# ----------------------------------------------------------------------------
# 6) Healthcheck
# ----------------------------------------------------------------------------
log "Aguardando a aplicação responder..."
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${APP_PORT}/api/quiz-sets" >/dev/null 2>&1; then
    IP="$(curl -fsS --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<IP-do-servidor>')"
    log "Quizz no ar! Acesse: http://${IP}:${APP_PORT}/host"
    exit 0
  fi
  sleep 2
done
die "A aplicação subiu mas não respondeu a tempo. Verifique: docker logs ${APP_NAME}"

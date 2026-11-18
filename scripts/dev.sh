#!/usr/bin/env bash
# ============================================================
# BookHealth 本地开发一键启动
#
#   ./scripts/dev.sh              # 用本机 PostgreSQL (127.0.0.1:5432)
#   DB_PORT=5434 ./scripts/dev.sh # 用 docker 起的库
#
# 会做三件事：
#   1. 缺依赖就装
#   2. 库/表不存在就建库 + 导入 schema.sql + seed.sql
#   3. 后端 tsx watch (3002) + 前端 vite (5173) 一起起，Ctrl+C 一起停
#
# 账号密码统一来自项目根目录 bookhealth-api.env
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log()  { printf '\033[36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v node >/dev/null || die "未安装 Node.js"

# ---------- 读取配置 ----------
set -a
# shellcheck disable=SC1091
. "$ROOT/bookhealth-api.env"
set +a

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-bookhealth}"
BACKEND_PORT="${BACKEND_PORT:-3002}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# ---------- 依赖 ----------
if [ ! -d backend/node_modules ]; then
  log "安装后端依赖"
  ( cd backend && npm install )
fi
if [ ! -d frontend/node_modules ]; then
  log "安装前端依赖"
  ( cd frontend && npm install )
fi

# ---------- 数据库 ----------
PSQL_BIN="$(command -v psql || true)"
if [ -z "$PSQL_BIN" ] && [ -x /opt/homebrew/opt/postgresql@16/bin/psql ]; then
  PSQL_BIN=/opt/homebrew/opt/postgresql@16/bin/psql
fi

if [ -n "$PSQL_BIN" ] && PGPASSWORD="${DB_PASSWORD:-}" "$PSQL_BIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c 'select 1' >/dev/null 2>&1; then
  exists=$(PGPASSWORD="${DB_PASSWORD:-}" "$PSQL_BIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc \
    "select 1 from pg_database where datname='$DB_NAME'" || true)
  if [ "$exists" != "1" ]; then
    log "创建数据库 $DB_NAME 并导入 schema + seed"
    PGPASSWORD="${DB_PASSWORD:-}" "$PSQL_BIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" >/dev/null
    PGPASSWORD="${DB_PASSWORD:-}" "$PSQL_BIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q -f database/schema.sql
    [ -f database/seed.sql ] && PGPASSWORD="${DB_PASSWORD:-}" "$PSQL_BIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q -f database/seed.sql
    ok "数据库就绪"
  else
    ok "数据库 $DB_NAME 已存在（要重置就 DROP 后重跑本脚本）"
  fi
else
  warn "连不上 PostgreSQL $DB_HOST:$DB_PORT"
  warn "可以先用 docker 起一个：docker compose -f docker-compose.dev.yml up -d"
  warn "然后：DB_PORT=5434 ./scripts/dev.sh"
fi

# ---------- 启动 ----------
run_backend() {
  cd "$ROOT/backend"
  export PORT="$BACKEND_PORT" NODE_ENV=development
  if [ -x node_modules/.bin/tsx ]; then
    exec node_modules/.bin/tsx watch src/index.ts
  elif [ -f node_modules/tsx/dist/cli.mjs ]; then
    exec node node_modules/tsx/dist/cli.mjs watch src/index.ts
  else
    exec npx tsx watch src/index.ts
  fi
}

log "后端 http://localhost:$BACKEND_PORT （tsx watch）"
run_backend &
BE_PID=$!

log "前端 http://localhost:$FRONTEND_PORT （vite）"
( cd "$ROOT/frontend" && npm run dev -- --port "$FRONTEND_PORT" ) &
FE_PID=$!

cleanup() {
  echo
  log "停止服务"
  kill "$BE_PID" "$FE_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

sleep 2
ok "后台地址 http://localhost:$FRONTEND_PORT/admin   前台 http://localhost:$FRONTEND_PORT"
ok "账号密码见 bookhealth-api.env（ADMIN_USER/ADMIN_PASS、APP_USER/APP_PASS）"

wait

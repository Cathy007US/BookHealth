#!/usr/bin/env bash
# ============================================================
# BookHealth 一键发布脚本
#
# 用法：
#   ./scripts/deploy.sh frontend        # 只发布前端（改页面/样式/图片）
#   ./scripts/deploy.sh backend         # 只发布后端（改接口/逻辑）
#   ./scripts/deploy.sh all             # 前后端都发（默认）
#   ./scripts/deploy.sh init            # 首次部署：上传配置 + 构建基础镜像 + 启动
#   ./scripts/deploy.sh config          # 同步 bookhealth-api.env（账号/密码/JWT/库名/库密码）并重载
#   ./scripts/deploy.sh sql <file.sql>  # 执行一个 SQL 迁移（库名/用户取自 env 文件）
#   ./scripts/deploy.sh status          # 查看容器状态与健康检查
#   ./scripts/deploy.sh logs [服务名]    # 跟踪日志，默认 backend
#   ./scripts/deploy.sh ssh             # 进入服务器项目目录
#
# 参数：
#   --no-build   跳过本地构建，直接上传已有 dist（少用）
#
# 首次使用：复制 .deploy.env.example 为 .deploy.env，填服务器地址
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---------------- 配置 ----------------
if [ -f "$ROOT/.deploy.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.deploy.env"
  set +a
fi
SERVER="${SERVER:-}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/BookHealth}"
SSH_KEY="${SSH_KEY:-}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
[ -n "$SSH_KEY" ] && SSH_OPTS+=(-i "$SSH_KEY")

CMD="${1:-all}"
shift || true
NO_BUILD=0
SKIP_CHECK=0
ARG=""
for a in "$@"; do
  case "$a" in
    --no-build) NO_BUILD=1 ;;
    *) ARG="$a" ;;
  esac
done

# ---------------- 输出 ----------------
log()  { printf '\033[36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

need_server() {
  [ -n "$SERVER" ] || die "未配置服务器。请复制 .deploy.env.example 为 .deploy.env，填入 SERVER=ubuntu@82.157.190.184"
}

remote()   { ssh "${SSH_OPTS[@]}" "$SERVER" "set -e; cd '$REMOTE_DIR'; $*"; }
put()      { scp "${SSH_OPTS[@]}" -q "$1" "$SERVER:$REMOTE_DIR/$2"; }

# 读取本地 bookhealth-api.env 的值（不 source，避免密码里的特殊字符被 shell 解释）
env_get() { awk -F= -v k="$1" '$1==k{sub(/^[^=]*=/,""); print; exit}' bookhealth-api.env 2>/dev/null | tr -d '\r'; }
# SQL 字符串字面量：把单引号翻倍
sql_lit() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/''/g")"; }

# 服务器上 bookhealth-api.env 的某个值（文件不存在时返回空）
remote_env_get() {
  remote "sed -n 's/^$1=//p' bookhealth-api.env 2>/dev/null | tail -1 | tr -d '\r'" 2>/dev/null || true
}

# ---------------- 本地构建 ----------------
build_frontend() {
  [ "$NO_BUILD" = "1" ] && { warn "跳过前端构建"; return; }
  log "构建前端（vite build）"
  ( cd frontend && npm run build ) || die "前端构建失败，先修好再发"
  [ -f frontend/dist/index.html ] || die "frontend/dist/index.html 不存在"
  # 版本戳：把构建时间写进 index.html，线上 curl 一下就能核对是不是最新版
  local stamp; stamp="$(date +%Y%m%d-%H%M%S)"
  sed -i '' "s#<head>#<head><meta name=\"build-version\" content=\"$stamp\">#" frontend/dist/index.html
  ok "构建版本戳: $stamp"
  ok "前端产物 $(du -sh frontend/dist | cut -f1)"
}

build_backend() {
  [ "$NO_BUILD" = "1" ] && { warn "跳过后端构建"; return; }
  log "构建后端（tsc）"
  local tsc_bin="backend/node_modules/.bin/tsc"
  if [ ! -x "$tsc_bin" ]; then
    if [ -x "frontend/node_modules/.bin/tsc" ]; then
      tsc_bin="frontend/node_modules/.bin/tsc"
      warn "后端没装本地 tsc，改用前端的 TypeScript 编译"
    else
      warn "后端依赖不完整，先安装（npm install）"
      ( cd backend && npm install )
      tsc_bin="backend/node_modules/.bin/tsc"
    fi
  fi
  ( cd backend && "$ROOT/$tsc_bin" -p tsconfig.json ) || die "后端构建失败"
  [ -f backend/dist/index.js ] || die "backend/dist/index.js 不存在"
  ok "后端产物 $(du -sh backend/dist | cut -f1)"
}

# ---------------- 打包 ----------------
pack_frontend() {
  TMP_FE="$(mktemp -t bookhealth-fe).tar.gz"
  # COPYFILE_DISABLE 防止 macOS 把 ._ 资源文件打进 tar
  # --format=ustar 避免 macOS pax 格式的扩展属性导致 Linux 解包时刷警告
  COPYFILE_DISABLE=1 tar czf "$TMP_FE" --format=ustar -C frontend/dist .
  ok "前端压缩包 $(du -h "$TMP_FE" | cut -f1)"
}

pack_backend() {
  TMP_BE="$(mktemp -t bookhealth-be).tar.gz"
  COPYFILE_DISABLE=1 tar czf "$TMP_BE" --format=ustar -C backend dist
  ok "后端压缩包 $(du -h "$TMP_BE" | cut -f1)"
}

# ---------------- 发布动作 ----------------
deploy_frontend() {
  need_server
  build_frontend
  pack_frontend
  log "上传前端到 $SERVER:$REMOTE_DIR"
  put "$TMP_FE" .upload-frontend.tar.gz
  remote "mkdir -p runtime/frontend && cd runtime/frontend \
    && rm -rf assets.old \
    && if [ -d assets ]; then mv assets assets.old; fi \
    && tar xzf '../../.upload-frontend.tar.gz' \
    && rm -rf assets.old '../../.upload-frontend.tar.gz'"
  rm -f "$TMP_FE"
  if [ "$SKIP_CHECK" = "1" ]; then return 0; fi
  # 静态文件直接由挂载目录提供，不需要重启容器
  remote "curl -fsS -o /dev/null http://127.0.0.1:8090/ && echo __OK__" | grep -q __OK__ \
    && ok "前端已生效（浏览器强刷 Cmd+Shift+R 查看）" \
    || warn "前端文件已上传，但本机 curl 检查未通过，执行 ./scripts/deploy.sh status 看看"
}

deploy_backend() {
  need_server
  build_backend
  pack_backend
  log "上传后端到 $SERVER:$REMOTE_DIR"
  put "$TMP_BE" .upload-backend.tar.gz
  remote "mkdir -p runtime/backend \
    && tar xzf .upload-backend.tar.gz -C runtime/backend \
    && rm -f .upload-backend.tar.gz"
  rm -f "$TMP_BE"
  if [ "$SKIP_CHECK" = "1" ]; then return 0; fi
  log "重建后端容器"
  remote "docker compose up -d --force-recreate backend >/dev/null"
  sleep 3
  remote "curl -fsS http://127.0.0.1:3002/health && echo __OK__" | grep -q __OK__ \
    && ok "后端已生效" \
    || die "后端启动异常，执行 ./scripts/deploy.sh logs backend 查看"
}

# 等 db 容器可连接（pg_isready）
wait_db() {
  local u="${1:-postgres}" i
  for i in $(seq 1 30); do
    if remote "docker compose exec -T db pg_isready -U '$u' -q" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  warn "数据库探测 30 次仍未就绪，继续尝试执行语句"
  return 0
}

deploy_config() {
  need_server

  # ---------- 1. 读取本地 env 并校验一致性 ----------
  DB_NAME_V="$(env_get DB_NAME)";  DB_NAME_V="${DB_NAME_V:-bookhealth}"
  DB_USER_V="$(env_get DB_USER)";  DB_USER_V="${DB_USER_V:-postgres}"
  DB_PASS_V="$(env_get DB_PASSWORD)"
  PG_NAME_V="$(env_get POSTGRES_DB)"
  PG_USER_V="$(env_get POSTGRES_USER)"
  PG_PASS_V="$(env_get POSTGRES_PASSWORD)"

  [ -n "$DB_PASS_V" ] || die "bookhealth-api.env 里 DB_PASSWORD 为空"
  if [ -n "$PG_NAME_V" ] && [ "$PG_NAME_V" != "$DB_NAME_V" ]; then
    die "DB_NAME=$DB_NAME_V 与 POSTGRES_DB=$PG_NAME_V 不一致，两组必须相同（否则接口 502）"
  fi
  if [ -n "$PG_USER_V" ] && [ "$PG_USER_V" != "$DB_USER_V" ]; then
    die "DB_USER=$DB_USER_V 与 POSTGRES_USER=$PG_USER_V 不一致，两组必须相同"
  fi
  if [ -n "$PG_PASS_V" ] && [ "$PG_PASS_V" != "$DB_PASS_V" ]; then
    die "DB_PASSWORD 与 POSTGRES_PASSWORD 不一致，两组必须相同（这是 502 最常见的原因）"
  fi
  PG_NAME_V="${PG_NAME_V:-$DB_NAME_V}"
  PG_USER_V="${PG_USER_V:-$DB_USER_V}"
  PG_PASS_V="${PG_PASS_V:-$DB_PASS_V}"

  # ---------- 2. 读服务器上的旧值，判断改了什么 ----------
  OLD_NAME="$(remote_env_get DB_NAME)";    OLD_NAME="${OLD_NAME:-$DB_NAME_V}"
  OLD_USER="$(remote_env_get DB_USER)";    OLD_USER="${OLD_USER:-$DB_USER_V}"
  OLD_PASS="$(remote_env_get DB_PASSWORD)"
  OLD_PG_NAME="$(remote_env_get POSTGRES_DB)"
  OLD_PG_USER="$(remote_env_get POSTGRES_USER)"
  OLD_PG_PASS="$(remote_env_get POSTGRES_PASSWORD)"

  log "备份服务器原配置 → bookhealth-api.env.bak"
  remote "cp -f bookhealth-api.env bookhealth-api.env.bak 2>/dev/null || true"
  put bookhealth-api.env bookhealth-api.env
  ok "已上传 bookhealth-api.env"
  # 编排文件也一起同步：旧版 compose 里写死了 DB_NAME/DB_USER，会盖掉 env_file
  put docker-compose.yml docker-compose.yml

  NEED_ALTER=0        # 需要改库内密码 / 改库名
  NEED_DB_RECREATE=0  # 需要重建 db 容器
  CHANGES=""

  if [ -n "$OLD_PASS" ] && [ "$DB_PASS_V" != "$OLD_PASS" ]; then
    NEED_ALTER=1; NEED_DB_RECREATE=1; CHANGES="$CHANGES 数据库密码\n"
  fi
  if [ "$DB_NAME_V" != "$OLD_NAME" ]; then
    NEED_ALTER=1; NEED_DB_RECREATE=1; CHANGES="$CHANGES 库名 $OLD_NAME → $DB_NAME_V\n"
  fi
  if [ "$DB_USER_V" != "$OLD_USER" ]; then
    NEED_DB_RECREATE=1; CHANGES="$CHANGES 库用户 $OLD_USER → $DB_USER_V\n"
    warn "库用户变更需要重建数据卷才彻底生效（POSTGRES_USER 只在初始化时创建角色）"
  fi
  if [ -n "$OLD_PG_PASS" ] && [ "$PG_PASS_V" != "$OLD_PG_PASS" ]; then NEED_DB_RECREATE=1; fi
  if [ -n "$OLD_PG_NAME" ] && [ "$PG_NAME_V" != "$OLD_PG_NAME" ]; then NEED_DB_RECREATE=1; fi
  if [ -n "$OLD_PG_USER" ] && [ "$PG_USER_V" != "$OLD_PG_USER" ]; then NEED_DB_RECREATE=1; fi

  # ---------- 3. 改库：密码用 ALTER USER，库名用 ALTER DATABASE RENAME ----------
  if [ -z "$OLD_PASS" ]; then
    warn "服务器旧配置里没有 DB_PASSWORD（或文件不存在），跳过改库内密码"
  fi
  if [ "$NEED_ALTER" = "1" ]; then
    log "先停后端（改库名/密码需要断开所有连接）"
    remote "docker compose stop backend >/dev/null 2>&1 || true"
  fi
  if [ "$NEED_DB_RECREATE" = "1" ]; then
    log "重建 db 容器（让新的 POSTGRES_* 生效，数据卷不动）"
    remote "docker compose up -d --force-recreate db >/dev/null"
  fi
  if [ "$NEED_ALTER" = "1" ]; then
    wait_db "$OLD_USER"
    SQL_TMP="$(mktemp -t bh-db).sql"
    {
      echo '\set ON_ERROR_STOP on'
      if [ -n "$OLD_PASS" ] && [ "$DB_PASS_V" != "$OLD_PASS" ]; then
        printf 'ALTER USER "%s" WITH PASSWORD %s;\n' "$OLD_USER" "$(sql_lit "$DB_PASS_V")"
      fi
      if [ "$DB_NAME_V" != "$OLD_NAME" ]; then
        printf 'ALTER DATABASE "%s" RENAME TO "%s";\n' "$OLD_NAME" "$DB_NAME_V"
      fi
      printf "SELECT current_user AS db_user, datname FROM pg_database WHERE datname NOT IN ('template0','template1');\n"
    } > "$SQL_TMP"
    log "改库（$(grep -c ';' "$SQL_TMP" || true) 条语句）"
    put "$SQL_TMP" .upload-db.sql
    rm -f "$SQL_TMP"
    remote "docker compose exec -T db psql -U '$OLD_USER' -d postgres -v ON_ERROR_STOP=1 < .upload-db.sql && rm -f .upload-db.sql"
    ok "库内密码/库名已更新"
  fi

  # ---------- 4. 重启后端并验证 ----------
  log "重建后端容器（加载新配置）"
  remote "docker compose up -d --force-recreate backend >/dev/null"
  sleep 3
  remote "curl -fsS http://127.0.0.1:3002/health >/dev/null" \
    || die "后端没起来，执行 ./scripts/deploy.sh logs backend 看日志"
  # /health 不查库，这里走一个真读库的接口，才能确认库名/密码都对
  CODE="$(remote "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/api/packages" || true)"
  if [ "$CODE" = "200" ]; then
    ok "配置已生效（库 ${DB_NAME_V} / 用户 ${DB_USER_V}，接口读库正常）"
  else
    die "后端已启动但读库失败（HTTP ${CODE}），多半是库名/密码不一致：./scripts/deploy.sh logs backend"
  fi
  if [ -n "$CHANGES" ]; then
    printf '\033[33m  本次变更：%b\033[0m\n' "$CHANGES"
  fi
  return 0
}

deploy_sql() {
  need_server
  local file="${ARG:-}"
  [ -n "$file" ] || die "用法：./scripts/deploy.sh sql database/xxx.sql"
  [ -f "$file" ] || die "文件不存在：$file"
  local user name
  user="$(env_get DB_USER)"; user="${user:-postgres}"
  name="$(env_get DB_NAME)"; name="${name:-bookhealth}"
  log "执行 SQL：${file}（库 ${name} / 用户 ${user}）"
  put "$file" .upload.sql
  remote "docker compose exec -T db psql -U '$user' -d '$name' -v ON_ERROR_STOP=1 < .upload.sql && rm -f .upload.sql"
  ok "SQL 执行完成"
}

deploy_init() {
  need_server
  log "首次部署 / 重建：准备目录与配置"
  remote "mkdir -p database deploy runtime/frontend runtime/backend/dist frontend"
  # Docker 对不存在的挂载路径会自动建空目录，会挡住后面的文件上传，先清掉
  remote "rm -rf frontend/nginx.conf"
  put docker-compose.yml docker-compose.yml
  put frontend/nginx.conf frontend/nginx.conf
  # 数据库脚本（schema / seed / 迁移）
  for f in database/*.sql; do
    [ -e "$f" ] && put "$f" "$f"
  done
  # 服务器上已有 env 就不覆盖，避免把线上密码冲掉
  if remote "[ -f bookhealth-api.env ] && echo __EXISTS__" | grep -q __EXISTS__; then
    warn "服务器已有 bookhealth-api.env，保持原样（要改密码用 ./scripts/deploy.sh config）"
  else
    put bookhealth-api.env bookhealth-api.env
    ok "已上传 bookhealth-api.env"
  fi

  SKIP_CHECK=1
  deploy_frontend
  deploy_backend
  SKIP_CHECK=0

  log "启动全部服务（首次会构建后端基础镜像，几分钟）"
  remote "docker compose up -d --build"
  sleep 5
  deploy_status
}

deploy_status() {
  need_server
  local user name
  user="$(env_get DB_USER)"; user="${user:-postgres}"
  name="$(env_get DB_NAME)"; name="${name:-bookhealth}"
  log "容器状态"
  remote "docker compose ps"
  echo
  log "健康检查（库：${name} / 用户：${user}，均为本地 env 文件里的值）"
  remote "printf 'frontend : '; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/
printf 'backend  : '; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3002/health
printf 'api(read): '; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3002/api/packages
printf 'db       : '; docker compose exec -T db pg_isready -U '$user' >/dev/null 2>&1 && echo ok || echo fail"
}

deploy_logs() {
  need_server
  local svc="${ARG:-backend}"
  remote "docker compose logs -f --tail=100 $svc"
}

deploy_ssh() {
  need_server
  ssh "${SSH_OPTS[@]}" "$SERVER" -t "cd '$REMOTE_DIR' && exec \$SHELL -l"
}

# ---------------- 入口 ----------------
case "$CMD" in
  frontend|fe)  deploy_frontend ;;
  backend|be)   deploy_backend ;;
  all|both)     deploy_frontend; deploy_backend; deploy_status ;;
  init)         deploy_init ;;
  config|env)   deploy_config ;;
  sql|migrate)  deploy_sql ;;
  status|ps)    deploy_status ;;
  logs)         deploy_logs ;;
  ssh)          deploy_ssh ;;
  -h|--help|help)
    sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *)
    die "未知命令：${CMD}（可用：frontend / backend / all / init / config / sql / status / logs / ssh）"
    ;;
esac

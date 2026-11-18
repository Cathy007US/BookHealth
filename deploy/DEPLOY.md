# BookHealth 体检预约系统 — 部署手册

> 本文档对应 `scripts/deploy.sh` 的新流程：**服务器不再构建前端镜像，代码通过挂载目录生效**。
> 日常发布只需要在本地跑一条命令，上传 300 KB 级别的小包。

## 项目信息

- 技术栈：Vite + React + TS / Express + TS / PostgreSQL 16 / Docker Compose
- 部署方式：二级域名，与服务器已有网站共存
- 配置文件：根目录 `bookhealth-api.env`（唯一），发布参数：`.deploy.env`（本地私有）

---

## 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 服务器系统 Nginx | 80 / 443 | 已有网站 + BookHealth 二级域名 |
| BookHealth 前端（容器） | 8090 → 80 | `nginx:alpine`，挂载 `runtime/frontend` |
| BookHealth 后端（容器） | 3002 → 3000 | Express API |
| PostgreSQL（容器） | 5434 → 5432 | 数据库，不对外暴露 |

---

## 架构（为什么发布变简单了）

```
BookHealth/
├── runtime/frontend/        ← 前端静态文件，nginx 容器直接挂载（换文件即生效）
├── runtime/backend/dist/    ← 后端编译产物，backend 容器挂载（重启进程即生效）
├── docker-compose.yml       ← 固定不变的编排
└── bookhealth-api.env       ← 账号密码 / JWT / 数据库名 / 数据库用户 / 数据库密码
```

| 改动类型 | 发布动作 | 上传体积 | 生效方式 |
|----------|----------|----------|----------|
| 只改前端 | `./scripts/deploy.sh frontend` | ~300 KB | 立即（无需重启） |
| 只改后端 | `./scripts/deploy.sh backend` | ~30 KB | 重启 backend，约 10 秒 |
| 前后端都改 | `./scripts/deploy.sh all` | ~330 KB | 同上 |
| 改登录密码/密钥 | `./scripts/deploy.sh config` | 1 KB | 重建 backend 容器 |
| 改数据库名/密码 | `./scripts/deploy.sh config` | 1 KB | 重建 db + backend，并自动 `ALTER USER` / `ALTER DATABASE RENAME` |
| 只有 SQL | `./scripts/deploy.sh sql database/xxx.sql` | 几 KB | 立即 |

> **唯一配置源**：`bookhealth-api.env` 同时喂给 `db`（`POSTGRES_*`）和 `backend`（`DB_*` + JWT + 登录账号）。
> `docker-compose.yml` 里**故意不写** `DB_NAME / DB_USER / DB_PASSWORD` 的硬编码值 —— 一旦写了，`environment` 会覆盖 `env_file`，改 env 文件就不生效（之前的 502 就是这个原因）。

对比旧流程：每次 `docker save` 导出约 97 MB、`scp` 上传、`docker load` 再重启，且前端每次都要跨平台构建镜像。现在这些都不需要了。

---

## 第一步：本地准备（只做一次）

```bash
cd /Users/User/Desktop/2026items/BookHealth

# 1. 配置服务器地址
cp .deploy.env.example .deploy.env
vi .deploy.env
#   SERVER=ubuntu@你的服务器IP
#   REMOTE_DIR=/home/ubuntu/BookHealth

# 2. 确认密码配置
vi bookhealth-api.env
#   ADMIN_USER / ADMIN_PASS     后台登录
#   APP_USER   / APP_PASS       前台登录
#   DB_NAME / DB_USER / DB_PASSWORD            后端连库
#   POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD   建库用
#   → 两组必须写成同一套值，deploy.sh config 会先校验，不一致直接报错
```

---

## 第二步：首次部署（只做一次）

```bash
./scripts/deploy.sh init
```

它会在服务器上依次完成：

1. 创建 `database/ runtime/frontend runtime/backend/dist` 目录
2. 上传 `docker-compose.yml`、`frontend/nginx.conf`、`database/*.sql`
3. 服务器上已有 `bookhealth-api.env` 时**不覆盖**（避免冲掉线上密码），没有才上传
4. 本地构建 → 上传前端静态文件与后端 `dist`
5. `docker compose up -d --build`：构建后端基础镜像（含 node_modules）、启动 db/backend/frontend
6. 打印容器状态与三个健康检查结果

首次构建后端镜像需要几分钟，之后不再重复构建。

---

## 第三步：日常发布

```bash
# 只改了页面 / 样式 / 图片
./scripts/deploy.sh frontend

# 只改了接口逻辑
./scripts/deploy.sh backend

# 都改了
./scripts/deploy.sh all

# 看状态 / 看日志
./scripts/deploy.sh status
./scripts/deploy.sh logs backend
```

脚本做的事：本地构建 → 打成小 tar 包 → `scp` 上传 → 远端解压到 `runtime/` → 必要时重启对应容器 → 健康检查。
任何一步失败都会立即停止并打印原因，不会留下半成品。

### 改登录密码

```bash
vi bookhealth-api.env        # 改 ADMIN_PASS / APP_PASS
./scripts/deploy.sh config   # 同步文件 + 重建 backend
```

env 里的账号优先于数据库账号：改文件即改密码，不需要动 `users` / `admins` 表。
注册产生的普通用户仍用各自密码登录，不受影响。

### 改数据库名 / 数据库密码

同样只改 `bookhealth-api.env`，然后跑一条命令。`deploy.sh config` 会**对比服务器上的旧值**，只有真的改了才动库：

```bash
vi bookhealth-api.env            # 改 DB_PASSWORD 与 POSTGRES_PASSWORD（必须一起改）
./scripts/deploy.sh config
```

脚本内部的顺序是：

1. 校验 `DB_NAME/DB_USER/DB_PASSWORD` 与 `POSTGRES_*` 三组值是否一致，不一致直接退出（防止再次出现 502）
2. 备份服务器原配置 → `bookhealth-api.env.bak`
3. 上传新的 `bookhealth-api.env`
4. 若密码变了：停 backend → `ALTER USER <db_user> WITH PASSWORD '...'`（容器内本地 socket 免密）
5. 若库名变了：`ALTER DATABASE "旧名" RENAME TO "新名"`
6. `docker compose up -d --force-recreate db backend` 重载配置
7. 验证：`/health` 返回 200，并且 `/api/packages` 真的读库返回 200（只看 `/health` 不足以说明库连上了）

**注意三点：**

- `POSTGRES_PASSWORD` 只在数据卷**首次初始化**时生效。之后只改它不会改库内密码 —— 必须走 `deploy.sh config`（它会执行 `ALTER USER`）。手工改也行：
  `docker compose exec -T db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '新密码';"`
- 改 `DB_USER`（比如换成非 postgres 用户）**不能**只改 env：`POSTGRES_USER` 只在初始化时创建角色，真要换用户必须重建数据卷并重新导入数据，不推荐。
- 改库名之前先备份：`docker compose exec -T db pg_dump -U postgres <旧库名> > backup.sql`。

### 数据库迁移

```bash
# 先备份（重要，库名/用户名换成 bookhealth-api.env 里的值）
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d_%H%M).sql

# 执行（本地文件自动上传并在容器内执行，ON_ERROR_STOP 保证出错即停）
./scripts/deploy.sh sql database/migrate_image_columns_to_text.sql
```

> `deploy.sh sql` 的库名和用户从 `bookhealth-api.env` 读取，改库名后不用改脚本。

> SQL 不会自动执行，没有迁移框架。`schema.sql` 只在数据卷首次创建时被 PostgreSQL 自动导入。

---

## 第四步：DNS 解析

在域名服务商添加记录：

```
类型: A    主机记录: health    记录值: 你的服务器IP    TTL: 600
```

验证：

```bash
ping health.你的域名.com     # 应返回服务器 IP
```

---

## 第五步：系统 Nginx 二级域名

```bash
sudo cp /home/ubuntu/BookHealth/deploy/nginx-subdomain.conf /etc/nginx/sites-available/bookhealth.conf
sudo vi /etc/nginx/sites-available/bookhealth.conf   # 替换 health.your-domain.com 为真实域名
sudo ln -sf /etc/nginx/sites-available/bookhealth.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

curl -I http://health.你的域名.com                   # 应返回 200
```

---

## 第六步（可选）：HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d health.你的域名.com
sudo nginx -t && sudo systemctl reload nginx
curl -I https://health.你的域名.com
```

---

## 第七步：最终验证

```bash
./scripts/deploy.sh status
# frontend  : 200
# backend   : 200
# api(read) : 200   ← 真读库的接口，200 才说明库名/密码都对
# db        : ok

# 浏览器
# 前台：https://health.你的域名.com
# 后台：https://health.你的域名.com/admin
# 账号密码见 bookhealth-api.env
```

---

## 常用运维命令

```bash
cd /home/ubuntu/BookHealth

docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# 换过 dist / 改过 env 后必须重建容器
docker compose up -d --force-recreate backend

# 只重启 nginx（一般不需要，静态文件是挂载的）
docker compose restart frontend

# 数据库
docker compose exec db psql -U postgres -d bookhealth
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# 系统 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

回滚：`runtime/` 是普通目录，把上一次的 `dist` 重新上传即可；前端静态文件保留 `assets.old` 的机制之外，建议改动大时先 `cp -r runtime/frontend runtime/frontend.bak`。

---

## 注意事项

1. **`bookhealth-api.env` 是唯一配置来源** — 登录账号、JWT、数据库名/用户/密码都在这里；改完执行 `./scripts/deploy.sh config` 才生效（它会同步文件、按需改库、重建容器）。
2. **`POSTGRES_*` 只在数据卷首次创建时生效** — 之后改密码必须走 `deploy.sh config` 里的 `ALTER USER`，只重启容器没用。**永远不要 `docker compose down -v`**，那会删库。
3. **`runtime/` 存放的是线上运行的代码** — 本地不要手改，统一由 `deploy.sh` 生成。
4. **3002 / 8090 不对外暴露** — 系统 Nginx 在 127.0.0.1 代理，安全组无需开放。
5. **已有网站不受影响** — Nginx 通过 `server_name` 区分域名。
6. **后端依赖变化（package.json）** — 这种改动需要在服务器重建镜像：`cd /home/ubuntu/BookHealth && docker compose up -d --build backend`；纯代码改动不需要。
7. **首次部署数据库** — `schema.sql` 由数据卷初始化自动导入，`seed.sql` 需要手动执行一次：
   ```bash
   docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
   ```

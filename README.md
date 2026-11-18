# BookHealth - Health Examination Booking System

**English** | [简体中文](#bookhealth-体检预约系统)

A mobile-first health examination booking platform built with React + TypeScript + Express + PostgreSQL. Bilingual (English / Chinese), Docker Compose deployment, and a PC admin panel.

---

## Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Database Tables](#database-tables)
- [Features](#features)
  - [User Frontend (Mobile)](#user-frontend-mobile)
  - [Admin Panel (PC)](#admin-panel-pc)
  - [API](#api)
- [Images & Media](#images--media)
- [Local Development](#local-development)
- [Deployment](#deployment)
  - [Full Deploy (AMD64 Server)](#full-deploy-amd64-server)
  - [Update Frontend Only](#update-frontend-only)
  - [Update Backend Only](#update-backend-only)
  - [Database Migration](#database-migration)
- [Troubleshooting](#troubleshooting)
- [Port Allocation](#port-allocation)
- [Test Accounts](#test-accounts)
- [Nginx Configuration](#nginx-configuration)
- [Operations](#operations)

---

## Overview

BookHealth is a complete health examination appointment system:

- **Mobile frontend** — browse checkup packages, book appointments, view reports
- **PC admin panel** — manage packages, exam items, examinees, and orders
- **Bilingual UI** — English by default, Chinese toggle, no localStorage persistence
- **Dual JWT auth** — separate user token and admin token
- **Docker Compose** — PostgreSQL + Express + Nginx in one stack

## Project Structure

```
BookHealth/
├── database/                       # SQL scripts
│   ├── schema.sql                  # Table definitions (22 tables)
│   ├── seed.sql                    # Seed data
│   └── migrate_image_columns_to_text.sql   # Migration: image columns -> TEXT
├── backend/                        # Express + TypeScript API
│   ├── src/
│   │   ├── config/                 # DB, Socket.IO, environment
│   │   ├── middleware/             # JWT auth, file upload
│   │   ├── routes/                 # auth, admin, institution, package, order, report, consultation, upload
│   │   ├── utils/                  # Response helpers, utilities
│   │   └── index.ts                # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                       # Vite + React + TypeScript
│   ├── src/
│   │   ├── api/                    # HTTP client (dual-token)
│   │   ├── components/             # CoverImage, ImageUpload, TabBar, BackButton, ...
│   │   ├── pages/                  # Home, PackageList, PackageDetail, ..., pages/admin/*
│   │   ├── i18n/                   # Lightweight i18n (t() + td())
│   │   ├── utils/                  # localImages.ts (bundled default images)
│   │   ├── store/                  # State management
│   │   └── styles/                 # TailwindCSS, theme color #3a8e59
│   ├── Dockerfile
│   ├── nginx.conf                  # API proxy + cache control
│   └── package.json
├── deploy/                         # Deployment configs
│   ├── nginx-subdomain.conf        # Subdomain vhost (HTTP / HTTPS)
│   └── DEPLOY.md                   # Full deployment guide
├── scripts/
│   ├── deploy.sh                   # frontend / backend / all / init / config / sql / status
│   └── dev.sh                      # Local one-command dev environment
├── runtime/                        # Deployed artifacts (bind-mounted by compose)
│   ├── frontend/                   #   static files served by nginx
│   └── backend/dist/               #   compiled API code
├── docker-compose.yml              # Server: nginx + backend image, code mounted from runtime/
├── docker-compose.dev.yml          # Local: Postgres only (APIs run natively)
├── bookhealth-api.env              # The only config file: logins, JWT, DB name/user/password
├── .deploy.env.example             # Copy to .deploy.env, fill SERVER / REMOTE_DIR
└── README.md
```

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + TailwindCSS + React Router
**Backend:** Node.js + Express + TypeScript + Socket.IO + JWT + zod + multer
**Database:** PostgreSQL 16
**Server:** Docker Compose + Nginx

Details:

| Layer     | Technology |
|-----------|------------|
| Frontend  | Vite + React + TypeScript + TailwindCSS + React Router |
| Backend   | Express + TypeScript + PostgreSQL (pg) + JWT + bcrypt + zod + multer |
| Realtime  | Socket.IO |
| Deploy    | Docker Compose + Nginx + HTTPS (Let's Encrypt) |
| i18n      | Custom lightweight solution (`t()` for static text, `td()` for DB data) |

## Database Tables

22 tables in total.

| Table | Description |
|-------|-------------|
| users | End users |
| admins | Admin accounts |
| provinces / cities | Provinces and cities |
| institutions | Health checkup institutions |
| exam_items | Examination items |
| package_categories | Package categories |
| packages | Checkup packages |
| package_items | Package ↔ exam item |
| package_institutions | Package ↔ institution |
| addon_packages | Add-on packages |
| addon_package_items | Add-on package items |
| examinees | Examinees (family members) |
| orders | Orders / appointments |
| order_addons | Order add-ons |
| reports | Medical reports |
| report_items | Report line items |
| standard_metrics | Standard health metrics |
| institution_metrics | Institution ↔ metric mapping |
| sms_codes | SMS verification codes |
| doctors | Doctors (consultation) |
| consultations | Consultation records |

## Features

### User Frontend (Mobile)

- Home: recommended institutions (horizontal swipe, 3 cards per screen), recommended packages, category shortcuts
- Institution list & detail
- Package list & detail (add-ons, institution selection)
- Appointment booking (examinee, date, time slot)
- My orders (Pending / Completed / Cancelled) with detail page
- My reports & report detail (item-by-item results)
- Examinee management (add / delete family members)
- Doctor consultation
- Profile page
- EN / CN toggle in the header

### Admin Panel (PC)

Access at `/admin`, login at `/admin/login`.

- Admin login
- Dashboard overview
- **Package management** — list, create, edit, delete, cover image upload
- Exam item management
- Examinee list
- Order management (backend API ready, page not built yet)
- Institution management (backend API ready, page not built yet)

### API

| Prefix | Module |
|--------|--------|
| `/api/auth` | User login, register, SMS code login |
| `/api/admin` | Admin login + all admin CRUD |
| `/api/institutions` | Institutions |
| `/api/packages` | Packages and categories |
| `/api/orders` | Orders |
| `/api/reports` | Reports |
| `/api/consultations` | Consultations |
| `/api/upload` | File upload (multer, stores files under `/app/uploads`) |
| `/health` | Health check |

## Images & Media

Two mechanisms exist in the codebase:

1. **File upload (legacy)** — `POST /api/upload` with `multipart/form-data`, multer writes to `/app/uploads`, returns a public URL.
2. **Base64 in JSON** — the admin package editor reads the image with `FileReader`, compresses it on canvas (long edge 1200px, JPEG quality 0.82), and submits a `data:image/jpeg;base64,...` string in `cover_image`.

Image columns are `TEXT` so base64 payloads fit:

`packages.cover_image`, `institutions.logo`, `institutions.images` (`TEXT[]`), `package_categories.icon`, `doctors.avatar`, `users.avatar`

> **Current status:** the frontend currently uses **bundled local images** for institutions and packages (`frontend/src/utils/localImages.ts`), so pages render correctly even when remote/base64 images fail. To switch back to database images, replace `src={packageImage(idx)}` with `src={pkg.cover_image}` in the relevant pages.

Body size limits are already raised: `express.json({ limit: '10mb' })` and `client_max_body_size 10m` in both Nginx configs.

## Local Development

```bash
./scripts/dev.sh                 # installs deps, creates DB + seed, starts API and Vite
DB_PORT=5434 ./scripts/dev.sh    # if you prefer the Postgres container (docker-compose.dev.yml)

# Frontend:   http://localhost:5173
# Admin:      http://localhost:5173/admin
# API:        http://localhost:3002/api
```

Every credential lives in `bookhealth-api.env` at the project root — login accounts, JWT secrets, **and the database name / user / password**. Change the file, run `./scripts/deploy.sh config`, done. No database edit needed; the script also applies `ALTER USER` / `ALTER DATABASE RENAME` when those values changed.

## Deployment

Two rules keep deploys tiny:

1. **The server never builds the frontend.** `nginx:alpine` serves a bind-mounted folder.
2. **Code lives outside the images.** Only compiled output is uploaded.

| Service | Runtime | What a deploy uploads |
|---------|---------|-----------------------|
| frontend | `nginx:alpine` + `./runtime/frontend` mount | ~300 KB of static files, live immediately |
| backend | `health-backend` image (node_modules) + `./runtime/backend/dist` mount | ~30 KB of compiled JS + container restart |
| db | `postgres:16-alpine` + named volume | unchanged |

### One-time setup

```bash
# 1. Server: docker + compose installed, project dir exists
ssh ubuntu@SERVER_IP 'mkdir -p /home/ubuntu/BookHealth'

# 2. Local: point the scripts at your server
cp .deploy.env.example .deploy.env
vi .deploy.env                   # SERVER=ubuntu@1.2.3.4  REMOTE_DIR=/home/ubuntu/BookHealth

# 3. First deploy (uploads compose/env/sql, builds the backend base image, starts everything)
./scripts/deploy.sh init
```

### Everyday deploys

```bash
./scripts/deploy.sh frontend     # pages, styles, images — no image build, no restart
./scripts/deploy.sh backend      # API changes — rebuild dist + restart backend (~10 s)
./scripts/deploy.sh all          # both
./scripts/deploy.sh status       # container state + health checks
./scripts/deploy.sh logs backend # follow logs
```

`--no-build` uploads the existing `dist` folders without rebuilding.

### Change login passwords

```bash
vi bookhealth-api.env            # ADMIN_USER / ADMIN_PASS, APP_USER / APP_PASS
./scripts/deploy.sh config       # sync the file, apply DB changes if any, recreate containers
```

The env account takes precedence over the database account, so editing the file is enough. Database users created by registration keep working with their own password.

### Change the database name / password

Both `db` and `backend` read from the same file. Keep the two groups in sync — `DB_*` is what the API connects with, `POSTGRES_*` is what Postgres initialises with:

```env
DB_NAME=bookhealth          POSTGRES_DB=bookhealth
DB_USER=postgres            POSTGRES_USER=postgres
DB_PASSWORD=postgres123     POSTGRES_PASSWORD=postgres123
```

```bash
vi bookhealth-api.env            # change both values of the pair
./scripts/deploy.sh config       # validates → ALTER USER / RENAME → recreate db+backend → verify
```

What the script does, in order: validate the pairs (mismatch = exit, the classic 502) → back up the server file to `bookhealth-api.env.bak` → upload → stop backend → `ALTER USER ... WITH PASSWORD` if the password changed → `ALTER DATABASE ... RENAME TO` if the name changed → recreate `db` and `backend` → require **`/api/packages` to return 200** (a real DB read), not just `/health`.

`POSTGRES_PASSWORD` only applies when the data volume is created for the first time; afterwards the password must be changed inside Postgres, which is exactly what the script does. Changing `DB_USER` to a brand-new role still requires re-creating the volume.

### Database migration

There is no migration framework — SQL files are **not** executed automatically. Back up, then run:

```bash
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d_%H%M).sql
./scripts/deploy.sh sql database/migrate_image_columns_to_text.sql   # runs locally → server

# Verify column types
docker compose exec db psql -U postgres -d bookhealth -c "
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('packages','cover_image'), ('institutions','logo'), ('institutions','images'),
  ('package_categories','icon'), ('doctors','avatar'), ('users','avatar')
) ORDER BY 1,2;"
```

> `POSTGRES_PASSWORD` is only honoured when the data volume is created. Changing it later requires `ALTER USER postgres WITH PASSWORD '...'` inside the container.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `502 Bad Gateway` | Backend container down or crashed | `docker compose ps` + `docker compose logs --tail=80 backend` |
| `password authentication failed for user "postgres"` | `.env` password differs from the one the data volume was initialised with | `docker compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '...';"` then `up -d --force-recreate backend`. Never use `down -v` to "reset" — it wipes the volume |
| `413 Payload Too Large` | Body size limit | `express.json({ limit: '10mb' })` + `client_max_body_size 10m` |
| Image stored as `NULL` after saving | Frontend did not submit the field, or column still `varchar(500)` | Check Network payload and run the verification query above |
| Code change not visible after `docker load` | Container not recreated, or old image | `docker compose up -d --force-recreate <service>` |
| `/src/assets/xxx.png` 404 in production | Asset referenced as a plain string instead of `import` | Use `import img from '../assets/x.png'` so Vite bundles it |

## Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| System Nginx | 80 / 443 | Existing site + BookHealth subdomain |
| Frontend (Docker) | 8090 | Nginx serving the built React app |
| Backend (Docker) | 3002 → 3000 | Express API server |
| PostgreSQL (Docker) | 5434 → 5432 | Database (internal) |

## Test Accounts

Login accounts, JWT secrets and the database name/user/password are all in `bookhealth-api.env` — edit the file, then `./scripts/deploy.sh config`.

| Type | Env keys | Default | URL |
|------|----------|---------|-----|
| User | `APP_USER` / `APP_PASS` | test01 / 123456 | `/` |
| Admin | `ADMIN_USER` / `ADMIN_PASS` | test01 / admin123456 | `/admin` |

## Nginx Configuration

```bash
sudo cp deploy/nginx-subdomain.conf /etc/nginx/sites-available/bookhealth.conf
sudo vi /etc/nginx/sites-available/bookhealth.conf
# replace health.your-domain.com with the real domain
sudo ln -sf /etc/nginx/sites-available/bookhealth.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS (optional)
sudo certbot --nginx -d health.your-domain.com
```

## Operations

```bash
cd /home/ubuntu/BookHealth

# Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Restart
docker compose restart backend
docker compose restart frontend

# Database shell
docker compose exec db psql -U postgres -d bookhealth

# Backup / restore
docker compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# Reinitialise (WARNING: destroys all data)
docker compose down -v && docker compose up -d
docker compose exec -T db psql -U postgres -d bookhealth < database/schema.sql
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
```

[Back to top](#bookhealth---health-examination-booking-system)

---

# BookHealth 体检预约系统

[English](#bookhealth---health-examination-booking-system) | **简体中文**

基于 React + TypeScript + Express + PostgreSQL 的移动端体检预约平台，支持中英文双语、Docker 容器化部署，附带 PC 版后台管理。

---

## 目录

- [概述](#概述)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [数据库表](#数据库表)
- [功能清单](#功能清单)
  - [用户前台（移动端）](#用户前台移动端)
  - [后台管理（PC 版）](#后台管理pc-版)
  - [API 接口](#api-接口)
- [图片方案](#图片方案)
- [本地开发](#本地开发)
- [部署指南](#部署指南)
  - [构建并部署（AMD64 服务器）](#构建并部署amd64-服务器)
  - [只更新前端](#只更新前端)
  - [只更新后端](#只更新后端)
  - [数据库迁移](#数据库迁移)
- [常见问题](#常见问题)
- [端口分配](#端口分配)
- [测试账号](#测试账号)
- [Nginx 二级域名配置](#nginx-二级域名配置)
- [运维命令](#运维命令)

---

## 概述

BookHealth 是一个完整的体检预约系统，包含：

- **移动端前台**：浏览体检套餐、预约挂号、查看报告
- **PC 版后台**：管理套餐、体检项、体检人、订单
- **中英文双语**：默认英文，可切换中文，不做 localStorage 持久化
- **JWT 双 Token 认证**：用户 Token 与管理员 Token 分离
- **Docker Compose 编排**：PostgreSQL + Express + Nginx 一键启动

## 项目结构

```
BookHealth/
├── database/                       # 数据库脚本
│   ├── schema.sql                  # 建表脚本（22 张表）
│   ├── seed.sql                    # 种子数据
│   └── migrate_image_columns_to_text.sql   # 迁移：图片字段改为 TEXT
├── backend/                        # Express + TypeScript 后端
│   ├── src/
│   │   ├── config/                 # 数据库、Socket.IO、环境配置
│   │   ├── middleware/             # JWT 认证、文件上传
│   │   ├── routes/                 # auth、admin、institution、package、order、report、consultation、upload
│   │   ├── utils/                  # 统一响应、工具函数
│   │   └── index.ts                # 入口文件
│   ├── Dockerfile
│   └── package.json
├── frontend/                       # Vite + React + TypeScript 前端
│   ├── src/
│   │   ├── api/                    # HTTP 客户端（双 Token）
│   │   ├── components/             # CoverImage、ImageUpload、TabBar、BackButton 等
│   │   ├── pages/                  # Home、PackageList、PackageDetail…、pages/admin/*
│   │   ├── i18n/                   # 轻量 i18n（t() + td()）
│   │   ├── utils/                  # localImages.ts（内置默认图）
│   │   ├── store/                  # 状态管理
│   │   └── styles/                 # TailwindCSS，主色 #3a8e59
│   ├── Dockerfile
│   ├── nginx.conf                  # API 代理 + 缓存控制
│   └── package.json
├── deploy/                         # 部署配置
│   ├── nginx-subdomain.conf        # 二级域名配置（HTTP / HTTPS）
│   └── DEPLOY.md                   # 完整部署文档
├── scripts/
│   ├── deploy.sh                   # 一键发布：frontend / backend / all / init / config / sql / status
│   └── dev.sh                      # 本地一键开发环境
├── runtime/                        # 发布产物（被 compose 挂载进容器）
│   ├── frontend/                   #   前端静态文件
│   └── backend/dist/               #   后端编译产物
├── docker-compose.yml              # 服务器：nginx + 后端基础镜像，代码从 runtime/ 挂载
├── docker-compose.dev.yml          # 本地：只起 Postgres（前后端原生运行）
├── bookhealth-api.env              # 唯一配置文件：登录账号、JWT、数据库名/用户/密码
├── .deploy.env.example             # 复制为 .deploy.env，填服务器地址
└── README.md
```

## 技术栈

**前端：** React 18 + TypeScript + Vite + TailwindCSS + React Router
**后端：** Node.js + Express + TypeScript + Socket.IO + JWT + zod + multer
**数据库：** PostgreSQL 16
**服务器：** Docker Compose + Nginx

详细版本：

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React + TypeScript + TailwindCSS + React Router |
| 后端 | Express + TypeScript + PostgreSQL (pg) + JWT + bcrypt + zod + multer |
| 实时通信 | Socket.IO |
| 部署 | Docker Compose + Nginx + HTTPS (Let's Encrypt) |
| 国际化 | 自建轻量方案（`t()` 翻译静态文本，`td()` 翻译数据库动态数据） |

## 数据库表

共 22 张表。

| 表名 | 说明 |
|------|------|
| users | 用户 |
| admins | 管理员 |
| provinces / cities | 省市 |
| institutions | 体检机构 |
| exam_items | 体检项 |
| package_categories | 套餐分类 |
| packages | 体检套餐 |
| package_items | 套餐 ↔ 体检项 |
| package_institutions | 套餐 ↔ 机构 |
| addon_packages | 加项包 |
| addon_package_items | 加项包体检项 |
| examinees | 体检人 |
| orders | 订单 / 预约 |
| order_addons | 订单加项 |
| reports | 体检报告 |
| report_items | 报告项目明细 |
| standard_metrics | 标准指标 |
| institution_metrics | 机构 ↔ 指标映射 |
| sms_codes | 短信验证码 |
| doctors | 医生 |
| consultations | 咨询记录 |

## 功能清单

### 用户前台（移动端）

- 首页：推荐机构（横向滑动，一屏 3 张）、推荐套餐、分类入口
- 机构列表 / 机构详情
- 套餐列表 / 套餐详情（加项、选机构）
- 创建预约（选体检人、选时间）
- 我的预约（待体检 / 已体检 / 已取消）+ 预约详情
- 我的报告 / 报告详情（逐项结果）
- 体检人管理（添加 / 删除家庭成员）
- 咨询医生
- 个人中心
- 顶部中英文切换

### 后台管理（PC 版）

入口 `/admin`，登录页 `/admin/login`。

- 管理员登录
- 仪表盘概览
- **套餐管理**：列表、新增、编辑、删除、封面上传
- 体检项管理
- 体检人列表
- 订单管理（后端接口已就绪，页面未做）
- 机构管理（后端接口已就绪，页面未做）

### API 接口

| 前缀 | 模块 |
|------|------|
| `/api/auth` | 用户登录、注册、短信验证码登录 |
| `/api/admin` | 管理员登录 + 全部后台增删改查 |
| `/api/institutions` | 机构 |
| `/api/packages` | 套餐与分类 |
| `/api/orders` | 订单 |
| `/api/reports` | 报告 |
| `/api/consultations` | 咨询 |
| `/api/upload` | 文件上传（multer，落盘 `/app/uploads`） |
| `/health` | 健康检查 |

## 图片方案

代码里存在两种机制：

1. **文件上传（老方案）**：`POST /api/upload`，`multipart/form-data`，multer 写入 `/app/uploads`，返回公网 URL。
2. **Base64 存库（新方案）**：后台套餐编辑页用 `FileReader` 读取图片，canvas 压缩（长边 1200px、JPEG 质量 0.82），以 `data:image/jpeg;base64,...` 形式放在 `cover_image` 字段提交。

图片字段均为 `TEXT`，可容纳 base64：

`packages.cover_image`、`institutions.logo`、`institutions.images`（`TEXT[]`）、`package_categories.icon`、`doctors.avatar`、`users.avatar`

> **当前状态**：前台机构与套餐图片**使用仓库内置的本地图片**（`frontend/src/utils/localImages.ts`，机构 h1/h2 循环、套餐 p1/p2/p3 循环），不读数据库图片字段，因此图片加载异常时页面依然完整。要恢复「数据库有图优先」，把对应页面的 `src={packageImage(idx)}` 换回 `src={pkg.cover_image}` 即可。

请求体上限已经放开：`express.json({ limit: '10mb' })`，两处 Nginx 均配置 `client_max_body_size 10m`。

## 本地开发

```bash
./scripts/dev.sh                 # 装依赖、建库导数据、同时起后端和前端
DB_PORT=5434 ./scripts/dev.sh    # 用 Docker 里的 Postgres（docker-compose.dev.yml）

# 前台：    http://localhost:5173
# 后台管理：http://localhost:5173/admin
# 后端 API：http://localhost:3002/api
```

所有账号密码都在根目录 `bookhealth-api.env` 里，**数据库名 / 库用户 / 库密码也在这里**。改文件 + `./scripts/deploy.sh config` 即生效，不用手写 SQL；值真的变了脚本会自动执行 `ALTER USER` / `ALTER DATABASE RENAME`。

## 部署指南

两条原则让发布变成小包上传：

1. **服务器不再构建前端镜像**，用 `nginx:alpine` 直接挂载静态目录；
2. **代码不进镜像**，只上传编译产物。

| 服务 | 运行方式 | 一次发布要传什么 |
|------|----------|------------------|
| 前端 | `nginx:alpine` + 挂载 `./runtime/frontend` | 约 300 KB 静态文件，传完即生效 |
| 后端 | `health-backend` 镜像（含 node_modules）+ 挂载 `./runtime/backend/dist` | 约 30 KB 编译结果 + 重启容器 |
| 数据库 | `postgres:16-alpine` + 数据卷 | 不变 |

### 首次部署（只做一次）

```bash
# 1. 服务器上建目录（Docker 与 compose 需已安装）
ssh ubuntu@服务器IP 'mkdir -p /home/ubuntu/BookHealth'

# 2. 本地配置发布参数
cp .deploy.env.example .deploy.env
vi .deploy.env                   # SERVER=ubuntu@服务器IP  REMOTE_DIR=/home/ubuntu/BookHealth

# 3. 一键初始化：上传编排与配置、构建后端基础镜像、启动全部服务
./scripts/deploy.sh init
```

### 日常发布

```bash
./scripts/deploy.sh frontend     # 只改了页面/样式/图片：不建镜像、不重启
./scripts/deploy.sh backend      # 只改了接口逻辑：编译 dist + 重启 backend（约 10 秒）
./scripts/deploy.sh all          # 前后端都改了
./scripts/deploy.sh status       # 容器状态 + 健康检查
./scripts/deploy.sh logs backend # 跟踪日志
```

加 `--no-build` 可跳过本地构建，直接上传现有 `dist`。

### 改登录密码

```bash
vi bookhealth-api.env            # ADMIN_USER / ADMIN_PASS（后台）、APP_USER / APP_PASS（前台）
./scripts/deploy.sh config       # 同步文件，库配置有变化就一并改库，再重建容器
```

env 里的账号优先于数据库账号，所以只改文件即可；注册产生的普通用户仍用自己的密码登录。

### 改数据库名 / 数据库密码

`db` 和 `backend` 读的是同一个文件。两组值必须写成一套 —— `DB_*` 是后端连库用的，`POSTGRES_*` 是 Postgres 初始化用的：

```env
DB_NAME=bookhealth          POSTGRES_DB=bookhealth
DB_USER=postgres            POSTGRES_USER=postgres
DB_PASSWORD=postgres123     POSTGRES_PASSWORD=postgres123
```

```bash
vi bookhealth-api.env            # 成对修改
./scripts/deploy.sh config       # 校验 → ALTER USER / RENAME → 重建 db+backend → 验证
```

脚本内部顺序：校验两组值是否一致（不一致直接退出，这就是之前 502 的根源）→ 备份为 `bookhealth-api.env.bak` → 上传 → 停 backend → 密码变了就 `ALTER USER ... WITH PASSWORD` → 库名变了就 `ALTER DATABASE ... RENAME TO` → 重建 `db` 和 `backend` → 要求 **`/api/packages` 返回 200**（真读库），而不只是 `/health`。

`POSTGRES_PASSWORD` 只在数据卷首次创建时生效，之后改密码必须进库改，脚本帮你做了这一步。把 `DB_USER` 换成一个全新的角色仍然需要重建数据卷。

### 数据库迁移

项目没有迁移框架，SQL **不会自动执行**。先备份再跑：

```bash
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d_%H%M).sql
./scripts/deploy.sh sql database/migrate_image_columns_to_text.sql   # 本地执行，自动传到服务器

# 验证字段类型（character_maximum_length 应为空）
docker compose exec db psql -U postgres -d bookhealth -c "
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('packages','cover_image'), ('institutions','logo'), ('institutions','images'),
  ('package_categories','icon'), ('doctors','avatar'), ('users','avatar')
) ORDER BY 1,2;"
```

> `POSTGRES_PASSWORD` 只在数据卷首次创建时生效；之后要改库密码，进容器执行 `ALTER USER postgres WITH PASSWORD '...'`。

## 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `502 Bad Gateway` | 后端容器挂了或没起来 | `docker compose ps` + `docker compose logs --tail=80 backend` |
| `password authentication failed for user "postgres"` | `.env` 里的密码与数据卷初始化时的密码不一致 | `docker compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '...';"` 后 `up -d --force-recreate backend`。**不要用 `down -v` 重置，会清空数据** |
| `413 Payload Too Large` | 请求体超限 | `express.json({ limit: '10mb' })` + 两处 `client_max_body_size 10m` |
| 保存后图片字段仍为 `NULL` | 前端没提交该字段，或字段还是 `varchar(500)` | 看 Network 里的请求体，并跑上面的字段类型查询 |
| `docker load` 后代码没变（旧流程） | 容器没重建，或加载的是旧包 | `docker compose up -d --force-recreate <service>` |
| 发布后页面没变 | 浏览器缓存 / 上传的产物不是最新 | 强刷 `Cmd+Shift+R`；确认 `deploy.sh` 的构建步骤没有报错 |
| 生产环境 `/src/assets/xxx.png` 404 | 资源用字符串路径引用，没走 `import` | 改成 `import img from '../assets/x.png'`，让 Vite 打包进 `dist/assets` |

## 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 系统 Nginx | 80 / 443 | 已有网站 + BookHealth 二级域名 |
| 前端（Docker） | 8090 | Nginx 提供前端静态文件 |
| 后端（Docker） | 3002 → 3000 | Express API 服务 |
| PostgreSQL（Docker） | 5434 → 5432 | 数据库（内部） |

## 测试账号

登录账号、JWT 密钥、数据库名/用户/密码全部定义在 `bookhealth-api.env`，改完执行 `./scripts/deploy.sh config`。

| 类型 | 环境变量 | 默认值 | 访问路径 |
|------|----------|--------|----------|
| 前台用户 | `APP_USER` / `APP_PASS` | test01 / 123456 | `/` |
| 后台管理员 | `ADMIN_USER` / `ADMIN_PASS` | test01 / admin123456 | `/admin` |

## Nginx 二级域名配置

```bash
sudo cp deploy/nginx-subdomain.conf /etc/nginx/sites-available/bookhealth.conf
sudo vi /etc/nginx/sites-available/bookhealth.conf
# 把 health.your-domain.com 换成真实域名
sudo ln -sf /etc/nginx/sites-available/bookhealth.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS（可选）
sudo certbot --nginx -d health.your-domain.com
```

## 运维命令

```bash
# 本地一行搞定
./scripts/deploy.sh status
./scripts/deploy.sh logs backend
./scripts/deploy.sh ssh            # 直接进服务器项目目录

# 服务器上手动操作
cd /home/ubuntu/BookHealth

docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

docker compose up -d --force-recreate backend   # 换 dist / 改 env 后
docker compose exec db psql -U postgres -d bookhealth   # 进数据库

# 备份 / 恢复
docker compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# 重新初始化（警告：会清空所有数据）
docker compose down -v && docker compose up -d
docker compose exec -T db psql -U postgres -d bookhealth < database/schema.sql
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
```

[返回顶部](#bookhealth-体检预约系统)

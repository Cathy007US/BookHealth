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
├── docker-compose.yml              # Server deployment (image-based)
├── docker-compose.dev.yml          # Local development (source build)
├── bookhealth-api.env              # Environment variables
├── build.sh                        # AMD64 build + packaging script
└── README.md
```

## Tech Stack

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
# 1. Start everything with Docker
cd BookHealth
docker compose -f docker-compose.dev.yml up -d --build

# 2. Or run frontend and backend separately for hot reload
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# 3. Access
# Frontend:    http://localhost:8090
# Backend API: http://localhost:3002/api
# Admin panel: http://localhost:8090/admin
```

## Deployment

The server runs `linux/amd64`; images are built on an Apple Silicon Mac via `buildx`.

### Full Deploy (AMD64 Server)

```bash
# === Local (Mac) ===
cd BookHealth

./build.sh        # builds both images, exports health-images.tar.gz, packages the bundle

scp bookhealth-deploy.tar.gz ubuntu@SERVER_IP:/home/ubuntu/
```

```bash
# === Server (Ubuntu) ===
mkdir -p /home/ubuntu/BookHealth && cd /home/ubuntu/BookHealth
tar xzf /home/ubuntu/bookhealth-deploy.tar.gz

vi bookhealth-api.env          # set DB_PASSWORD / JWT secrets (must match the DB password)

docker load -i health-images.tar.gz
docker compose up -d

docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3002/api/packages
```

### Update Frontend Only

```bash
# Local
docker buildx build --platform linux/amd64 -t health-frontend:latest \
  -f frontend/Dockerfile frontend/ --load
docker save health-frontend:latest | gzip > health-frontend.tar.gz
scp health-frontend.tar.gz ubuntu@SERVER_IP:/home/ubuntu/BookHealth/
```

```bash
# Server
cd /home/ubuntu/BookHealth
docker load -i health-frontend.tar.gz
docker compose up -d --force-recreate frontend
rm health-frontend.tar.gz
```

### Update Backend Only

```bash
# Local
docker buildx build --platform linux/amd64 -t health-backend:latest \
  -f backend/Dockerfile backend/ --load
docker save health-backend:latest | gzip > health-backend.tar.gz
scp health-backend.tar.gz ubuntu@SERVER_IP:/home/ubuntu/BookHealth/
```

```bash
# Server
cd /home/ubuntu/BookHealth
docker tag health-backend:latest health-backend:prev 2>/dev/null || true   # rollback point
docker load -i health-backend.tar.gz
docker compose up -d --force-recreate backend
rm health-backend.tar.gz
```

> `--force-recreate` is required. Image tag is always `latest`, so a plain `docker compose up -d` may decide nothing changed and keep the old container.

### Database Migration

SQL files are **not** executed automatically — there is no migration framework. Run them explicitly against the `bookhealth` database:

```bash
cd /home/ubuntu/BookHealth

# Always back up first
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d_%H%M).sql

# Run migration (ON_ERROR_STOP aborts on the first failure)
docker compose exec -T db psql -U postgres -d bookhealth -v ON_ERROR_STOP=1 \
  < database/migrate_image_columns_to_text.sql

# Verify column types
docker compose exec db psql -U postgres -d bookhealth -c "
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('packages','cover_image'), ('institutions','logo'), ('institutions','images'),
  ('package_categories','icon'), ('doctors','avatar'), ('users','avatar')
) ORDER BY 1,2;"
```

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

| Type | Username | Password | URL |
|------|----------|----------|-----|
| User | test01 | 123456 | `/` |
| Admin | test01 | 123456 | `/admin` |

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
├── docker-compose.yml              # 服务器部署（基于镜像）
├── docker-compose.dev.yml          # 本地开发（基于源码构建）
├── bookhealth-api.env              # 环境变量
├── build.sh                        # AMD64 构建 + 打包脚本
└── README.md
```

## 技术栈

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
# 1. 启动全部 Docker 服务
cd BookHealth
docker compose -f docker-compose.dev.yml up -d --build

# 2. 或分别启动前端 / 后端（支持热更新）
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# 3. 访问地址
# 前台：    http://localhost:8090
# 后端 API：http://localhost:3002/api
# 后台管理：http://localhost:8090/admin
```

## 部署指南

服务器为 `linux/amd64`，镜像在 Apple Silicon Mac 上用 `buildx` 跨平台构建。

### 构建并部署（AMD64 服务器）

```bash
# === 本地（Mac）===
cd BookHealth

./build.sh        # 构建前后端镜像、导出 health-images.tar.gz、打包部署包

scp bookhealth-deploy.tar.gz ubuntu@服务器IP:/home/ubuntu/
```

```bash
# === 服务器（Ubuntu）===
mkdir -p /home/ubuntu/BookHealth && cd /home/ubuntu/BookHealth
tar xzf /home/ubuntu/bookhealth-deploy.tar.gz

vi bookhealth-api.env          # 设置 DB_PASSWORD / JWT 密钥（密码须与数据库一致）

docker load -i health-images.tar.gz
docker compose up -d

docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3002/api/packages
```

### 只更新前端

```bash
# 本地
docker buildx build --platform linux/amd64 -t health-frontend:latest \
  -f frontend/Dockerfile frontend/ --load
docker save health-frontend:latest | gzip > health-frontend.tar.gz
scp health-frontend.tar.gz ubuntu@服务器IP:/home/ubuntu/BookHealth/
```

```bash
# 服务器
cd /home/ubuntu/BookHealth
docker load -i health-frontend.tar.gz
docker compose up -d --force-recreate frontend
rm health-frontend.tar.gz
```

### 只更新后端

```bash
# 本地
docker buildx build --platform linux/amd64 -t health-backend:latest \
  -f backend/Dockerfile backend/ --load
docker save health-backend:latest | gzip > health-backend.tar.gz
scp health-backend.tar.gz ubuntu@服务器IP:/home/ubuntu/BookHealth/
```

```bash
# 服务器
cd /home/ubuntu/BookHealth
docker tag health-backend:latest health-backend:prev 2>/dev/null || true   # 留一个回滚点
docker load -i health-backend.tar.gz
docker compose up -d --force-recreate backend
rm health-backend.tar.gz
```

> 必须加 `--force-recreate`。镜像 tag 永远是 `latest`，只跑 `docker compose up -d` 时 Compose 可能认为配置没变，继续用旧容器。

### 数据库迁移

项目没有迁移框架，`database/` 下的 SQL **不会自动执行**，需要手动对 `bookhealth` 库跑一次：

```bash
cd /home/ubuntu/BookHealth

# 先备份
docker compose exec -T db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d_%H%M).sql

# 执行迁移（ON_ERROR_STOP 保证出错立即中断）
docker compose exec -T db psql -U postgres -d bookhealth -v ON_ERROR_STOP=1 \
  < database/migrate_image_columns_to_text.sql

# 验证字段类型（character_maximum_length 应为空）
docker compose exec db psql -U postgres -d bookhealth -c "
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('packages','cover_image'), ('institutions','logo'), ('institutions','images'),
  ('package_categories','icon'), ('doctors','avatar'), ('users','avatar')
) ORDER BY 1,2;"
```

## 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `502 Bad Gateway` | 后端容器挂了或没起来 | `docker compose ps` + `docker compose logs --tail=80 backend` |
| `password authentication failed for user "postgres"` | `.env` 里的密码与数据卷初始化时的密码不一致 | `docker compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD '...';"` 后 `up -d --force-recreate backend`。**不要用 `down -v` 重置，会清空数据** |
| `413 Payload Too Large` | 请求体超限 | `express.json({ limit: '10mb' })` + 两处 `client_max_body_size 10m` |
| 保存后图片字段仍为 `NULL` | 前端没提交该字段，或字段还是 `varchar(500)` | 看 Network 里的请求体，并跑上面的字段类型查询 |
| `docker load` 后代码没变 | 容器没重建，或加载的是旧包 | `docker compose up -d --force-recreate <service>` |
| 生产环境 `/src/assets/xxx.png` 404 | 资源用字符串路径引用，没走 `import` | 改成 `import img from '../assets/x.png'`，让 Vite 打包进 `dist/assets` |

## 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 系统 Nginx | 80 / 443 | 已有网站 + BookHealth 二级域名 |
| 前端（Docker） | 8090 | Nginx 提供前端静态文件 |
| 后端（Docker） | 3002 → 3000 | Express API 服务 |
| PostgreSQL（Docker） | 5434 → 5432 | 数据库（内部） |

## 测试账号

| 类型 | 用户名 | 密码 | 访问路径 |
|------|--------|------|----------|
| 前台用户 | test01 | 123456 | `/` |
| 后台管理员 | test01 | 123456 | `/admin` |

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
cd /home/ubuntu/BookHealth

# 日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# 重启
docker compose restart backend
docker compose restart frontend

# 进入数据库
docker compose exec db psql -U postgres -d bookhealth

# 备份 / 恢复
docker compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# 重新初始化（警告：会清空所有数据）
docker compose down -v && docker compose up -d
docker compose exec -T db psql -U postgres -d bookhealth < database/schema.sql
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
```

[返回顶部](#bookhealth-体检预约系统)

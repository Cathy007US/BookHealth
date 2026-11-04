# BookHealth - Health Examination Booking System

A mobile-first health examination booking platform built with React + TypeScript + Express + PostgreSQL, featuring bilingual support (English/Chinese), Docker containerized deployment, and a PC-based admin panel.

---

## Table of Contents

- [BookHealth - Health Examination Booking System](#bookhealth---health-examination-booking-system)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Project Structure](#project-structure)
  - [Tech Stack](#tech-stack)
  - [Database Tables](#database-tables)
  - [Features](#features)
    - [User Frontend (Mobile)](#user-frontend-mobile)
    - [Admin Panel (PC)](#admin-panel-pc)
    - [API](#api)
  - [Local Development](#local-development)
  - [Deployment](#deployment)
    - [Build \& Deploy (AMD64 Server)](#build--deploy-amd64-server)
    - [Update Frontend Only](#update-frontend-only)
    - [Update Backend Only](#update-backend-only)
  - [Port Allocation](#port-allocation)
  - [Test Accounts](#test-accounts)
  - [Nginx Subdomain Configuration](#nginx-subdomain-configuration)
  - [Operations](#operations)
- [BookHealth 体检预约系统](#bookhealth-体检预约系统)
  - [目录](#目录)
  - [概述](#概述)
  - [项目结构](#项目结构)
  - [技术栈](#技术栈)
  - [数据库表](#数据库表)
  - [功能清单](#功能清单)
    - [用户前台（移动端）](#用户前台移动端)
    - [后台管理（PC 版）](#后台管理pc-版)
    - [API 接口](#api-接口)
  - [本地开发](#本地开发)
  - [部署指南](#部署指南)
    - [构建并部署（AMD64 服务器）](#构建并部署amd64-服务器)
    - [只更新前端](#只更新前端)
    - [只更新后端](#只更新后端)
  - [端口分配](#端口分配)
  - [测试账号](#测试账号)
  - [Nginx 二级域名配置](#nginx-二级域名配置)
  - [运维命令](#运维命令)

---

## Overview

BookHealth is a complete health examination appointment system with:

- Mobile frontend for users to browse checkup packages, book appointments, and view reports
- PC admin panel for managing institutions, packages, exam items, examinees, and orders
- Bilingual support (English default, Chinese toggle) with no localStorage persistence
- JWT dual-token authentication (user token + admin token)
- Docker Compose orchestration (PostgreSQL + Express + Nginx)

## Project Structure

```
Health/
├── database/                  # Database scripts
│   ├── schema.sql             # Table definitions (20 tables)
│   └── seed.sql               # Seed data (54 records)
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── config/            # Database, Socket.IO, environment config
│   │   ├── middleware/        # JWT auth, file upload
│   │   ├── routes/            # API routes (auth, admin, package, order, etc.)
│   │   ├── utils/             # Utility functions
│   │   └── index.ts           # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                  # Vite + React + TS frontend
│   ├── src/
│   │   ├── api/               # HTTP client (dual-token support)
│   │   ├── components/        # Shared components (TabBar, BackButton, etc.)
│   │   ├── pages/             # Pages (Home, Packages, Orders, Admin, etc.)
│   │   ├── i18n/              # Lightweight i18n (t() + td(), no localStorage)
│   │   ├── store/             # State management
│   │   └── styles/            # Global styles (TailwindCSS, theme color #3a8e59)
│   ├── Dockerfile
│   ├── nginx.conf             # Frontend Nginx config (API proxy + caching)
│   └── package.json
├── deploy/                    # Deployment configs
│   ├── nginx-subdomain.conf   # Subdomain Nginx config (HTTP + HTTPS)
│   └── DEPLOY.md              # Full deployment guide
├── docker-compose.yml         # Server deployment (image-based)
├── docker-compose.dev.yml     # Local development (build-based)
├── bookhealth-api.env         # Environment variables
├── build.sh                   # Build script (AMD64 cross-platform)
└── README.md
```

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Vite + React + TypeScript + TailwindCSS + React Router |
| Backend  | Express + TypeScript + PostgreSQL (pg) + JWT + bcrypt + zod + multer |
| Deploy   | Docker Compose + Nginx + HTTPS (Let's Encrypt) |
| i18n     | Custom lightweight solution (t() for static text, td() for DB data) |

## Database Tables

| Table                   | Description |
|-------------------------|-------------|
| users                   | Users |
| admins                  | Admin users |
| provinces / cities      | Provinces and cities |
| institutions            | Health checkup institutions |
| exam_items              | Examination items |
| package_categories      | Package categories |
| packages                | Checkup packages |
| package_items           | Package-item associations |
| package_institutions    | Package-institution associations |
| addon_packages          | Add-on packages |
| addon_package_items     | Add-on package items |
| examinees               | Examinees (family members) |
| orders                  | Orders / appointments |
| order_addons            | Order add-ons |
| reports                 | Medical reports |
| report_items            | Report item details |
| standard_metrics        | Standard health metrics |
| institution_metrics     | Institution-metric mappings |
| sms_codes               | SMS verification codes |
| doctors                 | Doctors (for consultation) |
| consultations           | Consultation records |

## Features

### User Frontend (Mobile)
- Home page with recommended institutions, packages, and category shortcuts
- Institution list & detail pages
- Package list & detail (with add-ons and institution selection)
- Appointment booking (select examinee, date, time)
- My orders list (Pending / Completed / Cancelled) with order details
- My reports list & report detail (with item-by-item results)
- Examinee management (add/delete family members)
- Doctor consultation page
- Profile page
- Bilingual toggle (EN/CN) in header

### Admin Panel (PC)
- Admin login
- Dashboard with overview metrics
- Institution management (CRUD)
- Package management (CRUD)
- Exam item management (CRUD)
- Order management with status updates
- Examinee list view
- Admin account management

### API
- User auth: login (account+password), SMS code login, wx-login
- Admin auth: login with JWT
- CRUD for all entities
- File upload support
- WebSocket (Socket.IO) for real-time updates

## Local Development

```bash
# 1. Start Docker services (database + backend + frontend)
cd Health
docker compose -f docker-compose.dev.yml up -d --build

# 2. Or run frontend/backend separately for hot-reload
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# 3. Access
# Frontend: http://localhost:8090
# Backend API: http://localhost:3002/api
# Admin panel: http://localhost:8090/admin
```

## Deployment

### Build & Deploy (AMD64 Server)

Build AMD64 images on Mac (ARM64) and deploy to Ubuntu server:

```bash
# === Local (Mac) ===
cd Health

# 1. Build AMD64 images
docker buildx build --platform linux/amd64 -t health-backend:latest -f backend/Dockerfile backend/ --load
docker buildx build --platform linux/amd64 -t health-frontend:latest -f frontend/Dockerfile frontend/ --load

# 2. Export images
docker save health-backend:latest health-frontend:latest | gzip > health-images.tar.gz

# 3. Package deployment files
tar czf bookhealth-deploy.tar.gz \
  docker-compose.yml \
  bookhealth-api.env \
  database/schema.sql \
  database/seed.sql \
  deploy/nginx-subdomain.conf \
  health-images.tar.gz

# 4. Upload to server
scp bookhealth-deploy.tar.gz ubuntu@SERVER_IP:/home/ubuntu/
```

```bash
# === Server (Ubuntu) ===
mkdir -p /home/ubuntu/BookHealth && cd /home/ubuntu/BookHealth
tar xzf /home/ubuntu/bookhealth-deploy.tar.gz

# Modify passwords in env file
vi bookhealth-api.env

# Load images
docker load -i health-images.tar.gz
docker pull postgres:16-alpine

# Start services
docker compose up -d

# Import seed data
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql

# Verify
docker compose ps
curl http://127.0.0.1:8090
curl http://127.0.0.1:3002/api/packages
```

### Update Frontend Only

No need to re-upload the entire package:

```bash
# Local
docker buildx build --platform linux/amd64 -t health-frontend:latest -f frontend/Dockerfile frontend/ --load
docker save health-frontend:latest | gzip > health-frontend.tar.gz
scp health-frontend.tar.gz ubuntu@SERVER_IP:/home/ubuntu/BookHealth/

# Server
cd /home/ubuntu/BookHealth
docker load -i health-frontend.tar.gz
docker compose up -d frontend
rm health-frontend.tar.gz
```

### Update Backend Only

```bash
# Local
docker buildx build --platform linux/amd64 -t health-backend:latest -f backend/Dockerfile backend/ --load
docker save health-backend:latest | gzip > health-backend.tar.gz
scp health-backend.tar.gz ubuntu@SERVER_IP:/home/ubuntu/BookHealth/

# Server
cd /home/ubuntu/BookHealth
docker load -i health-backend.tar.gz
docker compose up -d backend
rm health-backend.tar.gz
```

## Port Allocation

| Service            | Port  | Description                        |
|--------------------|-------|------------------------------------|
| System Nginx       | 80    | Existing site + BookHealth subdomain |
| Frontend (Docker)  | 8090  | Nginx serving built React app      |
| Backend (Docker)   | 3002  | Express API server                 |
| PostgreSQL (Docker)| 5434  | Database (internal, not exposed)   |

## Test Accounts

| Type     | Username | Password  | URL                    |
|----------|----------|-----------|------------------------|
| User     | test01   | 123456   | / (home page)          |
| Admin    | test01   | 123456   | /admin (admin panel)   |

## Nginx Subdomain Configuration

Deploy `deploy/nginx-subdomain.conf` to system Nginx:

```bash
sudo cp deploy/nginx-subdomain.conf /etc/nginx/sites-available/bookhealth.conf
sudo vi /etc/nginx/sites-available/bookhealth.conf
# Replace health.your-domain.com with your real domain
sudo ln -sf /etc/nginx/sites-available/bookhealth.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS (optional)
sudo certbot --nginx -d health.your-domain.com
```

## Operations

```bash
cd /home/ubuntu/BookHealth

# View logs
docker compose logs -f backend       # Backend logs
docker compose logs -f frontend      # Nginx logs
docker compose logs -f db            # Database logs

# Restart services
docker compose restart backend
docker compose restart frontend

# Database access
docker compose exec db psql -U postgres -d bookhealth

# Backup database
docker compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# Reinitialize database (warning: deletes all data)
docker compose down -v
docker compose up -d
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
```

---

---

# BookHealth 体检预约系统

基于 React + TypeScript + Express + PostgreSQL 的移动端体检预约平台，支持中英文双语、Docker 容器化部署、PC 版后台管理。

---

## 目录

- [概述](#概述)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [数据库表](#数据库表)
- [功能清单](#功能清单)
- [本地开发](#本地开发)
- [部署指南](#部署指南)
  - [构建并部署（AMD64 服务器）](#构建并部署amd64-服务器)
  - [只更新前端](#只更新前端)
  - [只更新后端](#只更新后端)
- [端口分配](#端口分配)
- [测试账号](#测试账号)
- [Nginx 二级域名配置](#nginx-二级域名配置)
- [运维命令](#运维命令)

---

## 概述

BookHealth 是一个完整的体检预约系统，包含：

- 移动端前台：浏览体检套餐、预约挂号、查看报告
- PC 版后台：管理机构、套餐、体检项、体检人、订单
- 中英文双语支持（默认英文，无 localStorage 持久化）
- JWT 双 Token 认证（用户 Token + 管理员 Token）
- Docker Compose 编排（PostgreSQL + Express + Nginx）

## 项目结构

```
Health/
├── database/                  # 数据库脚本
│   ├── schema.sql             # 建表脚本（20 张表）
│   └── seed.sql               # 种子数据（54 条）
├── backend/                   # Express + TypeScript 后端
│   ├── src/
│   │   ├── config/            # 数据库、Socket.IO、环境配置
│   │   ├── middleware/        # JWT 认证、文件上传
│   │   ├── routes/            # API 路由（auth、admin、package、order 等）
│   │   ├── utils/             # 工具函数
│   │   └── index.ts           # 入口文件
│   ├── Dockerfile
│   └── package.json
├── frontend/                  # Vite + React + TS 前端
│   ├── src/
│   │   ├── api/               # HTTP 客户端（双 Token 支持）
│   │   ├── components/        # 通用组件（TabBar、BackButton 等）
│   │   ├── pages/             # 页面（首页、套餐、订单、后台等）
│   │   ├── i18n/              # 轻量 i18n（t() + td()，无 localStorage）
│   │   ├── store/             # 状态管理
│   │   └── styles/            # 全局样式（TailwindCSS，主色 #3a8e59）
│   ├── Dockerfile
│   ├── nginx.conf             # 前端 Nginx 配置（API 代理 + 缓存控制）
│   └── package.json
├── deploy/                    # 部署配置
│   ├── nginx-subdomain.conf   # 二级域名 Nginx 配置（HTTP + HTTPS）
│   └── DEPLOY.md              # 完整部署文档
├── docker-compose.yml         # 服务器部署版（基于镜像）
├── docker-compose.dev.yml     # 本地开发版（基于源码构建）
├── bookhealth-api.env         # 环境变量配置
├── build.sh                   # 构建脚本（AMD64 跨平台）
└── README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React + TypeScript + TailwindCSS + React Router |
| 后端 | Express + TypeScript + PostgreSQL (pg) + JWT + bcrypt + zod + multer |
| 部署 | Docker Compose + Nginx + HTTPS (Let's Encrypt) |
| 国际化 | 自建轻量方案（t() 翻译静态文本，td() 翻译数据库动态数据） |

## 数据库表

| 表名                   | 说明 |
|------------------------|------|
| users                  | 用户 |
| admins                 | 管理员 |
| provinces / cities     | 省市 |
| institutions           | 体检机构 |
| exam_items             | 体检项 |
| package_categories     | 套餐分类 |
| packages               | 体检套餐 |
| package_items          | 套餐-体检项关联 |
| package_institutions   | 套餐-机构关联 |
| addon_packages         | 加项包 |
| addon_package_items    | 加项包体检项 |
| examinees              | 体检人 |
| orders                 | 订单/预约 |
| order_addons           | 订单加项 |
| reports                | 体检报告 |
| report_items           | 报告项目明细 |
| standard_metrics       | 标准指标 |
| institution_metrics    | 机构指标映射 |
| sms_codes              | 短信验证码 |
| doctors                | 医生 |
| consultations          | 咨询记录 |

## 功能清单

### 用户前台（移动端）
- 首页：推荐机构、推荐套餐、分类入口
- 体检机构列表 / 机构详情
- 体检套餐列表 / 套餐详情（加项、选机构）
- 创建预约（选体检人、选时间）
- 我的预约列表（待体检 / 已体检 / 已取消）+ 预约详情
- 我的报告列表 / 报告详情（逐项结果展示）
- 体检人管理（添加/删除家庭成员）
- 咨询医生页面
- 个人中心
- 顶部中英文切换

### 后台管理（PC 版）
- 管理员登录
- 仪表盘概览
- 机构管理（增删改查）
- 套餐管理（增删改查）
- 体检项管理（增删改查）
- 订单管理 + 状态更新
- 体检人列表
- 管理员账号管理

### API 接口
- 用户认证：账号密码登录、短信验证码登录、微信登录
- 管理员认证：JWT 登录
- 全实体增删改查
- 文件上传
- WebSocket（Socket.IO）实时通信

## 本地开发

```bash
# 1. 启动全部 Docker 服务
cd Health
docker compose -f docker-compose.dev.yml up -d --build

# 2. 或分别启动前端/后端（支持热更新）
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev

# 3. 访问地址
# 前台：http://localhost:8090
# 后端 API：http://localhost:3002/api
# 后台管理：http://localhost:8090/admin
```

## 部署指南

### 构建并部署（AMD64 服务器）

在 Mac (ARM64) 上构建 AMD64 镜像，部署到 Ubuntu 服务器：

```bash
# === 本地（Mac）===
cd Health

# 1. 构建 AMD64 镜像
docker buildx build --platform linux/amd64 -t health-backend:latest -f backend/Dockerfile backend/ --load
docker buildx build --platform linux/amd64 -t health-frontend:latest -f frontend/Dockerfile frontend/ --load

# 2. 导出镜像
docker save health-backend:latest health-frontend:latest | gzip > health-images.tar.gz

# 3. 打包部署文件
tar czf bookhealth-deploy.tar.gz \
  docker-compose.yml \
  bookhealth-api.env \
  database/schema.sql \
  database/seed.sql \
  deploy/nginx-subdomain.conf \
  health-images.tar.gz

# 4. 上传到服务器
scp bookhealth-deploy.tar.gz ubuntu@服务器IP:/home/ubuntu/
```

```bash
# === 服务器（Ubuntu）===
mkdir -p /home/ubuntu/BookHealth && cd /home/ubuntu/BookHealth
tar xzf /home/ubuntu/bookhealth-deploy.tar.gz

# 修改环境变量密码
vi bookhealth-api.env

# 加载镜像
docker load -i health-images.tar.gz
docker pull postgres:16-alpine

# 启动服务
docker compose up -d

# 导入种子数据
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql

# 验证
docker compose ps
curl http://127.0.0.1:8090
curl http://127.0.0.1:3002/api/packages
```

### 只更新前端

不需要重新上传整个包：

```bash
# 本地
docker buildx build --platform linux/amd64 -t health-frontend:latest -f frontend/Dockerfile frontend/ --load
docker save health-frontend:latest | gzip > health-frontend.tar.gz
scp health-frontend.tar.gz ubuntu@服务器IP:/home/ubuntu/BookHealth/

# 服务器
cd /home/ubuntu/BookHealth
docker load -i health-frontend.tar.gz
docker compose up -d frontend
rm health-frontend.tar.gz
```

### 只更新后端

```bash
# 本地
docker buildx build --platform linux/amd64 -t health-backend:latest -f backend/Dockerfile backend/ --load
docker save health-backend:latest | gzip > health-backend.tar.gz
scp health-backend.tar.gz ubuntu@服务器IP:/home/ubuntu/BookHealth/

# 服务器
cd /home/ubuntu/BookHealth
docker load -i health-backend.tar.gz
docker compose up -d backend
rm health-backend.tar.gz
```

## 端口分配

| 服务               | 端口  | 说明                        |
|--------------------|-------|----------------------------|
| 服务器系统 Nginx   | 80    | 已有网站 + BookHealth 二级域名 |
| 前端（Docker）     | 8090  | Nginx 提供前端静态文件        |
| 后端（Docker）     | 3002  | Express API 服务             |
| PostgreSQL（Docker）| 5434 | 数据库（内部，不对外暴露）     |

## 测试账号

| 类型     | 用户名 | 密码     | 访问路径               |
|----------|--------|----------|----------------------|
| 前台用户 | test01 | 123456  | /（首页）              |
| 后台管理员| test01 | 123456  | /admin（后台管理）     |

## Nginx 二级域名配置

将 `deploy/nginx-subdomain.conf` 部署到服务器系统 Nginx：

```bash
sudo cp deploy/nginx-subdomain.conf /etc/nginx/sites-available/bookhealth.conf
sudo vi /etc/nginx/sites-available/bookhealth.conf
# 把 health.your-domain.com 替换成你的真实域名
sudo ln -sf /etc/nginx/sites-available/bookhealth.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 配置 HTTPS（可选）
sudo certbot --nginx -d health.your-domain.com
```

## 运维命令

```bash
cd /home/ubuntu/BookHealth

# 查看日志
docker compose logs -f backend       # 后端日志
docker compose logs -f frontend      # Nginx 日志
docker compose logs -f db            # 数据库日志

# 重启服务
docker compose restart backend
docker compose restart frontend

# 进入数据库
docker compose exec db psql -U postgres -d bookhealth

# 备份数据库
docker compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T db psql -U postgres -d bookhealth < backup.sql

# 重新初始化数据库（警告：会清空所有数据）
docker compose down -v
docker compose up -d
docker compose exec -T db psql -U postgres -d bookhealth < database/seed.sql
```

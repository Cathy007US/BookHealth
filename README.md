# BookHealth 体检预约系统

基于 React + TypeScript + TailwindCSS 的移动端体检预约平台。

## 项目结构

```
Health/
├── database/          # PostgreSQL 建表脚本
│   └── schema.sql
├── backend/           # Express + TypeScript 后端
│   ├── src/
│   │   ├── config/    # 数据库、Socket.IO、环境配置
│   │   ├── middleware/ # JWT认证、文件上传
│   │   ├── routes/    # API 路由
│   │   ├── utils/     # 工具函数
│   │   └── index.ts   # 入口
│   ├── Dockerfile
│   └── package.json
├── frontend/          # Vite + React + TS 前端
│   ├── src/
│   │   ├── api/       # API 客户端
│   │   ├── components/# 通用组件
│   │   ├── pages/     # 页面
│   │   ├── store/     # Zustand 状态管理
│   │   └── styles/    # 全局样式
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── deploy/            # 部署配置
│   └── nginx-ssl.conf
├── docker-compose.yml
└── .env.docker
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React + TypeScript + TailwindCSS + React Router + socket.io-client |
| 后端 | Express + TypeScript + PostgreSQL + pg + JWT + bcrypt + zod + multer + socket.io |
| 部署 | Docker + Nginx + HTTPS (Let's Encrypt) + 腾讯云轻量服务器 |

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户 |
| admins | 管理员 |
| provinces / cities | 省市 |
| institutions | 体检机构 |
| exam_items | 体检项 |
| package_categories | 套餐分类 |
| packages | 体检套餐 |
| package_items | 套餐-体检项关联 |
| package_institutions | 套餐-机构关联 |
| addon_packages | 加项包 |
| examinees | 体检人 |
| orders | 订单/预约 |
| order_addons | 订单加项 |
| reports | 体检报告 |
| report_items | 报告项目明细 |
| standard_metrics | 标准指标 |
| institution_metrics | 机构指标映射 |
| sms_codes | 短信验证码 |
| doctors | 医生 |
| consultations | 咨询记录 |

## 快速开始

### 1. Docker 部署（推荐）

```bash
cp .env.docker .env.docker.local
# 编辑 .env.docker.local 修改密码和密钥
docker-compose up -d
```

访问 http://localhost

### 2. 本地开发

```bash
# 后端
cd backend && npm install && npm run migrate && npm run dev

# 前端
cd frontend && npm install && npm run dev
```

## 页面清单

- 首页（推荐机构、推荐套餐、分类入口）
- 体检机构列表 / 机构详情
- 体检套餐列表 / 套餐详情（加项、选机构）
- 创建预约（选体检人、选时间）
- 我的预约列表 / 预约详情
- 我的报告列表 / 报告详情
- 体检人管理
- 报告解读/医生咨询
- 个人中心
- 管理后台 API（机构/体检项/套餐/指标/预约/管理员 CRUD）

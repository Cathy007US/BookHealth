#!/bin/bash
# ============================================================
# BookHealth 本地构建 AMD64 镜像脚本
# 在 Mac (ARM64) 上构建 linux/amd64 镜像，直接传到服务器使用
# ============================================================

set -e

echo ">>> 构建 health-backend (linux/amd64)..."
docker buildx build --platform linux/amd64 \
  -t health-backend:latest \
  -f backend/Dockerfile \
  backend/ \
  --load

echo ">>> 构建 health-frontend (linux/amd64)..."
docker buildx build --platform linux/amd64 \
  -t health-frontend:latest \
  -f frontend/Dockerfile \
  frontend/ \
  --load

echo ">>> 导出镜像..."
docker save health-backend:latest health-frontend:latest | gzip > health-images.tar.gz

echo ">>> 打包部署文件..."
tar czf bookhealth-deploy.tar.gz \
  docker-compose.yml \
  bookhealth-api.env \
  database/schema.sql \
  deploy/nginx-subdomain.conf \
  health-images.tar.gz

echo ">>> 完成！"
echo "文件："
ls -lh bookhealth-deploy.tar.gz health-images.tar.gz
echo ""
echo "上传到服务器："
echo "  scp bookhealth-deploy.tar.gz ubuntu@服务器IP:/home/ubuntu/"

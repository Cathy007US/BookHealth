# BookHealth 体检预约系统 — 完整部署流程

## 项目信息
- GitHub仓库：https://github.com/Cathy007US/BookHealth.git
- 技术栈：Vite+React+TS / Express+TS / PostgreSQL 16 / Docker Compose
- 二级域名部署，与服务器已有网站共存

---

## 端口分配

| 服务            | 端口  | 说明                        |
|----------------|-------|----------------------------|
| 服务器系统 Nginx | 80    | 已有网站 + BookHealth 二级域名 |
| BookHealth 前端 | 8090  | Docker 内部 Nginx            |
| BookHealth 后端 | 3001  | Docker 内部 Express          |
| PostgreSQL     | 5434  | Docker 内部，不对外暴露        |

---

## 第一步：本地打包

```bash
cd /Users/Yahan/Desktop/2026items/Health

# 1. 构建镜像（DOCKER_BUILDKIT=0 绕过沙箱限制）
DOCKER_BUILDKIT=0 docker-compose build

# 2. 导出镜像
docker save health-frontend:latest health-backend:latest -o health-images.tar

# 3. 打包部署文件
tar czf bookhealth-deploy.tar.gz \
  docker-compose.yml \
  bookhealth-api.env \
  database/schema.sql \
  frontend/nginx.conf \
  deploy/nginx-subdomain.conf \
  health-images.tar

# 4. 查看文件大小
ls -lh bookhealth-deploy.tar.gz
```

---

## 第二步：上传到服务器

```bash
scp bookhealth-deploy.tar.gz ubuntu@你的服务器IP:/home/ubuntu/
```

---

## 第三步：服务器部署 Docker 服务

```bash
ssh ubuntu@你的服务器IP

# 1. 创建项目目录
mkdir -p /home/ubuntu/BookHealth
cd /home/ubuntu/BookHealth

# 2. 解压
tar xzf /home/ubuntu/bookhealth-deploy.tar.gz

# 3. 修改环境变量（改密码！）
vi bookhealth-api.env
# 把 DB_PASSWORD、JWT_SECRET、ADMIN_JWT_SECRET 改成强密码

# 4. 加载镜像
docker load -i health-images.tar

# 5. 拉取数据库镜像
docker pull postgres:16-alpine

# 6. 启动所有服务
docker-compose up -d

# 7. 验证 Docker 服务是否正常
curl http://127.0.0.1:8090                  # 前端 → 应返回 HTML
curl http://127.0.0.1:3001/api/packages     # 后端 → 应返回 JSON
docker-compose ps                           # 三个容器都应该是 Up 状态
```

---

## 第四步：DNS 解析配置

在你的域名服务商（阿里云/腾讯云/Cloudflare等）添加解析记录：

```
类型:       A
主机记录:   health
记录值:     你的服务器IP
TTL:        600
```

等待 DNS 生效（通常几分钟到十几分钟）：

```bash
# 验证 DNS 是否生效
ping health.你的域名.com
# 应该返回你的服务器IP
```

---

## 第五步：配置系统 Nginx 二级域名

```bash
# 1. 复制配置文件到 Nginx 站点目录
sudo cp /home/ubuntu/BookHealth/deploy/nginx-subdomain.conf \
  /etc/nginx/sites-available/bookhealth.conf

# 2. 编辑配置，把 your-domain.com 改成你的真实域名
sudo vi /etc/nginx/sites-available/bookhealth.conf
# 全局替换：health.your-domain.com → health.你的真实域名.com

# 3. 启用站点（创建软链接）
sudo ln -s /etc/nginx/sites-available/bookhealth.conf \
  /etc/nginx/sites-enabled/

# 4. 测试 Nginx 配置语法
sudo nginx -t
# 应输出: configuration file ... test is successful

# 5. 重载 Nginx
sudo systemctl reload nginx

# 6. 验证二级域名访问
curl http://health.你的域名.com
# 应返回前端 HTML
```

---

## 第六步（可选）：配置 HTTPS

```bash
# 1. 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. 申请 SSL 证书（自动修改 Nginx 配置）
sudo certbot --nginx -d health.你的域名.com

# 3. 如果 certbot 没有自动修改配置，手动切换：
sudo vi /etc/nginx/sites-available/bookhealth.conf
# 注释掉 HTTP 版本的 server 块
# 取消 HTTPS 版本 server 块的注释

# 4. 重载
sudo nginx -t && sudo systemctl reload nginx

# 5. 验证
curl https://health.你的域名.com
```

---

## 第七步：最终验证

```bash
# 1. Docker 容器状态
docker-compose ps

# 2. 前端访问
curl -I http://health.你的域名.com       # HTTP 200

# 3. 后端 API
curl http://health.你的域名.com/api/packages  # 返回 JSON

# 4. 浏览器访问
# 前台：http://health.你的域名.com
# 后台：http://health.你的域名.com/admin
# 前台登录：test01 / 123456
# 后台登录：test01 / 123456
```

---

## 常用运维命令

```bash
cd /home/ubuntu/BookHealth

# 查看日志
docker-compose logs -f backend       # 后端日志
docker-compose logs -f frontend      # Nginx 日志
docker-compose logs -f db            # 数据库日志

# 重启服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db

# 停止/启动所有
docker-compose down
docker-compose up -d

# 更新代码后重新部署
docker-compose down
# 本地重新 build → save → 上传 → load
docker-compose up -d

# 进入数据库
docker-compose exec db psql -U postgres -d bookhealth

# 备份数据库
docker-compose exec db pg_dump -U postgres bookhealth > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T db psql -U postgres -d bookhealth < backup_20260101.sql

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 注意事项

1. **bookhealth-api.env 文件** — 服务器上保持这个名字，docker-compose.yml 中通过 env_file 引用，Docker Compose 启动时自动读取
2. **修改密码** — 部署前务必修改 bookhealth-api.env 中的三个默认密码
3. **DNS 必须先生效** — 第五步之前确保 DNS 解析已指向服务器
4. **3001 和 8090 端口不对外暴露** — 系统Nginx 在 127.0.0.1 本机代理，外部访问不到，安全组不需要开放
5. **已有网站不受影响** — Nginx 通过 server_name 区分域名，互不干扰
6. **docker-compose.yml 中的 version 字段** — 新版 Docker Compose 会警告 version 已过时，忽略即可
7. **数据库首次初始化** — schema.sql 首次启动自动执行，如需重新初始化需 `docker-compose down -v` 删除 volume 后重启

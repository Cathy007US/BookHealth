# BookHealth 发布流程速查（本地 ↔ 服务器）

> 适用：新版发布架构（代码挂载，不打镜像）。
> 原则：**所有操作都在本地完成**，脚本会自动操作服务器；平时不需要登服务器。

---

## 〇、每天开发的固定节奏

```bash
cd /Users/Yahan/Desktop/2026items/BookHealth

./scripts/dev.sh          # ① 起本地服务（前端 5173 / 后端 3002，热更新）
                          #    本地账号：前台 test01/123456，后台 test01/admin123456
# ② 改代码 → 浏览器 http://localhost:5173 看效果
# ③ 满意后按下面场景发布
```

---

## 一、只改了前端（页面 / 样式 / 图片 / 文案）

**本地：**

```bash
./scripts/deploy.sh frontend     # 构建 → 打包(约300KB) → 上传 → 解压生效
```

看到 `✓ 前端已生效` 即成功。

**服务器：什么都不用做**（静态文件挂载即生效，无需重启容器）。

**验证：** 浏览器打开线上站点，**Cmd+Shift+R 强制刷新**（旧 JS 会被浏览器缓存，不强刷看不到变化）。

---

## 二、只改了后端（接口 / 逻辑 / 中间件）

**本地：**

```bash
./scripts/deploy.sh backend      # tsc 编译 → 上传 dist(约30KB) → 自动重建后端容器 → 健康检查
```

**服务器：什么都不用做**（脚本已自动 `--force-recreate backend`）。

**验证：** `./scripts/deploy.sh status` 里 `backend` 和 `api(read)` 都是 200。

> 注意：后端容器不重建不会加载新代码。脚本已处理；如果你是手动改的服务器文件，记得自己执行
> `docker compose up -d --force-recreate backend`。

---

## 三、前后端都改了

```bash
./scripts/deploy.sh all          # 等于 frontend + backend 各跑一遍
```

---

## 四、改了配置（登录密码 / JWT / 数据库名 / 数据库密码）

**本地：**

```bash
vi bookhealth-api.env            # 所有账号密码都在这一个文件
./scripts/deploy.sh config       # 上传配置 + 自动改库(密码变了执行 ALTER USER) + 重建容器
```

**服务器：什么都不用做。**

规则：
- `ADMIN_PASS` = 后台密码，`APP_PASS` = 前台密码，改文件即生效
- `DB_NAME / DB_USER / DB_PASSWORD` 必须与 `POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD` **成对一致**，脚本会校验，不一致直接拦截（防 502）
- `POSTGRES_*` 只在数据卷首次创建时生效，之后改密码必须走 config（脚本自动 ALTER USER）

---

## 五、改了数据库表结构（新增了 .sql 迁移文件）

```bash
./scripts/deploy.sh sql database/xxx.sql
# 库名/用户自动从 env 读取；执行前建议先备份：
# docker compose exec -T db pg_dump -U postgres bookhealth > backup.sql
```

---

## 六、发布后验证（两分钟标准流程）

```bash
./scripts/deploy.sh status       # 四项全过 = 整条链路健康
# frontend: 200  backend: 200  api(read): 200  db: ok
```

 deeper 核对（可选）：

```bash
# 前端版本核对：本地发布时记下「构建版本戳」，服务器上 curl 对比
./scripts/deploy.sh ssh
grep -o 'build-version[^>]*' ~/BookHealth/runtime/frontend/index.html   # 磁盘版本
curl -s http://127.0.0.1:8090/ | grep -o 'build-version[^>]*'           # 实际服务版本
docker ps    # frontend 的 IMAGE 必须是 nginx:alpine（不是就是旧容器）

# 后端代码核对：有输出 = 支持环境账号登录的新代码
docker compose exec backend grep -c APP_USER /app/dist/routes/auth.js
```

---

## 七、故障速查表

| 症状 | 原因 | 处理 |
|------|------|------|
| 页面样式/文案没变 | 浏览器缓存 | Cmd+Shift+R 或无痕窗口 |
| curl 页面 JS hash 与本地不一致 | 旧容器占 8090（`docker ps` 里 IMAGE 不是 nginx:alpine） | `docker rm -f 旧容器` → `docker compose up -d --force-recreate frontend` |
| 接口 502 | 库名/密码不一致，或 backend 没重建 | `./scripts/deploy.sh config` |
| 登录 test01/123456 失败 | 后端是旧代码 / env 没同步 | `deploy.sh backend` + `deploy.sh config` |
| status 某项非 200 | 看日志 | `./scripts/deploy.sh logs backend` |
| 服务器磁盘紧张 | 旧镜像/旧 tar 包 | `docker rmi health-frontend:latest`、删 *.tar.gz |

---

## 八、万不得已：全量覆盖

怀疑服务器状态混乱时，一次性对齐本地与服务器：

```bash
./scripts/deploy.sh init         # 覆盖 compose/nginx.conf/前后端产物/SQL 并重启全部容器
./scripts/deploy.sh config       # env 文件单独同步（init 不会覆盖它，防冲掉线上密码）
./scripts/deploy.sh status
```

---

## 九、手动模式（不用脚本，本地构建 + scp + 服务器手敲）

> 脚本失效或想手动控制时用。每行都可独立复制执行。

**发前端：**

```bash
# 本地（2 条）
cd frontend && npm run build && COPYFILE_DISABLE=1 tar czf /tmp/fe.tgz -C dist . && scp /tmp/fe.tgz ubuntu@82.157.190.184:/tmp/
# 服务器（ssh 上去后，2 条）
cd ~/BookHealth/runtime/frontend && rm -rf assets.old && mv assets assets.old 2>/dev/null; tar xzf /tmp/fe.tgz && rm /tmp/fe.tgz
```

**发后端：**

```bash
# 本地（1 条）
cd backend && ./node_modules/.bin/tsc -p tsconfig.json && COPYFILE_DISABLE=1 tar czf /tmp/be.tgz -C . dist && scp /tmp/be.tgz ubuntu@82.157.190.184:/tmp/
# 服务器（2 条）
tar xzf /tmp/be.tgz -C ~/BookHealth/runtime/backend && rm /tmp/be.tgz
cd ~/BookHealth && docker compose up -d --force-recreate backend
```

**同步配置：**

```bash
# 本地（1 条）
scp bookhealth-api.env ubuntu@82.157.190.184:~/BookHealth/
# 服务器（1 条）
cd ~/BookHealth && docker compose up -d --force-recreate backend
```

**手动模式验证：** 服务器上 `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/` 和 `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3002/api/packages` 都是 200。

---

## 命令总表

| 想做什么 | 在哪里执行 | 命令 |
|---|---|---|
| 本地开发 | 本地 | `./scripts/dev.sh` |
| 发前端 | 本地 | `./scripts/deploy.sh frontend` |
| 发后端 | 本地 | `./scripts/deploy.sh backend` |
| 都发 | 本地 | `./scripts/deploy.sh all` |
| 改密码/配置/库 | 本地 | 改 `bookhealth-api.env` → `./scripts/deploy.sh config` |
| 执行 SQL | 本地 | `./scripts/deploy.sh sql database/xxx.sql` |
| 看健康 | 本地 | `./scripts/deploy.sh status` |
| 看日志 | 本地 | `./scripts/deploy.sh logs backend` |
| 上服务器查看 | 本地→服务器 | `./scripts/deploy.sh ssh`（`exit` 回来） |
| 全量覆盖 | 本地 | `./scripts/deploy.sh init` |

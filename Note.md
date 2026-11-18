## 本地

./scripts/dev.sh          # ① 起本地服务（前端 5173 / 后端 3002，热更新）
                          #    本地账号：
② 改代码 → 浏览器 http://localhost:5173 看效果
③ 满意后按下面场景发布
## 只改了前端
./scripts/deploy.sh frontend     # 构建 → 打包(约300KB) → 上传 → 解压生效
服务器：什么都不用做（静态文件挂载即生效，无需重启容器）。

## 只改了后端（接口 / 逻辑 / 中间件）
./scripts/deploy.sh backend      # tsc 编译 → 上传 dist(约30KB) → 自动重建后端容器 → 健康检查
服务器：什么都不用做（脚本已自动 --force-recreate backend）。
注意：后端容器不重建不会加载新代码。脚本已处理；如果你是手动改的服务器文件，记得自己执行
docker compose up -d --force-recreate backend。

## 前后端都改
vi bookhealth-api.env            # 所有账号密码都在这一个文件
./scripts/deploy.sh config       # 上传配置 + 自动改库(密码变了执行 ALTER USER) + 重建容器
服务器：什么都不用做。
规则：
- ADMIN_PASS = 后台密码，APP_PASS = 前台密码，改文件即生效
- DB_NAME / DB_USER / DB_PASSWORD 必须与 POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD 成对一致，脚本会校验，不一致直接拦截（防 502）
- POSTGRES_* 只在数据卷首次创建时生效，之后改密码必须走 config（脚本自动 ALTER USER）
## 改了数据库表结构（新增了 .sql 迁移文件）
./scripts/deploy.sh status       # 四项全过 = 整条链路健康
Cmd+Shift+R 或无痕窗口

## 万不得已：全量覆盖
怀疑服务器状态混乱时，一次性对齐本地与服务器：
./scripts/deploy.sh init         # 覆盖 compose/nginx.conf/前后端产物/SQL 并重启全部容器
./scripts/deploy.sh config       # env 文件单独同步（init 不会覆盖它，防冲掉线上密码）
./scripts/deploy.sh status

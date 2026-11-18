#!/bin/bash
# ============================================================
# 旧版脚本（构建 AMD64 镜像 + 打整包）
#
# 已废弃：新流程改为「小包发布」，前端只传静态文件、后端只传 dist，
# 不再需要跨平台构建镜像，也不需要 docker save 几百 MB 的包。
#
# 现在请用：
#   ./scripts/deploy.sh frontend    # 只改了前端
#   ./scripts/deploy.sh backend     # 只改了后端
#   ./scripts/deploy.sh all         # 都改了
#   ./scripts/deploy.sh init        # 首次部署
#
# 本文件保留仅为兼容旧习惯，等价于把参数转给 scripts/deploy.sh
# ============================================================
exec "$(cd "$(dirname "$0")" && pwd)/scripts/deploy.sh" "$@"

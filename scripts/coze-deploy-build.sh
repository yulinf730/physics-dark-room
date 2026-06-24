#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录（scripts/ 的上一级）
# 使用绝对路径确保在任何执行环境下都能正确解析
SCRIPT_PATH="$(readlink -f "$0")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 静态网页项目无需构建，仅确认入口文件存在
if [[ ! -f "index.html" ]]; then
    echo "Error: index.html not found"
    exit 1
fi

# 自动更新 index.html 中 game.js 和 style.css 的版本号为当前时间戳
# 确保每次部署后 CDN 缓存失效，用户立即获得最新版本
TS=$(date +%s)
sed -i.bak "s/game\.js?v=[0-9]*/game.js?v=${TS}/g" index.html
sed -i.bak "s/style\.css?v=[0-9]*/style.css?v=${TS}/g" index.html
rm -f index.html.bak
echo "Cache-bust: game.js?v=${TS} and style.css?v=${TS}"

echo "Deploy build check passed"

#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录（scripts/ 的上一级）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 静态网页项目无需构建，仅确认入口文件存在
if [[ ! -f "index.html" ]]; then
    echo "Error: index.html not found"
    exit 1
fi

echo "Deploy build check passed"

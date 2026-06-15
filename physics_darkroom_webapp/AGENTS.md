# 项目概述
物理暗室 / Physics Dark Room - 一个双语气互动物理历史文字游戏网页版

## 技术栈
- 纯前端静态网页（HTML + CSS + JavaScript）
- 无需后端框架
- 使用浏览器 localStorage 保存进度

## 目录结构
```
physics_darkroom_webapp/
├── index.html      # 网页结构入口
├── style.css       # 网页样式
├── game.js         # 游戏数据和逻辑
├── scripts/         # 预览和部署脚本
└── .coze           # 子项目配置
```

## 关键入口 / 核心模块
- **入口文件**：`index.html`
- **游戏逻辑**：`game.js`（包含剧情、选项和状态系统）

## 运行与预览
- **本地预览**：直接双击 `index.html` 或运行 `python3 -m http.server 5000`
- **部署预览**：使用 `scripts/coze-preview-run.sh` 启动 5000 端口服务

## 用户偏好与长期约束
- 静态网页项目，无构建步骤
- 预览和部署使用 Python 静态文件服务器
- 端口固定为 5000

## 常见问题和预防
- 进度保存在浏览器 localStorage，换浏览器或清除数据后进度丢失

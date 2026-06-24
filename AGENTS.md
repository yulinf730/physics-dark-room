# 项目概述
物理暗室 / Physics Dark Room - 双语气互动物理历史文字游戏

## 技术栈
- 纯前端静态网页（HTML + CSS + JavaScript）
- Python HTTP 服务器（预览/部署共用）
- localStorage 进度保存

## 目录结构
```
/workspace/projects/                          # 工作区根目录
├── .coze                                      # 根 .coze（平台唯一读取入口）
└── physics_darkroom_webapp/                   # 技术项目根目录
    ├── index.html                              # 网页结构入口
    ├── style.css                               # 网页样式
    ├── game.js                                 # 游戏逻辑
    ├── scripts/                                # 预览/部署脚本
    └── .coze                                  # 子项目 .coze
```

## 关键入口 / 核心模块
- **入口文件**：`index.html`
- **游戏逻辑**：`game.js`

## 预览与部署
- **预览端口**：5000
- **部署服务**：Python HTTP 服务器（端口 5000）
- **无需构建**：静态网页项目，预览和部署的 build 脚本仅验证文件存在

## 常见问题
- 进度保存在浏览器 localStorage，换浏览器或清除数据后进度丢失

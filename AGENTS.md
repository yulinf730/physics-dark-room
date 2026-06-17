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
└── projects3_temp/
    └── physics_darkroom_webapp/               # 技术项目根目录
        ├── index.html                          # 网页结构入口
        ├── style.css                           # 网页样式
        ├── game.js                             # 游戏逻辑
        ├── scripts/                            # 预览/部署脚本
        │   ├── coze-preview-build.sh
        │   ├── coze-preview-run.sh
        │   ├── coze-deploy-build.sh
        │   ├── coze-deploy-run.sh
        │   └── preview_server.py              # Python 无缓存预览服务器
        └── .coze                              # 子项目 .coze
```

## 项目结构说明
- **工作区根目录**：`/workspace/projects`
- **技术项目根目录**：`/workspace/projects/projects3_temp/physics_darkroom_webapp`
- **根 `.coze`**：位于 `/workspace/projects/.coze`，是平台实际读取的入口
- **子项目 `.coze`**：位于 `projects3_temp/physics_darkroom_webapp/.coze`，仅用于记录子项目元信息

## 关键入口 / 核心模块
- **入口文件**：`index.html`
- **游戏逻辑**：`game.js`（包含剧情、选项和状态系统）

## 预览与部署
- **预览端口**：5000
- **预览服务**：Python 静态文件服务器（无缓存头）
- **部署服务**：Python HTTP 服务器（端口 5000）
- **无需构建**：静态网页项目，预览和部署的 build 脚本仅验证文件存在

## 根 .coze 与子项目 .coze 的映射关系
- 根 `.coze` 的 `[subprojects].path` 注册为 `["projects 3/physics_darkroom_webapp"]`
- 根 `.coze` 的 `[dev]` 和 `[deploy]` 命令指向子项目脚本，脚本内部会自行定位到正确目录
- 两个 `.coze` 的 `project_type` 均为 `web`，`preview_enable` 均为 `enabled`

## 资源系统（游戏核心机制）
- **精力（energy）**：每行动消耗1，精力为0时强制休息恢复
- **手稿（notes）**：通过实验获取，用于提出理论
- **灵感（insight）**：休息事件获取，影响选项解锁
- **困惑（doubt）**：误解增加，实验减少

## 常见问题和预防
- 进度保存在浏览器 localStorage，换浏览器或清除数据后进度丢失
- 端口固定为 5000，脚本会自动清理残留进程

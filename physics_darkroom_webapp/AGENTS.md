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

## 资源系统
游戏有4个核心资源：
- **精力（energy）**：每行动消耗1，理论消耗2；精力为0时强制休息恢复。每章结束后精力上限+2并完全恢复。
- **手稿（notes）**：通过实验获取，用于提出理论。
- **灵感（insight）**：休息事件中获取。高灵感（≥2）可解锁灵感不足的选项；高灵感（≥3）+高困惑（≥5）触发"灵光乍现"特殊选项。
- **困惑（doubt）**：误解增加困惑，实验减少困惑。高困惑（≥5）+低灵感（<2）时所有操作被锁定。

## 灵感解锁与灵光乍现机制
- `isInsightBlocked()`：实验选项若 requires 中包含 insight 要求但当前 insight 不足，显示为锁定状态（而非隐藏）。
- 灵光乍现：困惑≥5 且灵感≥3 时，"将困惑化为方向"选项出现，执行后困惑-2、灵感+2。

## 休息事件机制
20种休息方式各有3个随机效果（概率权重），每个效果包含精力恢复量、灵感变化和困惑变化。精力为0时从REST_OPTIONS中随机抽取一个效果执行。

## 章节推进
每提出一个理论后，`s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy`，并切换到下一章。共20章+结局。

## 常见问题和预防
- 进度保存在浏览器 localStorage，换浏览器或清除数据后进度丢失
- 资源系统常量定义在 game.js 顶部（BASE_MAX_ENERGY、ENERGY_PER_CHAPTER 等）

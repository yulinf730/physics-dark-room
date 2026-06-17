# 物理暗室 / Physics Dark Room - Web App

这是从微信小程序版本转换出来的静态网页版本。

## 本地打开

直接双击 `index.html` 即可运行。

如果浏览器因为本地文件限制出现问题，可以在本文件夹里运行：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

## 发布到网页

可以直接把整个文件夹上传到：

- Vercel
- Netlify
- GitHub Pages
- 自己的网站服务器

入口文件是 `index.html`。

## 文件说明

- `index.html`：网页结构
- `style.css`：网页样式
- `game.js`：游戏数据和逻辑，包含从小程序转换来的剧情、选项和状态系统

## 保存进度

网页版使用浏览器 `localStorage` 保存进度。换浏览器或清除浏览器数据后，进度会丢失。

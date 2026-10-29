# Chor Chioée 网站 — 本地使用说明

## 打开项目

在 Nova 里 **File → Open**，选择 `Chor-Chioee-Website-Nova` 文件夹。

## 启动本地预览

双击项目里的 `START.command`，或在终端执行：

```bash
npm install
npm run dev
```

启动后：

- 官网：`http://localhost:4173`
- 管理后台：`http://localhost:4173/admin`（初始密码 `chorchioee`，登录后请立刻修改）

同一局域网内的其它设备可以用 `http://你的电脑局域网IP:4173` 访问。

请不要同时在 Nova 和 `START.command` 里启动服务器，否则端口会被占用。

## 内容改哪里

**日常改文案、换图、上下架产品，全部在后台点，不用动代码。**

需要动代码的只有这些：

- 页面结构与排版：`app/site-view.tsx`
- 样式、手机端布局与动效：`app/globals.css`
- 后台界面：`app/admin/`
- 数据结构与初始内容：`lib/db.ts`、`lib/seed.ts`

## 内容存在哪里

```
data/
  content.db      内容数据库（SQLite）
  uploads/        后台上传的图片和视频
```

这个目录不要提交到 Git，也不要在部署时覆盖，单独备份即可。想把内容恢复成出厂状态，删掉 `data/` 重新启动就会重新灌一遍初始内容。

## 生产构建

```bash
npm run build
npm run start
```

服务器部署见 `部署说明.md`。

## 注意

- `node_modules` 未包含在压缩包里，首次启动会自动下载依赖。
- 图片与视频资源已全部包含。
- 当前版本包含中英法三语切换、手机端横向滑动、菜单、滚动与视差效果，以及完整的管理后台。

# WhyL

面向个人摄影与旅行记录的 Hexo 主题。首页由代表作品、相册分类和作者介绍组成，支持图文、照片组和原生视频播放。

## 本地预览

主题与照片站放在同一个父目录：

```text
GitHub/
  hexo-theme-whyl/
  photo.naaln.com/
```

在主题目录运行（Node.js 22 或更高版本）：

```sh
npm ci
npm run preview
```

打开 http://127.0.0.1:4000。预览读取旁边照片站的实际文章，在本主题的 `.preview/` 生成页面，不修改照片站。可以通过 `WHYL_SITE` 指定其他 Hexo 内容目录，通过 `PORT` 指定端口。

```sh
npm run build:preview
npm test
```

构建结果位于 `.preview/public/`。预览工具使用当前 Hexo 与 EJS/Markdown 渲染插件；不需要安装旧站的部署依赖，也不会触发部署。

## 在 Hexo 站点使用

将此主题放到站点的 `themes/WhyL/`，在站点 `_config.yml` 中设置 `theme: WhyL`。需要 `hexo-renderer-ejs`，正文使用 Markdown 时需要 `hexo-renderer-marked`；主题使用普通 CSS，无需 Stylus、jQuery 或视频播放器 CDN。页面模板以 Hexo 8 构建验证。

站点可以通过 `_config.WhyL.yml` 覆盖主题配置：

```yaml
gallery:
  title: 人生若如初見
  description: 旅行、日常，以及值得记住的瞬间。
  about: 用照片留住走过的地方。
menu:
  Home: /
  Photo: /categories/photo/
  Video: /categories/video/
  Archives: /archives/
  Profile: true
  Instagram: true
social:
  home: https://naaln.com
  instagram: https://www.instagram.com/why_liam
```

`Profile: true` 链接到首页作者介绍；`Instagram: true` 链接到 `social.instagram`。旧的客户端 Instagram API 不再加载。统计与 Disqus 保留为可选集成。

## 相册内容

兼容现有 `photos` URL 数组。设置 `featured: true` 可在当前首页分页内优先选作封面；默认选择当前页第一篇带照片的非视频文章。若没有照片文章则使用视频封面。

```yaml
title: 旅途中的山谷
date: 2026-11-14
categories:
  - photo
tags:
  - 山谷
featured: true
photos:
  - src: /images/valley.jpg
    alt: 黄昏时分的山谷
    width: 2400
    height: 1600
    position: 45% 60%
  - /images/river.jpg
---
正文写在这里。
```

可选 `cover` 指定列表封面，格式为 URL 或 `{src, alt, position}`。`position` 使用两个百分比，控制首页和缩略图裁切焦点；大图显示完整照片。填写真实宽高可为照片预留空间。没有照片的文章以标题封面显示。

视频延续原站的格式：

```yaml
photos:
  - https://example.com/trip.mp4
  - https://example.com/poster.jpg
```

原站 `pics.naaln.com` 和 `video.naaln.com` 的 HTTP 媒体链接会在主题中升级为 HTTPS，原文不变。其他域名使用内容提供的协议。

点击照片可查看大图，支持左右方向键、Esc、手机横向滑动；关闭后回到原位置。无 JavaScript 时，照片仍可直接打开，导航与相册链接正常工作。

界面采用 liquid glass 玻璃导航、照片上的浮动控件与柔和环境光。支持原生跨文档页面过渡，未支持的浏览器使用淡出/淡入回退；看图开合、切图和菜单展开有过渡。系统启用减少动态效果时关闭这些动画。

视觉原则见 [DESIGN.md](DESIGN.md)。旧版界面截图保留在 `image/`，不代表当前版本。

MIT License.

## Glasswork 材质与折射

本主题使用 [Glasswork](https://github.com/kubai087/glasswork) 的本地源码：材质只调整背景、背景滤镜、阴影和文字颜色，不改变既有尺寸、圆角、字体、图标及文案。来源和改动见 `source/js/vendor/glasswork/UPSTREAM.md`，MIT 许可证和 NOTICE 随代码保留，不包含其壁纸素材。

- 首页胶囊、全站滚动导航、照片标记和看图按钮使用材质；图片外文字、相册卡片、分类栏不新增玻璃。导航始终使用同一套 Glasswork 材质，照片进入其背后时按实际覆盖面积连续取样，不在图片边缘切换两套玻璃。
- Chromium 使用 `lens.mjs` 的 SVG 背景折射。小于 32px 的照片标记按上游限制只使用 CSS 材质。
- 首页胶囊在非 SVG 路径使用 `refract.mjs` WebGL2 回退，继续按原照片裁切焦点对齐；不支持 WebGL2 时保留 CSS 材质。导航在非 Chromium 下不模拟任意 DOM 背景折射。
- `adapt.mjs` 负责背景采样与文字选择，主题另外检查采样像素经色调处理后的对比度，调整最小色层以达到 4.5:1。有图片时自动选择浅／深材质，主题没有新增外观切换按钮；无可读背景时采用系统外观默认材质。
- 图片取样需 CORS；请求失败时使用默认材质。减少透明度时使用实色并关闭折射，玻璃表面使用 `corner-shape: round`。

本地光学验收页：

```sh
npm run build:preview
node tools/glass-fixture.js
npm run preview
```

打开 `http://127.0.0.1:4000/_glass-test/`。`?renderer=webgl` 强制验证 WebGL 路径，`?no-webgl` 检查 WebGL 不可用回退，`?broken` 检查图片失败。重新构建会清除验收页。浏览器覆盖与本次文件清单分别见 [VALIDATION.md](VALIDATION.md)、[GLASSWORK_CHANGES.md](GLASSWORK_CHANGES.md)。

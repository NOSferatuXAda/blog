---
title: Build This Blog with Hexo, NexT and GitHub Pages
date: 2026-10-28 11:45:00
categories:
  - 技术
tags:
  - Hexo
  - NexT
  - GitHub Pages
---

这篇文章记录本站的搭建过程，方便以后迁移或重装时对照。

## 技术栈

| 组成 | 说明 |
| --- | --- |
| Hexo 8 | 静态站点生成器 |
| NexT 8 | 博客主题 |
| GitHub Pages | 免费静态托管 |

## 本地写作流程

```bash
# 新建文章
npx hexo new "文章标题"

# 本地预览（http://localhost:4000/blog/）
npx hexo server

# 生成静态文件
npx hexo generate
```

## 部署流程

生成后的 `public/` 目录会由 `hexo-deployer-git` 推送到 GitHub 仓库的 `gh-pages` 分支，GitHub Pages 再从该分支发布站点。

```bash
npx hexo clean && npx hexo deploy
```

## 站点配置要点

- `url` 与 `root` 必须和仓库的访问路径一致，否则 CSS、图片等静态资源会 404。
- 项目仓库的站点根路径是 `/<仓库名>/`，用户主页仓库（`用户名.github.io`）则是 `/`。
- 主题配置集中写在根目录的 `_config.next.yml` 中，升级主题时不会丢失自定义设置。

## 后续计划

1. 增加更多技术笔记与项目记录。
2. 更换头像与站点图标。
3. 按需接入评论系统。

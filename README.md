# Creationism

个人博客源码，基于 **Hexo 8** + **NexT 8** 主题，托管在 GitHub Pages。

- 🌐 线上地址：<https://nosferatuxada.github.io/blog/>
- 📦 仓库：<https://github.com/NOSferatuXAda/blog>
- 🚀 发布方式：源码在 `main` 分支，构建产物由 `hexo-deployer-git` 推送到 `gh-pages` 分支，GitHub Pages 从该分支发布。

## 环境要求

- Node.js 18+（当前使用 Node 24）
- Git

## 常用命令

```bash
# 首次克隆后安装依赖
npm install

# 新建文章（在 source/_posts/ 下生成 Markdown 文件）
npx hexo new "文章标题"

# 本地预览：http://localhost:4000/blog/
npx hexo server

# 仅构建静态文件到 public/
npx hexo generate

# 构建并发布到 GitHub Pages（推送 gh-pages 分支）
npx hexo clean && npx hexo deploy
```

> 在 Windows 上也可以直接运行 `scripts/deploy.ps1` 一键构建并部署。

## 目录说明

| 路径 | 说明 |
| --- | --- |
| `source/_posts/` | 文章（Markdown） |
| `source/about/` `source/tags/` `source/categories/` | 关于 / 标签 / 分类页面 |
| `_config.yml` | Hexo 站点配置（标题、作者、URL、部署目标） |
| `_config.next.yml` | NexT 主题配置（覆盖主题默认值） |
| `scaffolds/` | 新建文章的模板 |
| `public/`、`db.json`、`.deploy_git/` | 构建/部署产物，已被 git 忽略 |

## 配置要点

- `_config.yml` 中 `url: https://nosferatuxada.github.io/blog` 与 `root: /blog/` 必须和仓库访问路径一致，否则 CSS、图片等静态资源会 404。
- 发文时自动按 `permalink: posts/:title/` 生成链接。
- 主题升级不会覆盖 `_config.next.yml` 中的自定义配置。

## 关于网络代理

本机直连 `github.com` 不稳定，但 `api.github.com` 正常。部署时如果 `hexo deploy` 卡住或报连接失败，请先开启 VPN（本机提供 SOCKS5 代理 `127.0.0.1:1080`），然后在 PowerShell 中设置代理后再部署：

```powershell
$env:HTTPS_PROXY = 'socks5h://127.0.0.1:1080'
$env:HTTP_PROXY  = 'socks5h://127.0.0.1:1080'
npx hexo clean; npx hexo deploy
```

`scripts/deploy.ps1` 已内置这一步：

```powershell
# 默认使用 socks5h://127.0.0.1:1080
powershell -File scripts/deploy.ps1

# 代理端口不同可传参
powershell -File scripts/deploy.ps1 -Proxy "socks5h://127.0.0.1:7890"
```

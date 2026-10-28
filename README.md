# Creationism

个人博客源码，基于 **Hexo 8** + **NexT 8** 主题，经深度定制为「黑 / 红 / 灰 / 白 + Surreal 超现实」视觉风格，托管在 GitHub Pages。

- 🌐 线上地址：<https://nosferatuxada.github.io/blog/>
- 📦 仓库：<https://github.com/NOSferatuXAda/blog>
- 📘 完整改造文档：[docs/customize-guide.md](docs/customize-guide.md)（配置 / 页面 / CSS 全量代码 + Butterfly/Fluid 移植说明）
- 🚀 发布方式：源码在 `main` 分支，构建产物由 `hexo-deployer-git` 推送到 `gh-pages` 分支，GitHub Pages 从该分支发布。

## 当前定制内容

- **导航栏**：首页 / 分类 / 关于 / 致谢 四个核心类别。
- **首页**：静态落地页，仅三个展示栏区块，整体居中偏右排列（无文章列表）。
- **分类页**：父级「全部」+ 三个子项占位。
- **关于页**：纯占位页面。
- **致谢页**：用英文、中文、德文、Python、Java、C++ 六种语言表达「感谢」。
- **作者窗口**：侧边栏自定义个人信息卡片（头像、名字、简介、社交链接）。
- **视觉**：黑红灰白配色、锐利几何线条、错位硬阴影、红色几何水印。
- 所有尚未确定的内容统一使用 `unknown` 占位，方便后期精修。

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

> 在 Windows 上也可以直接运行 `tools/deploy.ps1` 一键构建并部署（已内置代理设置）。

## 目录说明

| 路径 | 说明 |
| --- | --- |
| `source/index.md` | 首页（三个展示栏区块） |
| `source/categories/` | 分类页（全部 + 三个 unknown 子项） |
| `source/about/` | 关于页（unknown 占位正文） |
| `source/thanks/` | 致谢页（六种语言代码块） |
| `source/_posts/` | 文章目录（当前已清空，保留 `.gitkeep`） |
| `source/_data/sidebar.njk` | 自定义侧边栏作者窗口 |
| `source/_data/styles.styl` | Surreal 风格样式（红黑配色、几何线条、硬阴影、首页/分类/关于布局） |
| `source/_data/variables.styl` | NexT 主题色板变量覆盖 |
| `source/images/avatar-surreal.gif` | 作者头像（红底白色生物动画 GIF） |
| `_config.yml` | Hexo 站点配置（标题、作者、URL、部署目标） |
| `_config.next.yml` | NexT 主题配置（导航、配色、代码块、自定义注入） |
| `scaffolds/` | 新建文章的模板 |
| `public/`、`db.json`、`.deploy_git/` | 构建/部署产物，已被 git 忽略 |

## 配置要点

- `_config.yml` 中 `url: https://nosferatuxada.github.io/blog` 与 `root: /blog/` 必须和仓库访问路径一致，否则 CSS、图片等静态资源会 404。
- 首页已移除 `hexo-generator-index`，改为静态页面；若以后恢复文章列表首页，可重新安装该插件并删除 `source/index.md` 中的落地页内容。
- 主题风格由 `source/_data/variables.styl`（色板）和 `source/_data/styles.styl`（布局/装饰）共同控制，升级 NexT 不会丢失。
- 作者窗口通过 `custom_file_path.sidebar` 注入，默认作者/统计块已隐藏。

## 关于网络代理

本机直连 `github.com` 不稳定，但 `api.github.com` 正常。部署时如果 `hexo deploy` 卡住或报连接失败，请先开启 VPN（本机提供 SOCKS5 代理 `127.0.0.1:1080`），然后在 PowerShell 中设置代理后再部署：

```powershell
$env:HTTPS_PROXY = 'socks5h://127.0.0.1:1080'
$env:HTTP_PROXY  = 'socks5h://127.0.0.1:1080'
npx hexo clean; npx hexo deploy
```

`tools/deploy.ps1` 已内置这一步：

```powershell
# 默认使用 socks5h://127.0.0.1:1080
powershell -File tools/deploy.ps1

# 代理端口不同可传参
powershell -File tools/deploy.ps1 -Proxy "socks5h://127.0.0.1:7890"
```

# Hexo 博客深度定制造型指南（Surreal 黑红灰白）

> 适用项目：`E:\Creationism`（线上：<https://nosferatuxada.github.io/blog/>）
> 实际技术栈：**Hexo 8 + NexT 8.29.1**，布局方案 `Gemini`
> 本指南中的所有代码均来自当前线上仓库，可直接复制粘贴。

---

## 0. 先说明：主题与"初始状态"的差异

你提到"假设使用 Butterfly 或 Fluid 等主流主题"，但本仓库实际使用的是 **NexT 8**（通过 npm 安装，非 git clone）：

| 项目 | 实际情况 |
| --- | --- |
| 主题 | `hexo-theme-next@8.29.1` |
| 布局方案 | `Gemini`（双栏：左侧边栏 + 右主内容） |
| 文章生成器 | 已移除 `hexo-generator-index`（首页改为静态落地页） |
| 搜索 | `local_search` 已关闭（首页无文章列表，搜索无意义） |
| 动效 | `motion` 已关闭（保持锐利、静态的超现实观感） |
| 自动深色模式 | `darkmode: false`（自定义色板固定为黑红灰白，避免系统深色覆盖） |

**Butterfly / Fluid 的差异与移植方法见第 11 节附录。** 页面 Markdown（关于/致谢/分类/首页）在三种主题下可以 100% 复用；区别主要在配置文件名、CSS 注入方式、作者卡片和首页模板的位置。

---

## 1. 文件总览（本仓库实况）

| 文件路径 | 作用 | 本指南章节 |
| --- | --- | --- |
| `_config.yml` | Hexo 站点配置（标题、作者、URL、部署） | 12 |
| `_config.next.yml` | NexT 主题配置（导航、配色、代码块、自定义注入） | 2、3 |
| `source/_data/variables.styl` | 色板变量覆盖（黑红灰白） | 3.2 |
| `source/_data/styles.styl` | 全部 Surreal 定制样式（布局、几何线条、阴影） | 3.3 |
| `source/_data/sidebar.njk` | 侧边栏作者个人信息卡片（unknown 占位） | 4 |
| `source/index.md` | 首页：三个展示栏（居中偏右） | 5 |
| `source/categories/index.md` | 分类页：全部 + 三个 unknown 子项 | 6 |
| `source/about/index.md` | 关于页：纯 unknown 占位 | 7 |
| `source/thanks/index.md` | 致谢页：六种语言感谢 | 8 |
| `source/images/avatar-surreal.gif` | 作者头像（红底白色生物动画 GIF） | 4.3 |
| `tools/deploy.ps1` | 一键构建 + 部署脚本（内置代理） | 9 |

> ⚠️ 注意：`scripts/` 在 Hexo 里是**脚本插件目录**，Hexo 会把它当插件加载。部署脚本不要放 `scripts/`，本仓库放在 `tools/`。

---

## 2. 模块一：导航与侧边栏重构

### 2.1 目标

把导航菜单改成四个核心类别：**首页 / 分类 / 关于 / 致谢**，并移除归档、标签、搜索入口。

### 2.2 修改 `_config.next.yml`

在 `_config.next.yml` 中把 `menu` 改为（中文键名会直接作为显示文案）：

```yaml
menu:
  首页: / || fa fa-home
  分类: /categories/ || fa fa-layer-group
  关于: /about/ || fa fa-user
  致谢: /thanks/ || fa fa-heart

menu_settings:
  badges: false
  icons: true
```

说明：
- NexT 会执行 `__('menu.' + 键名)`，没有对应 i18n 词条时回退为键名本身，所以直接用中文键名即可。
- `badges: false` 关闭菜单右侧的文章/分类/标签计数角标。
- 需要额外去掉搜索图标时，保持 `local_search.enable: false`（见完整配置）。

### 2.3 删除博客自带的默认日志

NexT / Hexo 默认会带 `source/_posts/hello-world.md`（部分主题还带 `first-post.md` 等）。在本项目根目录执行：

```powershell
# Windows PowerShell：删除 source/_posts 下所有文章
Remove-Item source/_posts/*.md -Force

# 保留目录给以后写文章用（本仓库保留了这个空文件）
New-Item -ItemType File -Path source/_posts/.gitkeep -Force

# 清掉旧构建缓存和产物
npx hexo clean
```

macOS / Linux / Git Bash：

```bash
rm -f source/_posts/*.md
touch source/_posts/.gitkeep
npx hexo clean
```

删除后可选清理（本仓库已做）：

```powershell
# 标签页在四个导航里已不需要，可整页删除（归档页由插件自动生成，删目录即可）
Remove-Item source/tags -Recurse -Force
```

> 删除文章后，`/posts/...`、`/tags/`、`/archives/` 这些旧 URL 在重新部署后会变成 404（已验证）。

### 2.4 侧边栏结构说明

本设计保留 NexT 的左侧边栏（`Gemini` 方案），从上到下依次是：

1. 站点标题 + 副标题（黑底、白字、红下边框）
2. 四项导航菜单
3. 自定义作者信息卡片（第 4 节）

默认的"站点统计 / 作者 / 社交"块通过两处关闭/隐藏：
- 配置：`site_state: false`
- 样式：`source/_data/styles.styl` 中隐藏 `.site-author`、`.site-state-wrap`、`.links-of-author`

---

## 3. 模块二：全局视觉风格（Surreal 黑红灰白）

### 3.1 如何把自定义 CSS 注入 NexT

NexT 通过 `custom_file_path` 提供官方注入点，在 `_config.next.yml` 中配置：

```yaml
custom_file_path:
  variable: source/_data/variables.styl   # 色板变量（在主题变量之后、颜色系统之前加载）
  style: source/_data/styles.styl         # 自定义样式（在所有主题样式之后加载）
  sidebar: source/_data/sidebar.njk       # 作者窗口注入（见第 4 节）
```

加载顺序（决定覆盖能力）：
1. 主题基础变量 → 2. 布局方案变量（Gemini）→ 3. **`variables.styl`** → 4. 主题颜色系统 → 5. 主题全部样式 → 6. **`styles.styl`**

因此：
- 覆盖**颜色变量**写 `variables.styl`（能同时影响主题所有使用该变量的地方）；
- 覆盖**具体组件样式**写 `styles.styl`（直接输出 CSS，优先级更高）。

### 3.2 `source/_data/variables.styl` 完整代码

路径：`source/_data/variables.styl`

```stylus
// ============================================================
// 全局变量覆盖：黑 / 红 / 灰 / 白 —— Surreal 风格
// 该文件在主题变量之后、颜色系统之前加载，
// 因此这里的变量会覆盖 NexT 默认色板。
// ============================================================

// 色板
$surreal-black       = #050505;
$surreal-black-soft  = #0b0b0b;
$surreal-panel       = #121212;
$surreal-line        = #2b2b2b;
$surreal-grey        = #8a8a8a;
$surreal-white       = #f5f5f5;
$surreal-red         = #ff1d1d;
$surreal-red-deep    = #a80c0c;

// 背景
$body-bg-color       = $surreal-black;
$content-bg-color    = $surreal-black-soft;
$card-bg-color       = $surreal-panel;
$menu-item-bg-color  = $surreal-panel;

// 深色模式变量同步为同一套色板，保证任何情况下不出现浅色底
$body-bg-color-dark    = $surreal-black;
$content-bg-color-dark = $surreal-black-soft;
$card-bg-color-dark    = $surreal-panel;
$menu-item-bg-color-dark = $surreal-panel;

// 文字与链接
$text-color            = $surreal-white;
$text-color-dark       = $surreal-white;
$link-color            = $surreal-red;
$link-color-dark       = $surreal-red;
$link-hover-color      = $surreal-white;
$link-hover-color-dark = $surreal-white;
$link-decoration-color = $surreal-red;
$blockquote-color      = $surreal-grey;
$blockquote-color-dark = $surreal-grey;

// 边框与选中态
$border-color         = $surreal-line;
$selection-bg         = $surreal-red;
$selection-color      = $surreal-black;
$selection-bg-dark    = $surreal-red;
$selection-color-dark = $surreal-black;

// 主题色 / 品牌色
$theme-color       = $surreal-red;
$theme-color-dark  = $surreal-red;
$brand-color       = $surreal-white;
$brand-hover-color = $surreal-red;

// 圆角与阴影：取消圆角，具体阴影效果在 styles.styl 中按组件单独定义
$border-radius       = 0;
$border-radius-inner = 0;
$box-shadow          = initial;
$box-shadow-inner    = initial;

// 侧边栏
$sidebar-nav-color         = $surreal-grey;
$sidebar-nav-hover-color   = $surreal-red;
$sidebar-highlight         = $surreal-red;
$site-author-name-color    = $surreal-white;
$site-author-image-width   = 120px;
$site-author-image-border-color = $surreal-red;
$site-description-color    = $surreal-grey;
$site-state-item-name-color = $surreal-grey;

// 代码块
$highlight-background        = #0a0a0a;
$highlight-foreground        = $surreal-white;
$highlight-gutter-background = #0f0f0f;
$highlight-gutter-foreground = #555555;
$highlight-background-dark        = #0a0a0a;
$highlight-foreground-dark        = $surreal-white;
$highlight-gutter-background-dark = #0f0f0f;
$highlight-gutter-foreground-dark = #555555;

// 表格（代码块内部也是 table，避免出现浅色行底）
$table-border-color             = $surreal-line;
$table-cell-border-bottom-color = $surreal-line;
$table-row-odd-bg-color         = transparent;
$table-row-hover-bg-color       = transparent;
$table-row-odd-bg-color-dark    = transparent;
$table-row-hover-bg-color-dark  = transparent;

// 按钮
$btn-default-radius         = 0;
$btn-default-bg             = $surreal-red;
$btn-default-color          = $surreal-black;
$btn-default-border-color   = $surreal-red;
$btn-default-hover-bg       = $surreal-black;
$btn-default-hover-color    = $surreal-white;
$btn-default-hover-border-color = $surreal-red;

// 角标
$badge-background    = $surreal-red;
$badge-border-radius = 0;
$badge-color         = $surreal-black;

```

### 3.3 `source/_data/styles.styl` 完整代码

路径：`source/_data/styles.styl`

```stylus
/* ============================================================
   Surreal 风格定制样式：黑 / 红 / 灰 / 白
   加载于主题样式之后，用于覆盖 NexT 默认视觉
   ============================================================ */

:root {
  --surreal-black: #050505;
  --surreal-black-soft: #0b0b0b;
  --surreal-panel: #121212;
  --surreal-panel-2: #181818;
  --surreal-line: #2b2b2b;
  --surreal-line-light: #3a3a3a;
  --surreal-grey: #8a8a8a;
  --surreal-grey-dark: #5c5c5c;
  --surreal-white: #f5f5f5;
  --surreal-red: #ff1d1d;
  --surreal-red-deep: #a80c0c;
}

/* ---------- 全局骨架 ---------- */

html {
  background: var(--surreal-black);
}

body {
  background-color: var(--surreal-black);
  background-image:
    repeating-linear-gradient(135deg, rgba(255, 29, 29, 0.05) 0, rgba(255, 29, 29, 0.05) 1px, transparent 1px, transparent 110px),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.022) 0, rgba(255, 255, 255, 0.022) 1px, transparent 1px, transparent 160px);
  background-attachment: fixed;
  color: var(--surreal-white);
  letter-spacing: 0.02em;
}

/* 右侧竖向红色几何线，增加超现实感 */
body::after {
  content: "";
  position: fixed;
  top: 0;
  right: 40px;
  z-index: 1;
  width: 1px;
  height: 100vh;
  background: linear-gradient(180deg, transparent 0, var(--surreal-red) 18%, transparent 38%, var(--surreal-red) 72%, transparent 100%);
  opacity: 0.35;
  pointer-events: none;
}

@media (max-width: 991px) {
  body::after {
    display: none;
  }
}

::selection {
  background: var(--surreal-red);
  color: var(--surreal-black);
}

a {
  color: var(--surreal-red);
  text-decoration-color: var(--surreal-red);
  text-underline-offset: 3px;
}

a:hover {
  color: var(--surreal-white);
}

/* 一切皆锐角 */
.main-menu,
.post-block,
.sidebar-inner,
.back-to-top,
.highlight,
pre,
code,
.btn,
input,
textarea,
select {
  border-radius: 0 !important;
}

/* ---------- 顶部头带 ---------- */

.headband {
  height: 3px;
  background: var(--surreal-red);
}

/* ---------- 站点品牌 ---------- */

.site-brand-container {
  background: var(--surreal-black);
  border-bottom: 1px solid var(--surreal-line);
}

.site-meta {
  text-align: left;
  padding: 22px 18px;
  min-width: 0;
}

.site-title,
.site-title a {
  color: var(--surreal-white) !important;
  font-weight: 900;
  font-size: 1.12em;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.site-title a:hover {
  color: var(--surreal-red) !important;
}

.site-subtitle {
  color: var(--surreal-grey);
  font-size: 0.62em;
  letter-spacing: 0.34em;
  margin-top: 10px;
}

.logo-line {
  display: none;
}

.brand {
  display: block;
}

/* ---------- 导航（四个核心类别） ---------- */

.site-nav {
  margin-top: 0;
  border-top: 0;
  border-bottom: 1px solid var(--surreal-line);
}

.main-menu {
  margin: 0;
  padding: 2px 0;
  text-align: left;
}

.main-menu .menu-item {
  margin: 0;
  display: block;
}

.main-menu .menu-item a {
  display: block;
  padding: 9px 16px;
  color: var(--surreal-grey);
  font-size: 0.78em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  border-left: 2px solid transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: none;
}

.main-menu .menu-item:last-child a {
  border-bottom: 0;
}

.main-menu .menu-item a i {
  color: var(--surreal-red);
  margin-right: 10px;
  width: 14px;
}

.main-menu .menu-item a:hover,
.main-menu .menu-item.menu-item-active a {
  color: var(--surreal-white);
  border-left-color: var(--surreal-red);
  background: linear-gradient(90deg, rgba(255, 29, 29, 0.16), transparent 72%);
}

/* ---------- 侧边栏 ---------- */

.sidebar {
  background: transparent;
}

.sidebar-inner {
  background: transparent;
}

.sidebar-nav {
  border-bottom: 1px solid var(--surreal-line);
}

.sidebar-nav li {
  color: var(--surreal-grey);
  letter-spacing: 0.2em;
}

.sidebar-nav li.sidebar-nav-active {
  color: var(--surreal-red);
  border-color: var(--surreal-red);
}

.site-overview-wrap {
  padding: 16px 14px;
}

/* 隐藏 NexT 默认的作者块 / 统计块 / 社交块 */
.site-author,
.site-state-wrap,
.links-of-author {
  display: none !important;
}

/* ---------- 自定义作者窗口 ---------- */

.surreal-author-card {
  position: relative;
  margin: 8px 0 0;
  padding: 14px;
  border: 1px solid var(--surreal-line);
  background: var(--surreal-panel);
  box-shadow: 6px 6px 0 0 rgba(255, 29, 29, 0.22), 6px 6px 0 1px var(--surreal-red);
}

.surreal-author-card::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  width: 38px;
  height: 3px;
  background: var(--surreal-red);
}

.surreal-author-avatar-wrap {
  position: relative;
  border: 1px solid var(--surreal-line);
  overflow: hidden;
}

.surreal-author-avatar {
  display: block;
  width: 100%;
  height: auto;
  filter: contrast(1.05);
}

.surreal-author-corner {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--surreal-red);
  transform: rotate(45deg);
}

.surreal-author-body {
  padding: 14px 2px 2px;
}

.surreal-author-kicker {
  margin: 0;
  color: var(--surreal-red);
  font-size: 0.66em;
  letter-spacing: 0.42em;
  text-transform: uppercase;
}

.surreal-author-name {
  margin: 8px 0 0;
  color: var(--surreal-white);
  font-size: 1.16em;
  font-weight: 900;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.surreal-author-bio {
  margin: 10px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--surreal-line-light);
  color: var(--surreal-grey);
  font-size: 0.78em;
  letter-spacing: 0.22em;
  line-height: 1.9;
  text-transform: uppercase;
}

.surreal-author-social {
  display: block;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--surreal-line);
}

.surreal-author-social li {
  border-bottom: 1px solid var(--surreal-line);
}

.surreal-author-social li:last-child {
  border-bottom: 0;
}

.surreal-author-social a {
  display: block;
  padding: 7px 2px;
  color: var(--surreal-grey);
  font-size: 0.62em;
  letter-spacing: 0.2em;
  text-align: left;
  text-transform: uppercase;
}

.surreal-author-social a:hover {
  color: var(--surreal-black);
  background: var(--surreal-red);
  padding-left: 8px;
}

/* ---------- 页面 / 文章主体 ---------- */

.main-inner {
  padding-top: 34px;
}

.post-block {
  position: relative;
  margin-bottom: 52px;
  padding: 40px 44px 34px;
  background: var(--surreal-black-soft);
  border: 1px solid var(--surreal-line);
  box-shadow: 10px 10px 0 -1px #0e0e0e, 10px 10px 0 0 var(--surreal-red);
}

.post-block::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  width: 62px;
  height: 3px;
  background: var(--surreal-red);
}

.posts-expand .post-header {
  margin-bottom: 30px;
  text-align: left;
}

.post-header {
  margin-bottom: 30px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--surreal-line);
  text-align: left;
}

.post-title {
  position: relative;
  display: inline-block;
  margin: 0;
  color: var(--surreal-white);
  font-weight: 900;
  letter-spacing: 0.16em;
  text-align: left;
  text-transform: uppercase;
}

.post-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -12px;
  width: 52px;
  height: 4px;
  background: var(--surreal-red);
}

.post-body {
  color: #d9d9d9;
  font-size: 1.02em;
  line-height: 2;
}

.post-body h2 {
  margin: 1.9em 0 1em;
  padding-left: 14px;
  border-left: 5px solid var(--surreal-red);
  color: var(--surreal-white);
  font-size: 1.5em;
  letter-spacing: 0.08em;
}

.post-body h3 {
  margin: 2.1em 0 0.9em;
  padding-left: 12px;
  border-left: 3px solid var(--surreal-red);
  color: var(--surreal-grey);
  font-size: 0.95em;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.post-body p {
  margin: 0 0 1.1em;
}

.post-body strong,
.post-body b {
  color: var(--surreal-white);
}

.post-body blockquote {
  margin: 24px 0;
  padding: 12px 22px;
  border-left: 3px solid var(--surreal-red);
  background: rgba(255, 255, 255, 0.02);
  color: var(--surreal-grey);
}

.post-body code:not([class]) {
  padding: 2px 7px;
  border: 1px solid var(--surreal-line);
  background: #0a0a0a;
  color: var(--surreal-red);
  font-size: 0.88em;
}

/* ---------- 代码块 ---------- */

figure.highlight,
pre {
  margin: 24px 0;
  border: 1px solid var(--surreal-line);
  border-left: 4px solid var(--surreal-red);
  background: #0a0a0a !important;
  box-shadow: 6px 6px 0 0 rgba(255, 29, 29, 0.14);
  overflow: auto;
}

figure.highlight .gutter pre {
  background: #0f0f0f !important;
  color: #4d4d4d !important;
  border: 0;
}

figure.highlight .code pre {
  background: transparent !important;
  border: 0;
}

/* 代码块内部表格去掉所有底色，避免浅色行底出现 */
figure.highlight table,
figure.highlight tbody,
figure.highlight tr,
figure.highlight td {
  background: transparent !important;
}

/* 语言标签做成低调的几何水印 */
figure.highlight .code-lang {
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--surreal-white);
  font-size: 2.2em;
  font-weight: 900;
  letter-spacing: 0.3em;
  opacity: 0.08;
  pointer-events: none;
  text-transform: uppercase;
}

figure.highlight pre,
figure.highlight code {
  box-shadow: none;
}

figure.highlight .copy-btn {
  top: 8px;
  right: 8px;
  padding: 2px 10px;
  border: 1px solid var(--surreal-red);
  background: var(--surreal-black);
  color: var(--surreal-red);
  font-size: 0.7em;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

figure.highlight .copy-btn:hover {
  background: var(--surreal-red);
  color: var(--surreal-black);
}

/* ---------- 首页：三个展示栏（居中偏右） ---------- */

/* 首页不显示外层卡片框，三个展示栏直接浮在黑色背景上 */
.main-inner:has(.surreal-home) {
  padding-top: 64px;
}

.post-block:has(.surreal-home) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.post-block:has(.surreal-home)::before {
  display: none;
}

.main-inner:has(.surreal-home) .breadcrumb {
  display: none;
}

.surreal-home {
  position: relative;
  width: 74%;
  margin: 0 4% 40px auto;
  padding: 18px 0 0;
}

.surreal-home-kicker {
  margin: 0 0 26px;
  color: var(--surreal-red);
  font-size: 0.68em;
  letter-spacing: 0.6em;
  text-align: right;
  text-transform: uppercase;
}

.surreal-panel {
  position: relative;
  margin: 0 0 34px;
  padding: 32px 38px;
  background: linear-gradient(135deg, var(--surreal-panel-2) 0%, var(--surreal-black-soft) 100%);
  border: 1px solid var(--surreal-line);
  border-left: 6px solid var(--surreal-red);
  box-shadow: 12px 12px 0 0 #0e0e0e, 12px 12px 0 1px rgba(255, 29, 29, 0.55);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.surreal-panel:nth-of-type(2) {
  width: 92%;
  margin-left: 8%;
}

.surreal-panel:nth-of-type(3) {
  width: 84%;
  margin-left: 16%;
}

.surreal-panel::after {
  content: "";
  position: absolute;
  top: 22px;
  right: 22px;
  width: 14px;
  height: 14px;
  border: 2px solid var(--surreal-red);
  transform: rotate(45deg);
}

.surreal-panel:hover {
  transform: translate(-4px, -4px);
  box-shadow: 16px 16px 0 1px rgba(255, 29, 29, 0.6);
}

.surreal-panel-mark {
  display: block;
  color: var(--surreal-red);
  font-size: 0.66em;
  letter-spacing: 0.46em;
  text-transform: uppercase;
}

.surreal-panel-title {
  margin: 10px 0 12px;
  color: var(--surreal-white);
  font-size: 2.2em;
  font-weight: 900;
  letter-spacing: 0.2em;
  line-height: 1.1;
  text-transform: uppercase;
}

.surreal-panel-text {
  margin: 0;
  color: var(--surreal-grey);
  font-size: 0.82em;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

/* ---------- 分类页 ---------- */

.surreal-cats {
  padding: 6px 0 20px;
}

.surreal-cats-root {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px 26px;
  border: 1px solid var(--surreal-line);
  border-left: 6px solid var(--surreal-red);
  background: var(--surreal-panel-2);
  box-shadow: 8px 8px 0 0 #0e0e0e;
}

.surreal-cats-index {
  color: var(--surreal-red);
  font-size: 0.62em;
  letter-spacing: 0.4em;
  text-transform: uppercase;
}

.surreal-cats-name {
  color: var(--surreal-white);
  font-size: 1.7em;
  font-weight: 900;
  letter-spacing: 0.2em;
}

.surreal-cats-children {
  margin: 30px 0 0 26px;
  padding: 0 0 0 22px;
  list-style: none;
  border-left: 1px solid var(--surreal-line);
}

.surreal-cats-children li {
  position: relative;
  margin: 0 0 14px;
}

.surreal-cats-children li::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -22px;
  width: 22px;
  height: 1px;
  background: var(--surreal-red);
}

.surreal-cats-children a {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 15px 20px;
  border: 1px solid var(--surreal-line);
  background: var(--surreal-black-soft);
}

.surreal-cats-children a:hover {
  border-color: var(--surreal-red);
  background: var(--surreal-panel-2);
}

.surreal-cats-children .surreal-cats-name {
  font-size: 1em;
  letter-spacing: 0.3em;
}

/* ---------- 关于页 ---------- */

.surreal-about p {
  margin: 0 0 16px;
  padding-left: 16px;
  border-left: 2px solid #1e1e1e;
  color: var(--surreal-grey-dark);
  font-family: Consolas, Menlo, monospace;
  font-size: 1em;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.surreal-about p:nth-child(3n) {
  border-left-color: var(--surreal-red);
  color: var(--surreal-grey);
}

.surreal-about p:nth-child(5n) {
  color: var(--surreal-white);
}

/* ---------- 致谢页 ---------- */

.surreal-thanks-note {
  color: var(--surreal-grey);
}

/* ---------- 页脚 ---------- */

.footer {
  margin-top: 10px;
  border-top: 1px solid var(--surreal-line);
  color: var(--surreal-grey);
  font-size: 0.76em;
  letter-spacing: 0.16em;
}

.footer a {
  color: var(--surreal-red);
}

.footer .with-love i {
  color: var(--surreal-red);
}

/* ---------- 返回顶部 ---------- */

.back-to-top {
  border: 1px solid var(--surreal-red);
  background: var(--surreal-black);
  color: var(--surreal-red);
  box-shadow: 4px 4px 0 0 rgba(255, 29, 29, 0.35);
}

.back-to-top:hover {
  background: var(--surreal-red);
  color: var(--surreal-black);
}

/* ---------- 响应式 ---------- */

@media (max-width: 991px) {
  .main-inner:has(.surreal-home) {
    padding: 32px 16px 20px;
  }

  .surreal-home {
    width: 100%;
    margin: 0 0 20px;
  }

  .surreal-panel,
  .surreal-panel:nth-of-type(2),
  .surreal-panel:nth-of-type(3) {
    box-sizing: border-box;
    width: 100%;
    margin-left: 0;
    padding: 24px 20px;
    box-shadow: 6px 6px 0 0 #0e0e0e, 6px 6px 0 1px rgba(255, 29, 29, 0.55);
  }

  .surreal-panel::after {
    top: 14px;
    right: 14px;
    width: 10px;
    height: 10px;
  }

  .surreal-panel-title {
    font-size: 1.5em;
  }

  .post-block {
    padding: 24px 18px;
  }

  .post-block:has(.surreal-home) {
    padding: 0;
  }

  .post-title {
    font-size: 1.5em;
  }

  .post-body {
    font-size: 0.96em;
  }
}

```

### 3.4 视觉设计要点解释

- **配色**：黑 `#050505`、红 `#ff1d1d`、灰 `#8a8a8a`、白 `#f5f5f5`；深色背景 + 红色主题色 + 灰色辅助文字。
- **高对比红黑撞色**：红色只用于强调（菜单图标、边条、下划线、链接、菱形标记），大面积仍是黑/深灰，避免刺眼。
- **锐利几何线条**：
  - `body` 上叠加了两层斜向 `repeating-linear-gradient`（红色 5% 透明度 + 白色 2%），形成极淡的几何底纹；
  - `body::after` 在右侧固定一条渐变红色竖线；
  - 卡片使用 `border-left: 6px solid red` + 右上角旋转 45° 的菱形 `::after`；
  - 所有元素 `border-radius: 0`（在 `variables.styl` 里设 `$border-radius = 0`）。
- **特殊阴影**：全部使用**无模糊的错位硬阴影**，例如 `box-shadow: 12px 12px 0 0 #0e0e0e, 12px 12px 0 1px rgba(255,29,29,.55)`，形成"印刷错版"式的超现实感。
- **半透明磨砂**：卡片背景用 `linear-gradient` 深色渐变；如需真正的磨砂质感，可在任意卡片选择器里追加：
  ```css
  background: rgba(18, 18, 18, 0.72);
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  ```
- **响应式**：`@media (max-width: 991px)` 中把首页展示栏改为单列 100% 宽，并去掉交错缩进。

---

## 4. 模块三：作者个人信息卡片

### 4.1 实现方式

NexT 提供 `custom_file_path.sidebar` 注入点：文件内容会被注入到侧边栏 `site-overview-wrap` 内部。我们在注入文件里写一个完整的作者卡片，然后用 CSS 隐藏主题自带的作者块。

`_config.next.yml` 相关配置：

```yaml
# 关闭主题默认统计块
site_state: false

# 隐藏默认作者块后，这里仍保留头像供主题 meta 使用
avatar:
  url: /images/avatar-surreal.gif
  rounded: false
  rotated: false

social_icons:
  enable: true
  icons_only: false
  transition: false

custom_file_path:
  variable: source/_data/variables.styl
  style: source/_data/styles.styl
  sidebar: source/_data/sidebar.njk
```

### 4.2 `source/_data/sidebar.njk` 完整代码

路径：`source/_data/sidebar.njk`

```njk
<div class="surreal-author-card">
  <div class="surreal-author-avatar-wrap">
    <img class="surreal-author-avatar" src="{{ config.root }}images/avatar-surreal.gif" alt="unknown">
    <span class="surreal-author-corner" aria-hidden="true"></span>
  </div>
  <div class="surreal-author-body">
    <p class="surreal-author-kicker">unknown</p>
    <h3 class="surreal-author-name">unknown</h3>
    <p class="surreal-author-bio">unknown</p>
    <ul class="surreal-author-social">
      <li><a href="#unknown" rel="noopener">unknown</a></li>
      <li><a href="#unknown" rel="noopener">unknown</a></li>
      <li><a href="#unknown" rel="noopener">unknown</a></li>
    </ul>
  </div>
</div>

```

> 说明：注入模板里没有 `url_for` 等主题 helper 时，用 `{{ config.root }}images/xxx` 拼接静态资源路径（`config.root` 即 `/blog/`）。

### 4.3 头像文件与命名坑

- 头像文件：`source/images/avatar-surreal.gif`（红底白色生物动画 GIF，184×184，48 帧循环）。
- ⚠️ **不要命名为 `avatar.gif`**：NexT 主题自身带有 `source/images/avatar.gif`（灰色默认头像），主题资源会覆盖站点同名文件，导致显示为默认灰色头像。实测已踩坑，改名为 `avatar-surreal.gif` 后正常。
- 换头像：直接覆盖 `source/images/avatar-surreal.gif`（保持文件名）即可；改路径则同时改 `source/_data/sidebar.njk` 的 `src` 和 `_config.next.yml` 的 `avatar.url`。

---

## 5. 模块四：首页改造（三个展示栏，居中偏右）

### 5.1 思路

NexT 的首页默认由 `hexo-generator-index` 生成文章列表。要变成"纯静态三栏落地页"：

1. 卸载文章列表生成器；
2. 新建 `source/index.md`，设为 `layout: page` 的静态页面；
3. `header: false` 隐藏页面标题；
4. 用 HTML 写三个展示栏，CSS 控制"居中偏右"。

```powershell
# 1) 卸载首页文章列表生成器（Hexo 会因此不再生成 index 文章流）
npm uninstall hexo-generator-index
```

### 5.2 `source/index.md` 完整代码

路径：`source/index.md`

```markdown
---
title: 首页
layout: page
header: false
comments: false
---

<div class="surreal-home">
  <section class="surreal-panel">
    <span class="surreal-panel-mark">unknown</span>
    <h2 class="surreal-panel-title">unknown</h2>
    <p class="surreal-panel-text">unknown unknown unknown unknown</p>
  </section>
  <section class="surreal-panel">
    <span class="surreal-panel-mark">unknown</span>
    <h2 class="surreal-panel-title">unknown</h2>
    <p class="surreal-panel-text">unknown unknown unknown unknown</p>
  </section>
  <section class="surreal-panel">
    <span class="surreal-panel-mark">unknown</span>
    <h2 class="surreal-panel-title">unknown</h2>
    <p class="surreal-panel-text">unknown unknown unknown unknown</p>
  </section>
</div>

```

### 5.3 CSS"居中靠右"的实现方案

核心规则（完整版见第 3.3 节 `styles.styl` 的"首页"部分）：

```css
/* 首页去掉外层卡片框，让三个展示栏直接浮在黑色背景上 */
.post-block:has(.surreal-home) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.main-inner:has(.surreal-home) {
  padding-top: 64px;
}

/* 居中偏右：容器宽度收窄，左边距 auto，
   浏览器会把剩余空间全部推到左侧，于是整体靠右；
   再用 margin-right 留出右侧呼吸空间。 */
.surreal-home {
  width: 74%;
  margin: 0 4% 40px auto;
}

/* 三个栏阶梯式缩进，形成超现实的不对称构图 */
.surreal-panel:nth-of-type(2) { width: 92%; margin-left: 8%; }
.surreal-panel:nth-of-type(3) { width: 84%; margin-left: 16%; }
```

解释：
- `margin: 0 4% 40px auto` 的 `auto` 在**左边**，浏览器会把父容器剩余宽度全部给左侧，容器自然贴右；`width: 74%` 控制占地比例，视觉上落在"页面中偏右"。
- 三个面板分别 `8% / 16%` 阶梯左移，形成不对称的错位感（Surreal 常见构图手法）。
- `:has()` 选择器用于"仅当页面包含 `.surreal-home` 时才取消卡片外框"，Edge/Chrome 105+ 均支持。

### 5.4 响应式

```css
@media (max-width: 991px) {
  .surreal-home { width: 100%; margin: 0 0 20px; }
  .surreal-panel,
  .surreal-panel:nth-of-type(2),
  .surreal-panel:nth-of-type(3) {
    box-sizing: border-box;
    width: 100%;
    margin-left: 0;
  }
}
```

---

## 6. 模块五：分类页（全部 + 三个 unknown 子项）

### 6.1 `source/categories/index.md` 完整代码

路径：`source/categories/index.md`

```markdown
---
title: 分类
comments: false
---

<div class="surreal-cats">
  <div class="surreal-cats-root">
    <span class="surreal-cats-index">unknown</span>
    <span class="surreal-cats-name">全部</span>
  </div>
  <ul class="surreal-cats-children">
    <li><a href="#unknown"><span class="surreal-cats-index">unknown</span><span class="surreal-cats-name">unknown</span></a></li>
    <li><a href="#unknown"><span class="surreal-cats-index">unknown</span><span class="surreal-cats-name">unknown</span></a></li>
    <li><a href="#unknown"><span class="surreal-cats-index">unknown</span><span class="surreal-cats-name">unknown</span></a></li>
  </ul>
</div>

```

样式见 `styles.styl` 的"分类页"部分：父级卡片（红色左边条 + `全部` 大字）、左侧竖线 + 红色连接线 + 三个子项。

### 6.2 "静态占位"与"真实 Hexo 分类"的差别

- **本站采用静态占位**：写死 HTML，父级"全部" + 三个"unknown"子项，不依赖文章，分类名严格保持 `unknown`。
- 如果以后要**真实的 Hexo 分类体系**：

```powershell
# 生成分类总览页（front-matter 需要 type: categories）
npx hexo new page categories
```

然后编辑 `source/categories/index.md` 的 front-matter 为：

```yaml
---
title: 分类
type: categories
comments: false
---
```

再创建文章并指定分类（注意：**多个文章使用同名分类会自动合并**，所以不能有三个都叫 `unknown` 的真实分类）：

```yaml
---
title: 示例文章
categories:
  - unknown
---
```

若必须三个占位分类，建议改用 `unknown-1 / unknown-2 / unknown-3`，或使用层级分类 `unknown/子类A` 等；父级"全部"则用 `全部/unknown-1` 这类二级写法承载。本站目前选择静态占位，就是为了严格保留三个 `unknown` 文案。

---

## 7. 模块六：关于页（纯 unknown 占位）

`source/about/index.md` 完整代码：

```markdown
---
title: 关于
comments: false
---

<div class="surreal-about">
  <p>unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown</p>
  <p>unknown unknown unknown unknown unknown unknown unknown unknown</p>
</div>

```

样式见 `styles.styl` 的"关于页"部分：每行 unknown 加左侧竖线，按 `3n` / `5n` 交替使用红/白/灰三色，形成排版节奏。

---

## 8. 模块七：致谢页（六种语言）

`source/thanks/index.md` 完整代码：

````markdown
---
title: 致谢
comments: false
---

### English

```text
Thank you
```

### 中文

```text
感谢
```

### Deutsch

```text
Danke
```

### Python

```python
# -*- coding: utf-8 -*-
print("thanks")
```

### Java

```java
public class Thanks {
    public static void main(String[] args) {
        System.out.println("thanks");
    }
}
```

### C++

```cpp
#include <iostream>

int main() {
    std::cout << "thanks" << std::endl;
    return 0;
}
```
````

代码块样式由 `styles.styl` 统一处理：红色左边条 + 硬阴影 + 语言水印（`TEXT` / `PYTHON` / `JAVA` / `CPP`），并去掉了代码块内部表格的浅色行底（否则会出现白色横条）。

> 关于 Python 的 UTF-8：`# -*- coding: utf-8 -*-` 是 Python 2 时代的文件编码声明；Python 3 默认 UTF-8，但保留它作为注释也不影响运行。`print("thanks")` 输出的就是英文 thanks。

---

## 9. 预览与部署

### 9.1 本地预览

```powershell
# 安装依赖（首次克隆后）
npm install

# 本地预览：http://localhost:4000/blog/
npx hexo server -p 4000
```

> 本项目 `_config.yml` 中 `root: /blog/`，所以本地地址带 `/blog/` 前缀，与线上一致，避免资源 404。

### 9.2 构建 + 部署

```powershell
# 生成静态文件
npx hexo clean
npx hexo generate

# 部署（hexo-deployer-git 会推送到 gh-pages 分支，GitHub Pages 从该分支发布）
npx hexo deploy
```

### 9.3 一键脚本（本机网络环境需要代理）

本机直连 `github.com` 不稳定，`tools/deploy.ps1` 已内置 SOCKS5 代理：

```powershell
powershell -File tools/deploy.ps1
# 代理端口不同可传参
powershell -File tools/deploy.ps1 -Proxy "socks5h://127.0.0.1:7890"
```

脚本源码（路径：`tools/deploy.ps1`）：

```powershell
param(
  [string]$Proxy = 'socks5h://127.0.0.1:1080'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "使用代理: $Proxy" -ForegroundColor Cyan
$env:HTTPS_PROXY = $Proxy
$env:HTTP_PROXY = $Proxy
$env:GIT_TERMINAL_PROMPT = '0'

Write-Host "==> hexo clean" -ForegroundColor Cyan
npx hexo clean
Write-Host "==> hexo generate" -ForegroundColor Cyan
npx hexo generate
Write-Host "==> hexo deploy" -ForegroundColor Cyan
npx hexo deploy

if ($LASTEXITCODE -eq 0) {
  Write-Host "部署完成：https://nosferatuxada.github.io/blog/" -ForegroundColor Green
} else {
  Write-Host "部署失败，请检查 VPN/代理是否开启。" -ForegroundColor Red
  exit $LASTEXITCODE
}

```

### 9.4 部署链路说明

```
markdown 源码 (main 分支)
   └─ hexo generate → public/ 静态文件
        └─ hexo deploy → gh-pages 分支（--force 推送）
             └─ GitHub Pages 从 gh-pages 发布
```

注意：`hexo-deployer-git` 每次部署会清空 `.deploy_git` 里的可见文件再复制 `public/`，所以已删除的文章/页面不会残留在线上（实测 `/posts/...` 已 404）。

---

## 10. 占位符精修清单（所有 unknown 的位置）

| 位置 | 文件 | 当前值 |
| --- | --- | --- |
| 站点副标题 | `_config.yml` → `subtitle` | `unknown` |
| 站点描述 / 作者 / 关键词 | `_config.yml` → `description` / `author` / `keywords` | `unknown` |
| 作者卡片：小标题 / 名字 / 简介 | `source/_data/sidebar.njk` | `unknown` |
| 作者卡片：3 条社交链接 | `source/_data/sidebar.njk` | `unknown` |
| 首页三个展示栏 | `source/index.md` | `unknown` |
| 分类页三个子项 | `source/categories/index.md` | `unknown` |
| 关于页正文 | `source/about/index.md` | `unknown` |
| 页脚版权作者 | 自动取 `_config.yml` 的 `author` | `unknown` |

> 已确定的品牌信息：站点标题 `Creationism`、导航四项、分类父级「全部」、头像 GIF、致谢页六种语言文本。

---

## 11. 附录：Butterfly / Fluid 的差异与移植要点

> 以下为移植思路说明（未在本仓库启用，也未实际验证）。NexT 的 `styles.styl` / `styles` 选择器与这两个主题不同，直接复制会部分失效；页面 Markdown 可以 100% 复用。

### 11.1 快速对照

| 需求 | NexT（当前） | Butterfly | Fluid |
| --- | --- | --- | --- |
| 主题配置 | `_config.next.yml` | `_config.butterfly.yml` | `_config.fluid.yml` |
| 导航菜单 | `menu:` + `menu_settings` | `menu:`（形如 `首页: / || fas fa-home`） | `navbar.menu`（列表形式：`{key, name, icon, path}`） |
| 自定义 CSS 注入 | `custom_file_path.style` → `_data/styles.styl` | `inject.head` 引入 `/css/custom.css`；CSS 放 `source/css/custom.css` | `custom_css:`（可写路径或内联） |
| 作者卡片 | `custom_file_path.sidebar` 注入 + CSS 隐藏默认块 | 配置 `card_author`（avatar/name/description/button）；要纯自定义则 `inject.bottom` 注入 HTML + CSS 隐藏 `.card-info` | 侧边栏 `widgets` 的 about 组件配置；纯自定义用 `custom_html` / 覆盖模板 |
| 首页静态化 | 移除 index 生成器 + `source/index.md` | 覆盖 `layout/index.pug`（主题模板），或保持 `index` 生成器并隐藏文章流 | 覆盖 `layout/index.ejs` / 使用 `index` 页面方案 |
| 自定义页面 | `hexo new page xxx` + Markdown | 同左 | 同左 |
| 页面 Markdown | 直接复用 | 直接复用 | 直接复用 |

### 11.2 Butterfly 移植要点

1. 把 `source/index.md`、`source/categories/index.md`、`source/about/index.md`、`source/thanks/index.md` 原样复制过去（front-matter 不必改）。
2. 创建 `source/css/custom.css`，把 `styles.styl` 中**非 Stylus 变量**的部分改写成 CSS（把 `$xxx` 替换成实际值），并注意选择器：
   - 作者卡片：`.card-info` / `.card-info .author-info` / `.card-info .social`；
   - 首页卡片：Butterfly 用 `.recent-post-item` / `.card-widget`；
   - 导航：`.menus`、`.site-name`。
3. 在 `_config.butterfly.yml` 的 `inject.head` 中加入：
   ```yaml
   inject:
     head:
       - <link rel="stylesheet" href="/css/custom.css">
   ```
4. 作者卡片纯自定义：`inject.bottom` 注入 HTML（HTML 可直接用第 4.2 节的内容，把 `{{ config.root }}` 换成 `/`），再用 CSS 隐藏默认卡片。

### 11.3 Fluid 移植要点

1. 页面 Markdown 同样直接复用。
2. `_config.fluid.yml` 中：
   - 导航：`navbar.menu` 列表；
   - 自定义 CSS：`custom_css:` 指向你的 CSS 文件（或直接写内联）；
   - 作者窗口：`widgets` 里的 about 组件（`about:` 配置 avatar/name/intro/social）。
3. Fluid 的侧边栏组件类名与 NexT 不同，`styles.styl` 里的 `.sidebar` / `.site-overview-wrap` / `.post-block` 等选择器需要按 Fluid 的 DOM 重写。

### 11.4 迁移的最大难点

首页静态化和作者卡片注入是主题强相关的：
- **NexT** 通过 `custom_file_path` + `hexo-generator-index` 卸载实现，方案干净、升级不丢失；
- **Butterfly / Fluid** 更适合"主题配置 + inject"路径，首页三栏通常要覆盖主题的 `layout/index.*` 模板。

如果你确实要迁到 Butterfly 或 Fluid，建议新开分支操作（`git switch -c theme-migration`），我可以按你的目标主题逐文件改写并截图验证，确认后再切换线上。

---

## 12. 附录：`_config.yml` 完整代码

路径：`_config.yml`

```yaml
# Hexo Configuration
## Docs: https://hexo.io/docs/configuration.html
## Source: https://github.com/hexojs/hexo/

# Site
title: Creationism
subtitle: 'unknown'
description: 'unknown'
keywords: unknown
author: unknown
language: zh-CN
timezone: 'Asia/Shanghai'

# URL
## Set your site url here. For example, if you use GitHub Page, set url as 'https://username.github.io/project'
url: https://NOSferatuXAda.github.io/blog
root: /blog/
permalink: posts/:title/
permalink_defaults:
pretty_urls:
  trailing_index: false # Set to false to remove trailing 'index.html' from permalinks
  trailing_html: false # Set to false to remove trailing '.html' from permalinks

# Directory
source_dir: source
public_dir: public
tag_dir: tags
archive_dir: archives
category_dir: categories
code_dir: downloads/code
i18n_dir: :lang
skip_render:

# Writing
new_post_name: :title.md # File name of new posts
default_layout: post
titlecase: false # Transform title into titlecase
external_link:
  enable: true # Open external links in new tab
  field: site # Apply to the whole site
  exclude: ''
filename_case: 0
render_drafts: false
post_asset_folder: true
relative_link: false
future: true
syntax_highlighter: highlight.js
highlight:
  line_number: true
  auto_detect: false
  tab_replace: ''
  wrap: true
  hljs: false
prismjs:
  preprocess: true
  line_number: true
  tab_replace: ''

# Home page setting
# path: Root path for your blogs index page. (default = '')
# per_page: Posts displayed per page. (0 = disable pagination)
# order_by: Posts order. (Order by date descending by default)
index_generator:
  path: ''
  per_page: 10
  order_by: -date

# Category & Tag
default_category: uncategorized
category_map:
tag_map:

# Metadata elements
## https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
meta_generator: true

# Date / Time format
## Hexo uses Moment.js to parse and display date
## You can customize the date format as defined in
## http://momentjs.com/docs/#/displaying/format/
date_format: YYYY-MM-DD
time_format: HH:mm:ss
## updated_option supports 'mtime', 'date', 'empty'
updated_option: 'mtime'

# Pagination
## Set per_page to 0 to disable pagination
per_page: 10
pagination_dir: page

# Include / Exclude file(s)
## include:/exclude: options only apply to the 'source/' folder
include:
exclude:
ignore:

# Extensions
## Plugins: https://hexo.io/plugins/
## Themes: https://hexo.io/themes/
theme: next

# Search
search:
  path: search.xml
  field: post
  content: true
  format: html

# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: git
  repo: https://github.com/NOSferatuXAda/blog.git
  branch: gh-pages
  message: 'Site updated: {{ now(''yyyy-MM-dd HH:mm:ss'') }}'

```

---

## 13. 附录：`_config.next.yml` 完整代码

路径：`_config.next.yml`

```yaml
# NexT 主题自定义配置（覆盖主题默认值）
# 主题文档: https://theme-next.js.org/docs/theme-settings/
# 说明：本站为「黑 / 红 / 灰 / 白 + Surreal」定制风格，
#       所有未确定内容统一使用 unknown 作为占位符。

# 主题风格：Muse | Mist | Pisces | Gemini
scheme: Gemini

# 全局配色固定为黑红灰白（关闭自动深色模式，避免覆盖自定义色板）
darkmode: false

# 导航栏：四个核心类别（中文键名会直接作为显示文案）
menu:
  首页: / || fa fa-home
  分类: /categories/ || fa fa-layer-group
  关于: /about/ || fa fa-user
  致谢: /thanks/ || fa fa-heart

menu_settings:
  badges: false
  icons: true

# 社交链接占位（作者窗口使用自定义侧边栏卡片，见 source/_data/sidebar.njk）
social:
  unknown: /unknown/ || fa fa-question

social_icons:
  enable: true
  icons_only: false
  transition: false

# 侧边栏作者窗口头像（红底白色生物动画 GIF）
avatar:
  url: /images/avatar-surreal.gif
  rounded: false
  rotated: false

sidebar:
  position: left
  display: post
  padding: 18
  offset: 12

# 关闭 NexT 默认的站点统计块（由自定义作者窗口承载）
site_state: false

# 文章目录（保留给未来的文章页）
toc:
  enable: false
  number: true
  wrap: true
  expand_all: false
  max_depth: 4

# 阅读进度条
reading_progress:
  enable: true
  start_at: left
  position: top
  color: "#ff1d1d"
  height: 2px

# 返回顶部
back2top:
  enable: true
  sidebar: false
  scrollpercent: true

# 页面切换动画
motion:
  enable: false
  async: true
  transition:
    post_block: fadeIn
    post_header: fadeInDown
    post_body: fadeInDown
    coll_header: fadeInLeft
    sidebar: fadeInUp

# 代码块：统一使用深色高亮主题，配合黑红配色
codeblock:
  theme:
    light: stackoverflow-dark
    dark: stackoverflow-dark
  copy_button:
    enable: true
    style: flat
  language: true

# 行内代码 / 代码块基底配色（供主题变量使用）
highlight:
  light:
    background: "#0a0a0a"
    foreground: "#f2f2f2"
  dark:
    background: "#0a0a0a"
    foreground: "#f2f2f2"

# 图片灯箱
fancybox: true

# 站内搜索：首页不再展示文章列表，暂关闭搜索入口
local_search:
  enable: false
  trigger: auto
  top_n_per_article: 1
  unescape: false
  preload: false

# 页脚
footer:
  since: 2026
  icon:
    name: fa fa-circle
    animated: false
    color: "#ff1d1d"
  copyright:
  powered: true

# 浏览器主题色
theme_color:
  light: "#ff1d1d"
  dark: "#ff1d1d"

# 自定义变量 / 自定义样式 / 自定义侧边栏作者卡片
custom_file_path:
  variable: source/_data/variables.styl
  style: source/_data/styles.styl
  sidebar: source/_data/sidebar.njk

# 资源本地化，不依赖境外 CDN
vendors:
  internal: local
  plugins: local

```

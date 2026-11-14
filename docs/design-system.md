# Creationism 设计系统 · Surreal 视觉语言

> 版本：v1.0（2026-11-14）
> 这是一套「黑 / 红 / 灰 / 白 + 超现实」的视觉语言。所有改动、新增页面、新组件都必须遵循本系统，不得另起炉灶。

## 1. 设计原则（Design Principles）

1. **克制的四色**：全站只用黑、红、灰、白四种色，不引入任何蓝、绿、黄等第三色。情绪只靠红（强调/危机/生命）与灰（沉默/次要）之间拉扯。
2. **锐利，绝不圆滑**：圆角一律为 0，阴影一律是「错位硬阴影」（无模糊、有偏移），线条一律是几何直线。整体像一把刀，不像一块肥皂。
3. **留白即呼吸**：正文不铺满，靠右侧留白与错位排版制造「未完成、正在发生」的现场感。
4. **水是母题**：H2O、磷虾、洋流是贯穿全站的意象。新增内容时优先沿用这套水族隐喻，而不是另找比喻。
5. **unknown 是语言的一部分**：尚未决定的内容统一写 unknown，它是一种诚实的占位，不是待填的空缺。

## 2. 色彩系统（Color Tokens）

### 2.1 Token 定义（唯一色板来源）

source/_data/styles.styl 的 :root 是自定义组件的唯一色板来源；source/_data/variables.styl 是 NexT 主题变量的覆盖来源。二者语义一一对应，禁止在组件里写死 hex 值。

| Token | 值 | 语义 |
| --- | --- | --- |
| --surreal-black | #050505 | 页面底色（深海） |
| --surreal-black-soft | #0b0b0b | 内容区底色 |
| --surreal-panel | #121212 | 卡片 / 面板底 |
| --surreal-panel-2 | #181818 | 面板渐变浅端 |
| --surreal-line | #2b2b2b | 常规边框 |
| --surreal-line-light | #3a3a3a | 亮边框 / 链接下划线 |
| --surreal-grey | #8a8a8a | 次要文字 |
| --surreal-grey-dark | #5c5c5c | 更弱的灰 |
| --surreal-white | #f5f5f5 | 正文 / 主文字 |
| --surreal-red | #ff1d1d | 品牌红 / 强调 / 危机 |
| --surreal-red-deep | #a80c0c | 深红（hover / 阴影） |

### 2.2 色彩语义

- **红 = 生命信号**：强调、链接、hover、选中、警示、几何水印、首字点红。红是这套系统里唯一「会动、会叫」的颜色。
- **灰 = 沉默**：次要文字、次级边框、说明性内容。灰是「水没说的话」。
- **黑 = 深海**：一切背景。黑不是「没颜色」，是「水太深了」。
- **白 = 浮上来的东西**：正文、标题。白色是唯一「浮出水面」的内容。

## 3. 字体系统（Typography）

| 用途 | 字体 | 说明 |
| --- | --- | --- |
| 英文标题 | Syne | 几何感、宽字距 |
| 等宽 / 代码 | JetBrains Mono | 命令、日志、代码块 |
| 中文标题 | 宋体 / serif 栈 | 标题首字点红 |
| 正文 | 中文黑体 / sans 栈 | 阅读舒适 |

### 3.1 排版规则

- 标题首字点红（surreal 标题类 + first-letter 伪元素）。
- 英文大写字母间距拉大（letter-spacing 0.2em ~ 0.6em），营造「印刷 / 铭牌」感。
- 正文 letter-spacing 0.02em，行高约 1.9。

## 4. 几何与间距（Geometry & Spacing）

- **圆角**：全部为 0（锐角）。
- **错位硬阴影**：box-shadow: 12px 12px 0 0 #0e0e0e, 12px 12px 0 1px rgba(255,29,29,0.55)。阴影「向右下错位 12px、无模糊」，是这套系统最标志性的签名。
- **面板左缘**：border-left: 6px solid（红色刀锋）。
- **几何水印**：body 的右侧竖向红色几何线；面板右上角 45 度旋转的红色方块。
- **纹理背景**：repeating-linear-gradient 的 135/45 度细线，模拟噪点与水波。
- **间距步进**：面板间 34px，面板内边距 32px 38px。

## 5. 组件规范（Components）

| 组件 | 类名 | 规范 |
| --- | --- | --- |
| 首页面板 | surreal-panel | 红左缘 + 错位硬阴影 + hover 位移 -4px |
| 面板角标 | surreal-panel-mark | 红色小字、宽字距，当前为 unknown 占位 |
| 分类序号 | surreal-cats-index | 罗马数字 Ⅰ/Ⅱ/Ⅲ/Ⅳ |
| 时间轴项 | surreal-timeline-item | 左侧红点 + 日期 + 标题 |
| 文章标记 | surreal-essay-marker | 正文首行的隐藏标记，用于识别随笔 |
| 返回链接 | surreal-post-back | 文末「← 返回作品集」 |
| 作者卡 | surreal-author-card | 头像 + kicker + 名字 + bio + 社交链接 |
| 环流节点 | gyre-node | 红点 + 白字标签，hover 变红 |
| 环流带 | gyre-belt-dash | 红色虚线，SMIL 旋转 |
| 公告弹窗 | surreal-announcement | 全屏遮罩 + 面板 + 不再提醒按钮 |

## 6. 动效规范（Motion）

| 动效 | 时长 | 说明 |
| --- | --- | --- |
| hover 位移 / 阴影 | 0.18s ease | 面板、链接的过渡 |
| 环流旋转 | 30s / 48s | 暖流逆时针、寒流顺时针，反向流动 |
| 粒子漂移 | 18s ~ 40s | 磷虾 / 浮游生物，快慢不一 |
| 辉光呼吸 | 6s ease-in-out | 中心红色辉光 |
| 节点 / 粒子闪烁 | 3s ~ 3.5s | 脉冲 opacity |

> **无障碍**：prefers-reduced-motion 时关闭所有动画（已内置）。

## 7. 违规红线（Do Not）

- ❌ 硬编码 hex 色值（必须用 token）
- ❌ 引入非黑红灰白的新颜色
- ❌ 圆角、模糊阴影、渐变之外的柔和质感
- ❌ 新组件不写进本系统
- ❌ 随便改「作品集·模拟人生 / 关于·模拟磷虾 / 环流·模拟洋流」这套水族隐喻

---

> 审计：运行 node tools/design-audit.js 检查本系统的违规项。

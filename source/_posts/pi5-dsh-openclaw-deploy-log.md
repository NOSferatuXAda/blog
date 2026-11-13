---
title: 树莓派 5：dsh + OpenClaw 部署工作日志
date: 2026-11-13 13:05:00
categories: 技术
tags:
  - 树莓派
  - dsh
  - OpenClaw
  - 部署
description: 在 8GB 树莓派 5 上离线部署 dsh 与 OpenClaw，从刷机、网络排障到模型接入与升级的完整工作日志。
comments: false
---

<div class="surreal-essay-marker" hidden></div>

> 时间范围：2026-11-02 ～ 2026-11-13  
> 设备：Raspberry Pi 5 / 8GB；Windows 11 笔记本（LAPTOP-T5VOUDGV）  
> 目标：在 Pi 上本地部署 DeepSeek Harness（dsh）与 OpenClaw，并让电脑可以稳定访问它们的 Web 界面

这不是一篇一键教程，而是一份按时间顺序整理的工作日志。省略了大量重复的等待与调试细节，保留关键决策、实际命令和最终结论。

## 阶段 1｜需求确认与离线安装包准备

**背景**

希望把 dsh（DeepSeek Harness）本地部署到 8GB 树莓派 5 上，之后又追加 OpenClaw，并要求提前把需要下载的东西准备好，以便 Pi 在弱网或离网环境下也能安装。

**做了什么**

1. 确定部署形态：
   - Pi 上运行 dsh 的 linux-arm64 预编译运行时（自带 Web 前端）；
   - OpenClaw 用 Node.js + npm 离线缓存安装；
   - 系统使用 Raspberry Pi OS Lite（Trixie，64-bit）。
2. 下载并归档到离线包 `E:\Creationism\pi5-deploy`：
   - dsh runtime wheel：`deepseek_harness_runtime_bin-0.2.1rc2`（linux arm64）；
   - dsh SDK wheel（可选）；
   - Node.js v24.22.2 linux-arm64（满足 OpenClaw `>=24.22.1 <25`）；
   - npm 12.2.1、pnpm 12.16.1；
   - OpenClaw 2026.10.9 的完整 npm 离线缓存（344 个包，含 arm64 原生包）；
   - Raspberry Pi OS Lite 镜像 + Raspberry Pi Imager 2.0.12；
   - bubblewrap deb（Bookworm/Trixie 两个版本，dsh bash 沙箱用）；
   - `install/` 安装脚本、README、`versions.json`、`inventory.json`、`SHA256SUMS`。
3. 校验：
   - `SHA256SUMS` 全部文件通过；
   - 离线 npm install 实测安装 344 个包、退出码 0；
   - dsh/Node 二进制 ELF 检查：AArch64、最高 `GLIBC_2.28`；
   - `openclaw --version` 冒烟输出 OpenClaw 2026.10.9。

**结果**

离线包完成（约 855 MiB，37 个文件），可支持 Pi 离线安装。

## 阶段 2｜硬件连接与系统刷写

**背景**

Pi 5 通过 Ethernet 直连笔记本，但一开始没有可用系统盘。

**发生了什么 / 做了什么**

1. 先尝试用 SD 卡：笔记本自带 Realtek 读卡器始终识别不到，换卡、换卡套均失败，怀疑读卡器或卡套问题。
2. 改用 COLORFUL 64GB U 盘：
   - 用管理员脚本把 Raspberry Pi OS Lite 镜像原样写入 U 盘；
   - 在 U 盘 boot 分区写入 cloud-init 配置（用户 `dsh`、SSH 公钥、静态 IP `169.254.1.10/16`），使 Pi 启动后即可 SSH 登录；
   - 首次启动成功接入（网线直连 + 静态 IP）。
3. 但 U 盘在持续写入时反复掉盘、系统卡死：
   - 传输 854MB 包到一半连接重置；
   - 安装过程写到约 1GB 时再次失联；
   - 判断该 U 盘不适合做系统盘。
4. 改回 SD 卡路线：
   - 之前识别不到的 SD 卡其实是 microSD 套在转接卡套里，卡套上的**写保护滑锁**处于 Lock 位置，Windows 因此报磁盘只读；
   - 拨到 Unlock 后，用读卡器成功把 Lite 镜像写入 64GB SD 卡；
   - 写入 boot 分区 cloud-init 配置（`dsh` 用户、SSH 公钥、静态 IP、SD 卡自动扩容）。
5. SD 卡启动成功：系统识别为 `mmcblk0`，根分区自动扩展到 58G。

**结果**

Pi 从 64GB SD 卡稳定运行 Raspberry Pi OS Lite（Trixie）。

## 阶段 3｜网络排障：从以太网直连到 Wi-Fi 热点

**问题**

Pi 与笔记本 Realtek 2.5GbE 网口直连时：

- 链路显示 Up（1Gbps / 100Mbps / 10Mbps 都试过）；
- 30～60 秒后完全无流量，ping / SSH 全部失联；
- Pi 屏幕仍停在 login 提示，说明系统本身没死。

**排查过程**

1. 排除软件配置：
   - 静态 IP `169.254.1.10/16` 正确；
   - 关闭 EEE、流控、环保节能、Selective Suspend、Power Saving；
   - 两边锁定 100Mbps、10Mbps 全双工；
   - 换 cloud-init 渲染器（networkd / NetworkManager）等。
   - 结果仍然在 30～60 秒后断流，说明不是普通的 IP/EEE 配置问题。
2. 判断为该台机器的以太网口或网线个例；后来也确认没有备用网线、没有 USB 网卡、没有路由器可换。
3. 尝试 Bluetooth PAN（电脑与 Pi 都自带蓝牙）：
   - 安装 `bluez-tools`，注册 NAP server，Windows 侧配对成功；
   - 但 Windows PAN 客户端连接时报「连接到网络时出现意外错误」，多次重试失败；判断为 Windows PAN 与老版 `bluez-tools` 的兼容问题；
   - 放弃蓝牙方案，清理 `bt-pan` / `bt-agent` / `bt-discoverable` 服务。
4. 最终方案：Windows 移动热点 + Pi 板载 Wi-Fi。
   - Windows：设置 → 网络和 Internet → 移动热点，SSID `pi5-link`，共享 WLAN；
   - Pi：在 SD 卡 boot 分区 cloud-init 里配置：
     - `rfkill unblock wifi`；
     - `nmcli` 连接 `pi5-link`；
     - 静态地址 `192.168.137.200/24`；
     - 默认网关 `192.168.137.1`（Windows 热点共享网关）。
   - 关键坑：只配静态 IP、不配网关则 Pi 无法上网；之后补了 `ipv4.gateway 192.168.137.1` 和 DNS。
   - 另发现 Wi-Fi 被 rfkill 软禁用、NetworkManager 与 networkd 争夺 `wlan0`，最终统一交给 NetworkManager 管理。

**结果**

Pi 通过 Wi-Fi 稳定接入笔记本热点：固定 `192.168.137.200`，可上网（npm / DeepSeek API 可达），SSH 隧道访问 dsh / OpenClaw 成为主用方式。

## 阶段 4｜dsh（DeepSeek Harness）安装

**做了什么**

1. 把精简后的部署包（310.7 MiB，去掉系统镜像）通过 scp 传到 Pi，先放 `/dev/shm`（内存盘）再解压，避免传输阶段写 SD 卡。
2. 执行 `install/install-all.sh`：
   - 解压 dsh runtime 到 `~/.local/lib/dsh-runtime`；
   - 生成 `~/.local/bin/dsh` 启动器；
   - 安装并启用 `dsh-web.service`（用户 systemd 服务）；
   - 解压 Node、npm、pnpm；
   - 从离线缓存安装 OpenClaw。
3. 首次验证：dsh 0.2.1-rc.2 可运行。
4. 发现严重问题：
   - 打开 dsh Web 页面提示 "Failed to load plugins / 16 entries did not activate"，所有 UI 插件停在 pending；
   - 日志显示 `workspace-controller` 导入失败：缺少 `@deepseek-ai/dsh-host-directory-picker`（另有 `office-to-pdf` 缺 `@deepseek-ai/libreoffice-kit`）；
   - 原因：0.2.1rc2 的 linux-arm64 运行时打包不完整。
5. 修复：
   - 从 PyPI 查询到新版 0.2.2rc2（linux-arm64 wheel 94.6MB）；
   - 因 CDN 慢，改用清华镜像下载，sha256 校验一致；
   - scp 到 Pi，解压替换 `~/.local/lib/dsh-runtime`；
   - 备份旧版为 `dsh-runtime-0.2.1rc2.bak`；
   - 重启 `dsh-web` 服务。
6. 复测：
   - `dsh --version` → 0.2.2-rc.2；
   - pending 计数 0；
   - 通过 SSH 隧道访问登录页 HTTP 200，页面正常。

**结果**

dsh 0.2.2-rc.2 安装完成，`dsh-web` 服务 active + enabled，token 登录 URL 可通过 SSH 隧道在电脑浏览器访问。

## 阶段 5｜OpenClaw 安装与 DeepSeek 模型接入

**做了什么**

1. OpenClaw 2026.10.9 已由离线包安装完成：
   - Node v24.22.2；
   - npm 离线安装 344 个包；
   - `openclaw --version` 正常。
2. 交互式 onboarding 时发现：没有 deepseek provider。
   - 检查确认 OpenClaw 的 DeepSeek 支持是官方插件 `@openclaw/deepseek-provider`；
   - 从 ClawHub 安装该插件；
   - 用户在自己终端里输入 DeepSeek API Key（`openclaw models auth paste-api-key --provider deepseek`，Key 不经过聊天、不写入文档）。
3. 设置默认模型：
   - 插件提供的模型：`deepseek-v4-flash`、`deepseek-v4-pro`、`deepseek-v4-flash-vision-exp`、`deepseek-flash`；
   - 设为 `deepseek/deepseek-v4-flash`；注意必须带 provider 前缀，只写 `deepseek` 会回退成 `openai/deepseek`。
4. 启动 Gateway daemon 时遇到 `[unsafe-permissions]`：`~/.config/systemd/user` 组可写，安装被拒绝；执行 `chmod 700 ~/.config/systemd/user` 后重试成功。
5. 真实验证：

   ```bash
   openclaw agent -m "Reply with exactly PONG" --json
   ```

   返回 PONG，`provider=deepseek`，`model=deepseek-v4-flash`，success。

**结果**

OpenClaw + DeepSeek 完全可用；Gateway 以 systemd 用户服务运行，linger 已开启，可开机自启。

## 阶段 6｜系统化自检、遗留清理与离线包更新

**做了什么**

1. Pi 侧自检：
   - dsh 运行时二进制 sha256 与 wheel 内文件完全一致；
   - dsh / openclaw / node 版本正确；服务 active、无 failed 单元；
   - 清理实验遗留：`eth0-tune.service`、`br0` / `dummy0`、`/tmp` 临时文件；
   - 确认 `~/projects` 工作目录存在；`wifi-hotspot.service` active + enabled。
2. 离线包更新（旧包 0.2.1rc2 会导致 Web 插件加载失败）：
   - wheelhouse 替换为 0.2.2rc2 runtime + SDK；
   - 更新 `versions.json`（新增 `dsh_runtime` / `dsh_sdk` 条目）；
   - 重新生成 `SHA256SUMS.txt`、`inventory.json`（33/33 通过）；
   - README 增补真机部署记录、已知坑与中文说明；
   - 重新生成精简 payload（310.7 MiB）。
3. 仓库卫生：
   - `.runtime/`、`acl-repair/` 加入 `.gitignore`；
   - 删除临时 `acl-repair` 目录；
   - 文件行尾统一为 LF。

**结果**

离线包与 Pi 实际版本一致，文档、校验、payload 全部同步更新。

## 阶段 7｜U 盘还原为空盘

**背景**

之前刷过 Lite 镜像的 COLORFUL 64GB U 盘需要恢复成普通 U 盘。

**做了什么**

1. 确认 Disk 1 = COLORFUL CU-VORTEX-M444，58.59GB，USB；
2. 以管理员权限：`Clear-Disk` → 建单分区占满全盘 → 格式化 exFAT；
3. 卷标 `COLORFUL`，盘符 `F:`；
4. 写入 / 读取 / 删除测试通过，容量 58.59GB 全部可用。

**注意**

原 U 盘内容已被镜像覆盖，无法恢复；格式化也不会修复该 U 盘在持续大写入时掉盘的硬件问题，之后只建议当普通小文件盘用。

## 阶段 8｜中文化与一键启动

**背景**

希望 OpenClaw 使用中文界面，并希望一键打开对话区。

**做了什么**

1. 语言能力调查：
   - Control UI（Dashboard 网页控制台）自带 zh-CN 语言包；
   - 配置项 `ui.prefs.locale`，设为 `zh-CN` 后界面中文（已验证）；
   - CLI / TUI 界面：当前 2026.10.9 没有中文语言包；检查 npm 最新 2026.11.3 主程序，`zh-CN` 出现次数仍为 0，说明命令行界面官方暂未本地化。
2. 回复语言：
   - 在 `~/.openclaw/workspace/USER.md` 写入持久指令 "Always reply in Simplified Chinese (简体中文) unless ..."；
   - 实测英文提问返回中文「四。」，指令生效。
3. 一键启动脚本：
   - `openclaw-console.bat` + `openclaw-launcher.ps1`：检查或尝试开启 Windows 移动热点 → ping Pi → 建 18789 SSH 隧道 → 取最新 dashboard token → 用默认浏览器打开 OpenClaw 对话 / 控制台；
   - `dsh-console.bat` + `dsh-launcher.ps1`：同上，改为 3080 隧道 + 取 dsh token + 打开 dsh Web；
   - 解释器脚本全部 ASCII，避免 PowerShell 5.1 中文编码问题；
   - 统一放在 `Desktop\Pi助手\`，桌面创建两个快捷方式；
   - 用 `-NoOpen` 模式实测两套启动器都能成功取 token。
4. 文档与计费说明：
   - 使用指南新增第 10 节（中文界面 / 回复）、第 11 节（一键启动）、第 12 节（token 计费）；
   - 明确：软件与 Pi 本地算力免费；调用 DeepSeek 云端模型按 token 从账户余额扣款，dsh 与 OpenClaw 共用同一类 Key 都会计费。

**结果**

OpenClaw 控制台中文可用、回复强制中文、桌面一键启动完成。

## 阶段 9｜OpenClaw 升级 2026.10.9 → 2026.11.3

**背景**

在 Control UI 点了「更新 Gateway」，触发官方更新流程。

**发生了什么 / 做了什么**

1. 更新流程实际阶段（通过 CLI 持续监控）：requested → staging → validating → activating → restarting → verifying → 完成。
2. 现象与处理：
   - 校验阶段约 4 分钟（下载 / 校验 npm 包）；
   - 激活阶段 `openclaw` 命令短暂消失（npm 替换安装目录），属正常；
   - 更新完成后 Gateway 没有自动拉起（inactive / dead），手动执行 `systemctl --user start openclaw-gateway`；
   - 插件版本漂移：deepseek provider 还是 2026.10.9；因 Gateway 占用状态库，`openclaw plugins update --all` 被拒（exclusive offline state ownership）；
   - 处理：先停 Gateway → 更新插件到 2026.11.3 → 再启动 Gateway；
   - 更新后 `openclaw models refresh` 在 Gateway 运行时被拒，属独占状态限制，不影响使用（模型列表正常）。
3. 最终自检：
   - version：OpenClaw 2026.11.3 (847611d)；
   - Gateway：running（systemd 用户服务，enabled）；
   - 默认模型：`deepseek/deepseek-v4-flash`；
   - 插件：deepseek 2026.11.3；
   - 真实 completion：返回 OK（`agent_exit=0`）；
   - dsh 侧不受影响（dsh-web 仍 active，0.2.2-rc.2）。

**结果**

OpenClaw 升级完成且功能正常。

## 最终现状

- **设备**：Raspberry Pi 5 / 8GB，SD 卡启动（64GB）
- **系统**：Raspberry Pi OS Lite（Trixie，64-bit）
- **主机名 / 用户**：`pi5` / `dsh`（SSH 公钥免密、sudo 免密）
- **网络**：Wi-Fi 热点 `pi5-link`，静态 `192.168.137.200`，网关 `192.168.137.1`，开机自动回连
- **远程访问**：Windows 移动热点 + SSH 隧道
- **dsh**：0.2.2-rc.2，`dsh-web.service` active + enabled，隧道访问 HTTP 200（token 登录）
- **OpenClaw**：2026.11.3，Gateway systemd 用户服务 running，模型 `deepseek/deepseek-v4-flash`（可切 v4-pro），live test 返回 OK
- **一键启动**：桌面快捷方式：OpenClaw 控制台 / dsh 控制台
- **离线包**：`E:\Creationism\pi5-deploy`（856.9 MiB，33 个文件 SHA256 全通过，内含 0.2.2rc2）
- **有线网卡**：已恢复系统默认设置（流控 / 节能 = 开启，速度 = 自动侦测）

## 经验与坑

1. microSD 转接卡套的写保护锁会让 Windows 报磁盘只读，先检查卡套。
2. 廉价 U 盘不适合长期做 Pi 系统盘（持续写入掉盘 / 卡死）。
3. 该台 Pi 5 与笔记本 Realtek 2.5G 网口直连时 10/100/1000M 都会断流；Wi-Fi 热点绕过后非常稳定。以后优先 Wi-Fi 或换网线 / USB 网卡。
4. Wi-Fi 方案必须同时配 `ipv4.gateway`，否则 Pi 没有外网。
5. dsh 0.2.1rc2 的 linux-arm64 包缺可选依赖，会导致 Web 插件全部 pending；必须用 0.2.2rc2 及以上。
6. OpenClaw 的 DeepSeek 支持是插件，离线包不含，需要联网从 ClawHub 安装。
7. `openclaw daemon install` 要求 `~/.config/systemd/user` 不可组可写。
8. Windows PowerShell 5.1 读取 UTF-8 无 BOM 的中文脚本会按 GBK 解码；生成 / 传递中文脚本时要用 .NET UTF8 读取或 base64。
9. 用 `Start-Process -Verb RunAs` 从非交互会话启动 UAC 可能不弹窗；需要操作的脚本让用户自己以管理员终端运行最稳。
10. dsh / OpenClaw 的 token 每次重启会变；一键启动脚本已自动获取。
11. 模型 ID 必须带 `provider/model`；只写 `deepseek` 会落到 `openai/deepseek`。
12. 软件与本地算力免费，但云端模型按 token 计费，Key 即资金凭证。

---

日志结束。设备与两个服务都在正常运行；这份记录留给下一次重装或换机时对照。

<p class="surreal-post-back"><a href="../../archives/">← 返回作品集</a></p>

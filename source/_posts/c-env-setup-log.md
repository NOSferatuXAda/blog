---
title: C 环境搭建工作日志
date: 2026-11-15 02:30:00
categories: 技术
tags:
  - C语言
  - 环境搭建
  - VS Code
description: 在 Windows + VS Code 上跑通第一个 C 程序，核心问题是中文路径。
comments: false
---

<div class="surreal-essay-marker" hidden></div>

在 Windows + VS Code 上搭 C 环境，从零到跑通 hello.c，花了 2.5 小时，踩了 8 个坑。6 个是环境问题，2 个是代码问题。

## 环境

Windows 11，中文用户名「宿」。VS Code + cpptools，MinGW-W64 GCC 16.2.0，GDB 18.1。

## 8 个坑

1. tasks.json 的 command 被一段提示文字占据，一构建就报 CommandNotFoundException。改成编译器绝对路径。
2. 头文件写成 studio.h，是 stdio 拼错了。
3. F5 弹「preLaunchTask 失败」，代码是对的，任务终端卡死。重启 VS Code。
4. 汇编器报 can't create 临时文件——用户名「宿」是中文，as.exe 打不开含中文的路径。
5. 链接器报找不到 crt2.o、-lmingw32——同样是中文路径，ld.exe 打不开自己安装目录里的库。
6. 改 PATH 时 -join 优先级用错，把 PATH 写坏，连 powershell.exe 都找不到。备份回滚。
7. 从树莓派拷来的 setup.ps1 是 LF 换行，PowerShell 5.1 解析 here-string 失败。转 CRLF + BOM。
8. 中文文件名编译出乱码 exe。改名 hello.c。

## 核心：中文路径

4、5、8 是同一类问题：MinGW 的 as.exe / ld.exe 是 POSIX 移植，遇非 ASCII 路径走 ANSI 接口，中文被按错误代码页解读，于是「文件存在却打不开」。

三个环节必须同时是纯 ASCII：工具链安装目录、临时目录、输出目录。只改一处，报错会变但不会消失。我一开始误判成 TEMP、MAX_PATH 问题，最后才定位到工具链路径。

试过 junction 映射到英文路径，失败——gcc 会把联接解析回真实路径。只能物理复制：

> robocopy 原目录 C:UsersPublicmingw64 /E /MT:16

917MB，复制完编译通过。

## 结果

工具链固定在 C:UsersPublicmingw64，工程移到纯英文目录。hello.c 编译、运行、调试正常，产出一份可复用的配置包。

## 第二部分：从「能跑」到「可分发」

第一部分解决的是「这台机器为什么跑不起来」。第二部分是另一个问题：换一台机器、换一个人，还跑得起来吗？答案是不一定。这一部分踩的坑，几乎全部来自「环境差异」，而不是代码。

### 四台设备

从头到尾不是一台机器：

- 宿（本机，中文用户名）：中文路径三连击
- 机房机（Administrator，英文）：连不上 GitHub、WT 没装
- daizi（第三台，D 盘装编译器）：chcp 找不到、PATH 异常
- pi5（树莓派）：作为版本仓库与中转站

早期我把三台机器的报错混在一起看，得出过「改了又改还是失败」的错误结论。其实每台机器的失败原因完全不同。判断依据是截图里的路径前缀——三个不一样，就是三台机器。

### 问题 9—20

9. Linux 脚本 LF 换行，PowerShell 5.1 解析不了 here-string。转 CRLF + BOM。
10. 桌面路径也是中文，输出目录带中文照样失败。工程移到纯英文目录。
11. 中文文件名出乱码 exe，gcc 按 ANSI 传参。改名 hello.c。
12. 把 PATH 写坏，-join 优先级高于 +，首项粘连。备份回滚。
13. 机房机连不上 GitHub（0x80072ee2 超时）。弃 winget，改走 gh-proxy.com 下载。
14. 命令把进度条吞了，Select-Object -Last 攒到管线结束才输出。去掉管道。
15. 任务标签对不上，dependsOn 写死的名字和扩展生成的名字差一个前缀，任务根本不跑。改运行时探测。
16. WT 找不到 powershell，相对名不可靠。改绝对路径。
17. chcp 也找不到，同上。改用 System32 下的 chcp.com 绝对路径。
18. 修好的文件没生效，「已存在就跳过」的幂等是危险的。改按内容比对。
19. 一行警告把脚本带走，$ErrorActionPreference=Stop 加 2>&1，第三方程序一句弃用警告就中止安装。外部命令临时切 Continue。
20. Permission denied，exe 被上次运行占着。写 kill-exe，任务链改成 kill → build → run。

### 版本演进

两条线并行：我在本机迭代，树莓派那侧同步产出另一分支。

初版 → v2（架构自适应）→ v3（绝对路径、dependsOn 探测、stderr 放行）→ v4 → v5（chcp 绝对路径、去内嵌副本）→ v6 → v7（kill-exe）→ v8 → v9 → 1.0。

分叉的代价：v2 和 v3 各自演化，合并时差点把 v2 的架构自适应丢掉。最后逐项 grep 关键特性才确认合并完整。

### 交付物

- c-vscode-kit-win-1.0.zip：10 文件，27,565 字节
- 新手教程：318 行，7 章 + 3 附录

### 验证方法

前期「改完就交付、等报错」，后期改成「改完先自证」：静态语法检查、BOM/CRLF 属性检查、临时目录动态自检、场景回归、解压复核、负向测试。

## 经验（一）

1. 报错先看清是哪个组件：Assembler、ld.exe、collect2 对应完全不同的原因。
2. 「文件存在却报找不到」，先怀疑编码，尤其中文用户名。
3. 别在桌面、文档、下载目录下编译 C，这些路径带中文。
4. 改 PATH 前先备份，改完逐条核对。
5. 跨平台脚本注意行尾，LF 和 CRLF 在 PowerShell here-string 上有实质差异。

## 经验（二）

1. 编码和行尾是文件的隐形属性。内容看着对，字节不对就是跑不起来。
2. 幂等要「比对内容」，不是「存在就跳过」。后者会让修好的版本永远进不去。
3. 配置文件的字符串耦合是雷。dependsOn、preLaunchTask 这类按名字关联的字段，能探测就不要写死。
4. 相对名在跨进程启动时不可靠。powershell.exe、chcp 这类系统命令，在 WT、计划任务里都可能解析不到，一律用绝对路径。
5. $ErrorActionPreference=Stop 加 2>&1 是危险组合。第三方程序的一句警告足以中止整个安装脚本。
6. 重复三次以上的手工操作，就该写成脚本。Permission denied 出现第三次，kill-exe 才做出来——早该做。
7. 版本分叉要尽早合并。v2 和 v3 并行两小时后，合并成本已经肉眼可见。
8. 交付物要能自证。没有自检步骤的安装包，等于把排错成本转嫁给用户。

<p class="surreal-post-back"><a href="../../archives/">← 返回作品集</a></p>

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

## 经验

1. 报错先看清是哪个组件：Assembler、ld.exe、collect2 对应完全不同的原因。
2. 「文件存在却报找不到」，先怀疑编码，尤其中文用户名。
3. 别在桌面、文档、下载目录下编译 C，这些路径带中文。
4. 改 PATH 前先备份，改完逐条核对。
5. 跨平台脚本注意行尾，LF 和 CRLF 在 PowerShell here-string 上有实质差异。

<p class="surreal-post-back"><a href="../../archives/">← 返回作品集</a></p>

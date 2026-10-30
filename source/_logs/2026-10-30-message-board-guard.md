---
title: 留言板限流与 Turnstile 上线
date: 2026-10-30 11:40:00
---

留言板完成了最后一层安全升级，现在开放留言的同时也有人机验证和频率限制。

- 接入 Cloudflare Turnstile：发送留言前需要完成一次人机验证
- 所有写入改由 Supabase Edge Function `message-guard` 处理
- 同一 IP 10 分钟内最多 5 条留言，超限会提示稍后再试
- 已撤销 anon 直接 insert 权限：绕过函数直接写库会返回 401
- Turnstile Secret 与 service role 仅存在于 Supabase 函数环境，不在前端
- 读取方式保持不变；留言页不会弹出公告，背景仍保持 60 FPS
- 测试数据已清理，留言板保留首条欢迎留言

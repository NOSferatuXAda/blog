---
title: 环流
layout: page
header: false
comments: false
---

<div class="surreal-gyre">
  <svg class="surreal-gyre__svg" viewBox="0 0 480 480" role="img" aria-label="环流示意图">
    <!-- 外环：暖流（表层） -->
    <circle cx="240" cy="240" r="176" class="gyre-ring-warm" />
    <!-- 内环：寒流（深层） -->
    <circle cx="240" cy="240" r="96" class="gyre-ring-cold" />

    <!-- 旋转环流带 -->
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="40s" repeatCount="indefinite" />
      <circle cx="240" cy="240" r="136" class="gyre-belt-dash" />
      <path d="M 372 232 L 388 240 L 372 248 Z" class="gyre-belt-arrow" />
      <path d="M 232 372 L 240 388 L 248 372 Z" class="gyre-belt-arrow" />
      <path d="M 108 232 L 92 240 L 108 248 Z" class="gyre-belt-arrow" />
      <path d="M 232 108 L 240 92 L 248 108 Z" class="gyre-belt-arrow" />
    </g>

    <!-- 节点 -->
    <a href="../archives/" class="gyre-node">
      <circle cx="240" cy="104" r="5" class="gyre-node-dot" />
      <text x="240" y="78" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">作品集</text>
    </a>
    <a href="../categories/日常/" class="gyre-node">
      <circle cx="369" cy="198" r="5" class="gyre-node-dot" />
      <text x="394" y="198" text-anchor="start" dominant-baseline="middle" class="gyre-node-label">随笔</text>
    </a>
    <a href="../categories/技术/" class="gyre-node">
      <circle cx="320" cy="350" r="5" class="gyre-node-dot" />
      <text x="320" y="380" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">实验</text>
    </a>
    <a href="../logs/" class="gyre-node">
      <circle cx="160" cy="350" r="5" class="gyre-node-dot" />
      <text x="160" y="380" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">公告</text>
    </a>
    <a href="../about/" class="gyre-node">
      <circle cx="111" cy="198" r="5" class="gyre-node-dot" />
      <text x="86" y="198" text-anchor="end" dominant-baseline="middle" class="gyre-node-label">关于</text>
    </a>

    <!-- 中心 -->
    <text x="240" y="234" text-anchor="middle" dominant-baseline="middle" class="gyre-center">环流</text>
    <text x="240" y="264" text-anchor="middle" dominant-baseline="middle" class="gyre-center-sub">H2O · 温盐环流</text>
  </svg>

  <p class="surreal-gyre__intro">一切最终汇入同一条洋流。</p>
  <p class="surreal-gyre__text">这里的随笔是暖流，漂在表面；实验记录是寒流，沉在深处。它们一上一下，首尾相接，转成一圈——谁也不是谁的终点，只是同一个环上的不同位置。</p>

  <ul class="surreal-gyre__links">
    <li><a href="../archives/">作品集</a></li>
    <li><a href="../categories/日常/">随笔</a></li>
    <li><a href="../categories/技术/">实验</a></li>
    <li><a href="../logs/">公告</a></li>
    <li><a href="../about/">关于</a></li>
  </ul>
</div>

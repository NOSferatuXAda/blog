---
title: 环流
layout: page
header: false
comments: false
---

<div class="surreal-gyre">
<svg class="surreal-gyre__svg" viewBox="0 0 480 480" role="img" aria-label="环流示意图">
<defs>
<radialGradient id="gyreGlow" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#ff1d1d" stop-opacity="0.22"/>
<stop offset="55%" stop-color="#ff1d1d" stop-opacity="0.06"/>
<stop offset="100%" stop-color="#ff1d1d" stop-opacity="0"/>
</radialGradient>

<g id="gyreKrill">
<ellipse cx="0" cy="0" rx="8" ry="2.5" class="gyre-krill-body"/>
<path d="M -7 -1 C -12 -5 -16 -4 -19 -2" class="gyre-krill-antenna"/>
<path d="M 8 0 L 14 -4 L 14 4 Z" class="gyre-krill-tail"/>
</g>

<line id="gyreSpeedline" x1="425" y1="228" x2="425" y2="252" class="gyre-speedline"/>
</defs>

<text x="240" y="40" text-anchor="middle" class="gyre-bleed">Ⅰ</text>
<text x="450" y="248" text-anchor="middle" class="gyre-bleed">Ⅱ</text>
<text x="240" y="462" text-anchor="middle" class="gyre-bleed">Ⅲ</text>
<text x="30" y="248" text-anchor="middle" class="gyre-bleed">Ⅳ</text>

<circle cx="240" cy="240" r="205" fill="url(#gyreGlow)" class="gyre-glow"/>

<circle cx="240" cy="240" r="163" class="gyre-arc gyre-arc--1"/>
<circle cx="240" cy="240" r="138" class="gyre-arc gyre-arc--2"/>
<circle cx="240" cy="240" r="112" class="gyre-arc gyre-arc--3"/>

<circle cx="240" cy="240" r="176" class="gyre-ring-warm"/>
<g>
<animateTransform attributeName="transform" type="rotate" values="4 240 240; 11 240 240; 4 240 240" dur="14s" repeatCount="indefinite"/>
<circle cx="240" cy="240" r="177" class="gyre-ring-ghost"/>
</g>

<g>
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="30s" repeatCount="indefinite"/>
<circle cx="240" cy="240" r="150" class="gyre-belt-dash gyre-belt-dash--warm"/>
</g>

<g>
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="48s" repeatCount="indefinite"/>
<circle cx="240" cy="240" r="126" class="gyre-belt-dash gyre-belt-dash--cold"/>
<path d="M 362 232 L 378 240 L 362 248 Z" class="gyre-belt-arrow"/>
<path d="M 232 362 L 240 378 L 248 362 Z" class="gyre-belt-arrow"/>
<path d="M 118 232 L 102 240 L 118 248 Z" class="gyre-belt-arrow"/>
</g>

<circle cx="240" cy="240" r="96" class="gyre-ring-cold"/>

<use href="#gyreSpeedline" transform="rotate(0 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(45 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(90 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(135 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(180 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(225 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(270 240 240)"/>
<use href="#gyreSpeedline" transform="rotate(315 240 240)"/>

<g class="gyre-krill">
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="30s" repeatCount="indefinite"/>
<g transform="translate(390 240) rotate(90)">
<use href="#gyreKrill"/>
</g>
</g>
<g class="gyre-krill">
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="48s" repeatCount="indefinite"/>
<g transform="translate(114 240) rotate(-90)">
<use href="#gyreKrill"/>
</g>
</g>
<g class="gyre-krill">
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="62s" repeatCount="indefinite"/>
<g transform="translate(240 70) rotate(180)">
<use href="#gyreKrill"/>
</g>
</g>

<g>
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="24s" repeatCount="indefinite"/>
<circle cx="412" cy="240" r="3" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="40s" repeatCount="indefinite"/>
<circle cx="350" cy="350" r="2" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="18s" repeatCount="indefinite"/>
<circle cx="240" cy="375" r="2.5" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="34s" repeatCount="indefinite"/>
<circle cx="127" cy="353" r="2" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="28s" repeatCount="indefinite"/>
<circle cx="122" cy="240" r="3" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="22s" repeatCount="indefinite"/>
<circle cx="134" cy="134" r="2" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="0 240 240" to="360 240 240" dur="36s" repeatCount="indefinite"/>
<circle cx="240" cy="112" r="2.5" class="gyre-particle"/>
</g>
<g>
<animateTransform attributeName="transform" type="rotate" from="360 240 240" to="0 240 240" dur="30s" repeatCount="indefinite"/>
<circle cx="359" cy="121" r="2" class="gyre-particle"/>
</g>

<a href="../archives/" class="gyre-node">
<circle cx="240" cy="90" r="5" class="gyre-node-dot"/>
<text x="240" y="70" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">作品集</text>
</a>
<a href="../categories/日常/" class="gyre-node">
<circle cx="383" cy="194" r="5" class="gyre-node-dot"/>
<text x="398" y="194" text-anchor="start" dominant-baseline="middle" class="gyre-node-label">随笔</text>
</a>
<a href="../categories/技术/" class="gyre-node">
<circle cx="328" cy="361" r="5" class="gyre-node-dot"/>
<text x="328" y="385" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">实验</text>
</a>
<a href="../logs/" class="gyre-node">
<circle cx="152" cy="361" r="5" class="gyre-node-dot"/>
<text x="152" y="385" text-anchor="middle" dominant-baseline="middle" class="gyre-node-label">公告</text>
</a>
<a href="../about/" class="gyre-node">
<circle cx="97" cy="194" r="5" class="gyre-node-dot"/>
<text x="82" y="194" text-anchor="end" dominant-baseline="middle" class="gyre-node-label">关于</text>
</a>

<text x="240" y="232" text-anchor="middle" dominant-baseline="middle" class="gyre-center" transform="rotate(-4 240 232)">环流</text>
<text x="240" y="264" text-anchor="middle" dominant-baseline="middle" class="gyre-center-sub" transform="rotate(2 240 264)">H2O · 温盐环流</text>
</svg>

<p class="surreal-gyre__intro">水在转。我也在转。</p>
<p class="surreal-gyre__text">暖流在上，寒流在下。我一会儿浮上去，一会儿沉下来，其实不知道自己在哪一层。</p>
<p class="surreal-gyre__text">浮上去的时候，我写漂着的话；沉下去的时候，我数没人看的数字。写完了，数完了，水又转回来，把我冲回原地。</p>
<p class="surreal-gyre__text">可环流没有原地。没有起点，没有终点，也没有中心——你站哪儿，哪儿就是中心，下一秒又不是了。</p>
<p class="surreal-gyre__text">所以别问方向。转就好了。</p>

<ul class="surreal-gyre__links">
<li><a href="../archives/">作品集</a></li>
<li><a href="../categories/日常/">随笔</a></li>
<li><a href="../categories/技术/">实验</a></li>
<li><a href="../logs/">公告</a></li>
<li><a href="../about/">关于</a></li>
</ul>
</div>

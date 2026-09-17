#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
多文件快速版：外层壳 + 独立页面文件（首屏秒开，按需加载）。
- 财务中台离线页面/财务中台原型.html          外层壳（只含侧边栏 + iframe，几十 KB）
- 财务中台离线页面/pages/xxx.html             38 个已内联好资源的页面（每个独立可 fetch）
- 财务中台离线页面/common/tailwind.js         共享 runtime（一次下载 + 浏览器缓存）
- 财务中台离线页面/common/lucide.min.js
使用：双击"财务中台原型.html"，iframe.src 按需加载单页。file:// 协议下可正常工作。
"""
import os
import re
import json
import html
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIST_DIR = os.path.join(ROOT, "财务中台离线页面")
PAGES_DIR = os.path.join(DIST_DIR, "pages")
COMMON_OUT = os.path.join(DIST_DIR, "common")
OUT_SHELL = os.path.join(DIST_DIR, "财务中台原型.html")

COMMON_DIR = os.path.join(ROOT, "common")


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_asset(rel_path):
    full = os.path.join(ROOT, rel_path)
    if not os.path.exists(full):
        return ""
    return read_text(full)


# ---------- 预加载 ----------
ASSETS = {
    "common/styles.css": load_asset("common/styles.css"),
    "common/prd-viewer.css": load_asset("common/prd-viewer.css"),
    "common/prd-viewer.js": load_asset("common/prd-viewer.js"),
    "common/scripts.js": load_asset("common/scripts.js"),
    "js/req-annotation.js": load_asset("js/req-annotation.js"),
    "js/subject-dropdown.js": load_asset("js/subject-dropdown.js"),
}
SIDEBAR_HTML = load_asset("common/sidebar.html")


# ---------- 页面列表 ----------
def list_pages():
    pages = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        pages.append(name)
    return pages


PAGES = list_pages()
print(f"[info] 发现 {len(PAGES)} 个页面")


# ---------- 页面级处理 ----------
def process_page(page_name):
    """把单个页面的 tailwind/lucide 引用改为同目录相对路径(../common/xxx),
    并内联 styles.css / scripts.js 等本地小文件,以便 iframe 加载后无需再 fetch。
    但 tailwind/lucide 保持独立文件引用,让浏览器缓存共享。"""
    src = read_text(os.path.join(ROOT, page_name))

    # tailwind: 用预编译 static CSS 替代 runtime(避免 400KB JS parse + 全 DOM 扫描)
    src = re.sub(
        r'<script\s+src=["\']https?://cdn\.tailwindcss\.com[^"\']*["\']\s*></script>',
        '<link rel="stylesheet" href="../common/tailwind.css">', src)
    src = re.sub(
        r'<script\s+src=["\']common/tailwind\.js["\']\s*></script>',
        '<link rel="stylesheet" href="../common/tailwind.css">', src)
    # 删除 tailwind.config = {...} 块(static CSS 不需要 runtime 配置,自定义色已内联在 tailwind.css)
    # 用非贪婪 [\s\S]*? 直接吃到 </script>,不再匹配 } 边界(避免多层花括号回溯失败)
    src = re.sub(
        r'<script>\s*tailwind\.config[\s\S]*?</script>',
        '<!-- tailwind.config removed: using precompiled CSS -->', src)
    # lucide: 匹配任意属性形态的 CDN 引用(带 onerror/defer 等)
    src = re.sub(
        r'<script[^>]*src=["\']https?://cdn\.jsdelivr\.net/npm/lucide[^>]*></script>',
        '<script src="../common/lucide.min.js"></script>', src)
    src = re.sub(
        r'<script[^>]*src=["\']https?://unpkg\.com/lucide[^>]*></script>',
        '<script src="../common/lucide.min.js"></script>', src)
    src = re.sub(
        r'<script[^>]*src=["\']common/lucide\.min\.js["\'][^>]*></script>',
        '<script src="../common/lucide.min.js"></script>', src)
    # 兜底:删除所有指向 googleapis/jsdelivr/unpkg 的外网脚本引用(离线阻塞)
    src = re.sub(
        r'<script[^>]*src=["\']https?://(?:cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|cdn\.tailwindcss\.com)[^>]*></script>',
        '<!-- external script removed for offline speed -->', src)
    src = re.sub(
        r'<link[^>]*href=["\']https?://(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>',
        '<!-- external link removed for offline speed -->', src)

    # 内联小型本地资源(避免 iframe 内再发 fetch)
    def inline_link_css(pattern, key):
        return re.sub(pattern,
                      lambda m: f'<style>\n{ASSETS[key]}\n</style>',
                      src)

    src = re.sub(
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']common/styles\.css["\']\s*/?>',
        lambda m: f'<style>\n{ASSETS["common/styles.css"]}\n</style>', src)
    src = re.sub(
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']common/prd-viewer\.css["\']\s*/?>',
        lambda m: f'<style>\n{ASSETS["common/prd-viewer.css"]}\n</style>', src)
    src = re.sub(
        r'<script\s+src=["\']common/prd-viewer\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["common/prd-viewer.js"]}\n</script>', src)
    src = re.sub(
        r'<script\s+src=["\']common/scripts\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["common/scripts.js"]}\n</script>', src)
    src = re.sub(
        r'<script\s+src=["\']js/req-annotation\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["js/req-annotation.js"]}\n</script>', src)
    src = re.sub(
        r'<script\s+src=["\']js/subject-dropdown\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["js/subject-dropdown.js"]}\n</script>', src)

    # 去掉 Google Fonts 外网引用(必须在 styles.css 内联之后,因为 @import 是 styles.css 里的)
    src = re.sub(
        r"@import\s+url\(['\"]?https?://(?:fonts\.googleapis\.com|fonts\.loli\.net)[^)]*\);?",
        "/* external font import removed for offline speed */", src)
    src = re.sub(
        r'<link[^>]*href=["\']https?://(?:fonts\.googleapis\.com|fonts\.gstatic\.com|fonts\.loli\.net)[^>]*>',
        '<!-- external font link removed for offline speed -->', src)
    # 图片占位服务(via.placeholder.com)离线会阻塞,替换成透明 data URL
    src = re.sub(
        r'https?://via\.placeholder\.com/[^"\'\s]*',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="sans-serif" font-size="12">placeholder</text></svg>',
        src)

    # 隐藏子页面自己的 sidebar-container(外层壳提供侧栏),
    # 并去掉主内容区的 ml-64(iframe 不需要偏移)
    src = re.sub(
        r'<div\s+id=["\']sidebar-container["\'][^>]*></div>',
        "", src)
    src = src.replace('class="flex-1 ml-64', 'class="flex-1 ')
    src = src.replace("class='flex-1 ml-64", "class='flex-1 ")

    # 页面内跳转 href="xxx.html" -> postMessage 通知父窗口切换页
    def replace_href(match):
        target = match.group(1)
        if target in PAGES:
            return (f'href="javascript:void(0)" '
                    f"onclick=\"parent.postMessage({{type:'navigate',page:'{target}'}}, '*')\"")
        return match.group(0)

    src = re.sub(r'href="([\w\-]+\.html)"', replace_href, src)

    return src


# ---------- 外层壳 ----------
SHELL_SIDEBAR_CSS = """
#sidebar-container aside.sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 16rem; z-index: 10; overflow-y: auto; color: #fff; }
#sidebar-container .w-64 { width: 16rem; }
#sidebar-container .flex { display: flex; }
#sidebar-container .items-center { align-items: center; }
#sidebar-container .justify-between { justify-content: space-between; }
#sidebar-container .p-2 { padding: .5rem; }
#sidebar-container .p-4 { padding: 1rem; }
#sidebar-container .px-2 { padding-left: .5rem; padding-right: .5rem; }
#sidebar-container .px-4 { padding-left: 1rem; padding-right: 1rem; }
#sidebar-container .py-1\\.5 { padding-top: .375rem; padding-bottom: .375rem; }
#sidebar-container .py-2 { padding-top: .5rem; padding-bottom: .5rem; }
#sidebar-container .py-3 { padding-top: .75rem; padding-bottom: .75rem; }
#sidebar-container .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
#sidebar-container .pl-6 { padding-left: 1.5rem; }
#sidebar-container .mr-2 { margin-right: .5rem; }
#sidebar-container .mr-3 { margin-right: .75rem; }
#sidebar-container .mt-4 { margin-top: 1rem; }
#sidebar-container .ml-auto { margin-left: auto; }
#sidebar-container .border-b { border-bottom: 1px solid rgba(255,255,255,.2); }
#sidebar-container .rounded-md { border-radius: .375rem; }
#sidebar-container .rounded-full { border-radius: 9999px; }
#sidebar-container .text-white\\/90 { color: rgba(255,255,255,.9); }
#sidebar-container .text-white\\/80 { color: rgba(255,255,255,.8); }
#sidebar-container .text-white\\/70 { color: rgba(255,255,255,.7); }
#sidebar-container .text-xs { font-size: .75rem; line-height: 1rem; }
#sidebar-container .text-sm { font-size: .875rem; }
#sidebar-container .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
#sidebar-container .text-\\[10px\\] { font-size: 10px; }
#sidebar-container .font-semibold { font-weight: 600; }
#sidebar-container .uppercase { text-transform: uppercase; }
#sidebar-container .tracking-wider { letter-spacing: .05em; }
#sidebar-container .cursor-pointer { cursor: pointer; }
#sidebar-container .transition-transform { transition: transform .2s; }
#sidebar-container .hidden { display: none !important; }
#sidebar-container .bg-red-500 { background: #ef4444; color: #fff; }
#sidebar-container .px-1\\.5 { padding-left: .375rem; padding-right: .375rem; }
#sidebar-container .py-0\\.5 { padding-top: .125rem; padding-bottom: .125rem; }
#sidebar-container a, #sidebar-container a:hover, #sidebar-container a:visited, #sidebar-container a:focus { text-decoration: none; color: inherit; }
#sidebar-container button:hover, #sidebar-container a:hover { background: rgba(255,255,255,.1); }
#sidebar-container .w-3\\.5 { width: .875rem; } #sidebar-container .h-3\\.5 { height: .875rem; }
#sidebar-container .w-4 { width: 1rem; } #sidebar-container .h-4 { height: 1rem; }
#sidebar-container .w-5 { width: 1.25rem; } #sidebar-container .h-5 { height: 1.25rem; }
#page-frame { position: absolute; left: 16rem; top: 0; right: 0; bottom: 0; width: calc(100% - 16rem); height: 100%; border: 0; }
"""


def build_shell():
    default_page = "index.html" if "index.html" in PAGES else PAGES[0]
    sidebar_js = json.dumps(SIDEBAR_HTML)
    styles_css = ASSETS["common/styles.css"]
    # 去掉 shell 内 Google Fonts / loli.net 引用(离线环境会 TCP 超时阻塞)
    styles_css = re.sub(
        r"@import\s+url\(['\"]?https?://(?:fonts\.googleapis\.com|fonts\.loli\.net)[^)]*\);?",
        "/* external font import removed */", styles_css)
    scripts_js = json.dumps(ASSETS["common/scripts.js"])

    shell = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>财务中台 · 快速原型</title>
<style>
{styles_css}
{SHELL_SIDEBAR_CSS}
html, body {{ height: 100%; margin: 0; }}
.app {{ position: relative; height: 100vh; }}
.notice {{ position: fixed; right: 12px; bottom: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; z-index: 9999; }}
</style>
</head>
<body class="bg-neutral">
<div class="app">
  <div id="sidebar-container"></div>
  <iframe id="page-frame" title="page" src="pages/{default_page}"></iframe>
</div>
<div class="notice">财务中台原型 · 快速版</div>

<script>
// 注入侧边栏
document.getElementById('sidebar-container').innerHTML = {sidebar_js};

// 事件委托:侧边栏点击 -> 切 iframe.src
document.getElementById('sidebar-container').addEventListener('click', function(e) {{
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  const m = href.match(/([\\w\\-]+\\.html)(?:[?#].*)?$/);
  if (m) {{
    e.preventDefault();
    e.stopPropagation();
    loadPage(m[1]);
  }}
}}, true);

// 加载 scripts.js(侧边栏折叠等)
(function(){{
  const s = document.createElement('script');
  s.textContent = {scripts_js};
  document.body.appendChild(s);
  if (typeof window.initCommonFunctions === 'function') {{
    try {{ window.initCommonFunctions(); }} catch(err) {{ console.warn(err); }}
  }}
}})();

function loadPage(name) {{
  const frame = document.getElementById('page-frame');
  frame.src = 'pages/' + name;
  document.querySelectorAll('#sidebar a').forEach(a => a.classList.remove('active'));
}}

// 监听 iframe 内跳转
window.addEventListener('message', (e) => {{
  const data = e.data || {{}};
  if (data.type === 'navigate' && data.page) loadPage(data.page);
}});

// 侧边栏图标空闲加载(不阻塞首屏)
function loadShellLucide() {{
  const s = document.createElement('script');
  s.src = 'common/lucide.min.js';
  s.onload = function() {{
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }};
  document.body.appendChild(s);
}}
if ('requestIdleCallback' in window) {{
  requestIdleCallback(loadShellLucide, {{ timeout: 2000 }});
}} else {{
  setTimeout(loadShellLucide, 300);
}}
</script>
</body>
</html>
"""
    return shell


# ---------- Arbitrary values 生成器(tailwind v3 特性,v2 完整版不支持) ----------
def generate_arbitrary_css():
    """扫描所有原始页面,把 arbitrary class(如 w-[60px]/bg-[#00b365]/text-[14px]) 编译成静态 CSS。"""
    # 收集所有 arbitrary class:  <前缀>-[<值>]
    # 支持前缀:w/h/min-w/min-h/max-w/max-h/text/bg/border/border-{t,r,b,l}/rounded/rounded-{tl,tr,bl,br,t,r,b,l}
    #         /p/px/py/pt/pr/pb/pl/m/mx/my/mt/mr/mb/ml/top/right/bottom/left/gap/gap-x/gap-y/space-x/space-y/leading/tracking
    pattern = re.compile(
        r'\b((?:min-|max-)?(?:w|h)|'
        r'text|bg|border(?:-[trblxy])?|ring|'
        r'rounded(?:-(?:tl|tr|bl|br|t|r|b|l))?|'
        r'p[xylrtb]?|m[xylrtb]?|'
        r'top|right|bottom|left|'
        r'gap(?:-[xy])?|space-[xy]|'
        r'leading|tracking|content|'
        r'inset(?:-[xy])?|'
        r'z|opacity|shadow'
        r')-\[([^\]\s]+)\]'
    )
    collected = {}  # key: 完整 class 字符串, value: (prefix, value)
    for name in PAGES:
        src = os.path.join(ROOT, name)
        if not os.path.exists(src):
            continue
        text = read_text(src)
        for m in pattern.finditer(text):
            full = m.group(0)
            collected[full] = (m.group(1), m.group(2))

    # 前缀 -> CSS 属性映射
    prop_map = {
        "w": "width", "h": "height",
        "min-w": "min-width", "min-h": "min-height",
        "max-w": "max-width", "max-h": "max-height",
        "text": None,  # 需要根据值判断是颜色还是字号
        "bg": "background-color",
        "border": "border-color",
        "border-t": "border-top-color", "border-r": "border-right-color",
        "border-b": "border-bottom-color", "border-l": "border-left-color",
        "border-x": ("border-left-color", "border-right-color"),
        "border-y": ("border-top-color", "border-bottom-color"),
        "ring": "--tw-ring-color",
        "rounded": "border-radius",
        "rounded-tl": "border-top-left-radius", "rounded-tr": "border-top-right-radius",
        "rounded-bl": "border-bottom-left-radius", "rounded-br": "border-bottom-right-radius",
        "rounded-t": ("border-top-left-radius", "border-top-right-radius"),
        "rounded-r": ("border-top-right-radius", "border-bottom-right-radius"),
        "rounded-b": ("border-bottom-left-radius", "border-bottom-right-radius"),
        "rounded-l": ("border-top-left-radius", "border-bottom-left-radius"),
        "p": "padding",
        "px": ("padding-left", "padding-right"), "py": ("padding-top", "padding-bottom"),
        "pt": "padding-top", "pr": "padding-right", "pb": "padding-bottom", "pl": "padding-left",
        "m": "margin",
        "mx": ("margin-left", "margin-right"), "my": ("margin-top", "margin-bottom"),
        "mt": "margin-top", "mr": "margin-right", "mb": "margin-bottom", "ml": "margin-left",
        "top": "top", "right": "right", "bottom": "bottom", "left": "left",
        "gap": "gap", "gap-x": "column-gap", "gap-y": "row-gap",
        "leading": "line-height", "tracking": "letter-spacing",
        "z": "z-index", "opacity": "opacity",
    }

    lines = ["\n/* ===== fms arbitrary values (tailwind v3 语法兼容层) ===== */\n"]
    for full, (prefix, value) in sorted(collected.items()):
        # CSS 转义: [ 和 ] 和 # 都要转义
        escaped = re.sub(r'([\[\]#().,/])', r'\\\1', full)
        # 处理值中的下划线 -> 空格(tailwind v3 语法)
        css_value = value.replace('_', ' ')

        if prefix == "text":
            # text-[#xxx] 视为颜色, text-[14px]/text-[1rem] 视为字号
            if value.startswith('#') or value.startswith('rgb') or value.startswith('hsl'):
                lines.append(f".{escaped}{{color:{css_value}}}\n")
            else:
                lines.append(f".{escaped}{{font-size:{css_value}}}\n")
        elif prefix in ("space-x", "space-y"):
            # space-x/y 用 > * + * 选择器
            axis = "left" if prefix == "space-x" else "top"
            lines.append(f".{escaped} > :not([hidden]) ~ :not([hidden]){{margin-{axis}:{css_value}}}\n")
        elif prefix in ("inset", "inset-x", "inset-y"):
            if prefix == "inset":
                lines.append(f".{escaped}{{top:{css_value};right:{css_value};bottom:{css_value};left:{css_value}}}\n")
            elif prefix == "inset-x":
                lines.append(f".{escaped}{{left:{css_value};right:{css_value}}}\n")
            else:
                lines.append(f".{escaped}{{top:{css_value};bottom:{css_value}}}\n")
        elif prefix == "shadow":
            lines.append(f".{escaped}{{box-shadow:{css_value}}}\n")
        elif prefix == "content":
            lines.append(f".{escaped}{{content:{css_value}}}\n")
        elif prefix in prop_map:
            prop = prop_map[prefix]
            if isinstance(prop, tuple):
                decl = ";".join(f"{p}:{css_value}" for p in prop)
                lines.append(f".{escaped}{{{decl}}}\n")
            elif prop:
                lines.append(f".{escaped}{{{prop}:{css_value}}}\n")
    print(f"[info] arbitrary values 生成 {len(collected)} 条 CSS 规则")
    return "".join(lines)


# ---------- v3 新增调色板补丁(tailwind v2 完整版缺失) ----------
# 覆盖 amber/emerald/orange/cyan/teal/violet/rose/sky/lime/fuchsia/slate/zinc/stone(v3 palette)
# + 自定义 primary/secondary/accent/neutral
V3_PALETTE = {
    "amber":   {"50":"#fffbeb","100":"#fef3c7","200":"#fde68a","300":"#fcd34d","400":"#fbbf24","500":"#f59e0b","600":"#d97706","700":"#b45309","800":"#92400e","900":"#78350f"},
    "emerald": {"50":"#ecfdf5","100":"#d1fae5","200":"#a7f3d0","300":"#6ee7b7","400":"#34d399","500":"#10b981","600":"#059669","700":"#047857","800":"#065f46","900":"#064e3b"},
    "orange":  {"50":"#fff7ed","100":"#ffedd5","200":"#fed7aa","300":"#fdba74","400":"#fb923c","500":"#f97316","600":"#ea580c","700":"#c2410c","800":"#9a3412","900":"#7c2d12"},
    "cyan":    {"50":"#ecfeff","100":"#cffafe","200":"#a5f3fc","300":"#67e8f9","400":"#22d3ee","500":"#06b6d4","600":"#0891b2","700":"#0e7490","800":"#155e75","900":"#164e63"},
    "teal":    {"50":"#f0fdfa","100":"#ccfbf1","200":"#99f6e4","300":"#5eead4","400":"#2dd4bf","500":"#14b8a6","600":"#0d9488","700":"#0f766e","800":"#115e59","900":"#134e4a"},
    "violet":  {"50":"#f5f3ff","100":"#ede9fe","200":"#ddd6fe","300":"#c4b5fd","400":"#a78bfa","500":"#8b5cf6","600":"#7c3aed","700":"#6d28d9","800":"#5b21b6","900":"#4c1d95"},
    "rose":    {"50":"#fff1f2","100":"#ffe4e6","200":"#fecdd3","300":"#fda4af","400":"#fb7185","500":"#f43f5e","600":"#e11d48","700":"#be123c","800":"#9f1239","900":"#881337"},
    "sky":     {"50":"#f0f9ff","100":"#e0f2fe","200":"#bae6fd","300":"#7dd3fc","400":"#38bdf8","500":"#0ea5e9","600":"#0284c7","700":"#0369a1","800":"#075985","900":"#0c4a6e"},
    "lime":    {"50":"#f7fee7","100":"#ecfccb","200":"#d9f99d","300":"#bef264","400":"#a3e635","500":"#84cc16","600":"#65a30d","700":"#4d7c0f","800":"#3f6212","900":"#365314"},
    "slate":   {"50":"#f8fafc","100":"#f1f5f9","200":"#e2e8f0","300":"#cbd5e1","400":"#94a3b8","500":"#64748b","600":"#475569","700":"#334155","800":"#1e293b","900":"#0f172a"},
}
PRIMARY_HEX = "#003eb3"  # fms 主品牌色


def generate_v3_palette_css():
    """为 v2 缺失的 v3 调色板生成 bg/text/border/ring/from/to/via/divide/placeholder 全套 CSS。"""
    lines = ["\n/* ===== v3 palette 补丁 (amber/emerald/orange/cyan/teal/violet/...) ===== */\n"]
    for color, shades in V3_PALETTE.items():
        for shade, hex_val in shades.items():
            lines.append(
                f".bg-{color}-{shade}{{background-color:{hex_val}}}"
                f".text-{color}-{shade}{{color:{hex_val}}}"
                f".border-{color}-{shade}{{border-color:{hex_val}}}"
                f".ring-{color}-{shade}{{--tw-ring-color:{hex_val}}}"
                f".from-{color}-{shade}{{--tw-gradient-from:{hex_val};--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(255,255,255,0))}}"
                f".to-{color}-{shade}{{--tw-gradient-to:{hex_val}}}"
                f".via-{color}-{shade}{{--tw-gradient-stops:var(--tw-gradient-from),{hex_val},var(--tw-gradient-to,rgba(255,255,255,0))}}"
                f".hover\\:bg-{color}-{shade}:hover{{background-color:{hex_val}}}"
                f".hover\\:text-{color}-{shade}:hover{{color:{hex_val}}}"
                f".hover\\:border-{color}-{shade}:hover{{border-color:{hex_val}}}\n"
            )
    # 自定义 primary 参与 gradient(from-primary/to-primary)
    lines.append(
        f".from-primary{{--tw-gradient-from:{PRIMARY_HEX};--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(255,255,255,0))}}"
        f".to-primary{{--tw-gradient-to:{PRIMARY_HEX}}}"
        f".via-primary{{--tw-gradient-stops:var(--tw-gradient-from),{PRIMARY_HEX},var(--tw-gradient-to,rgba(255,255,255,0))}}\n"
    )
    print(f"[info] v3 palette 补丁生成 {sum(len(s) for s in V3_PALETTE.values())} 色 x 10 属性")
    return "".join(lines)


# ---------- 输出 ----------
def main():
    # 清空 财务中台离线页面 并重建
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(PAGES_DIR, exist_ok=True)
    os.makedirs(COMMON_OUT, exist_ok=True)

    # 拷贝共享 runtime(lucide) + 预编译 tailwind CSS
    # 说明:tailwind 不再用 CDN runtime,改用 tailwind.css 预编译版(见 common/tailwind.css)
    for f in ["lucide.min.js"]:
        srcf = os.path.join(COMMON_DIR, f)
        if os.path.exists(srcf):
            shutil.copy2(srcf, os.path.join(COMMON_OUT, f))
            print(f"[copy] common/{f}")
    # tailwind.css: 优先用工作副本 tools/tailwind.css,否则回落到 /tmp/tailwind-full.css
    tw_src_candidates = [
        os.path.join(os.path.dirname(__file__), "tailwind.css"),
        "/tmp/tailwind-full.css",
    ]
    tw_written = False
    for cand in tw_src_candidates:
        if os.path.exists(cand):
            css = read_text(cand)
            # 追加 4 个自定义色(primary/secondary/accent/neutral)
            css += """

/* ===== fms 自定义扩展色 ===== */
.text-primary{color:#003eb3}.bg-primary{background-color:#003eb3}.border-primary{border-color:#003eb3}
.text-secondary{color:#e6f0ff}.bg-secondary{background-color:#e6f0ff}.border-secondary{border-color:#e6f0ff}
.text-accent{color:#ff6b6b}.bg-accent{background-color:#ff6b6b}.border-accent{border-color:#ff6b6b}
.text-neutral{color:#f5f7fa}.bg-neutral{background-color:#f5f7fa}.border-neutral{border-color:#f5f7fa}
.hover\\:bg-primary:hover{background-color:#003eb3}
.hover\\:text-primary:hover{color:#003eb3}
.hover\\:bg-secondary:hover{background-color:#e6f0ff}
.ring-primary{--tw-ring-color:#003eb3}
.focus\\:ring-primary:focus{--tw-ring-color:#003eb3}
.focus\\:border-primary:focus{border-color:#003eb3}
.accent-primary{accent-color:#003eb3}
.rounded-sm{border-radius:4px}.rounded-md{border-radius:8px}.rounded-lg{border-radius:12px}.rounded-xl{border-radius:16px}
"""
            # ===== 生成 arbitrary values CSS(tailwind v3 特性,v2 完整版不支持) =====
            arbitrary_css = generate_arbitrary_css()
            css += arbitrary_css
            # ===== v3 palette 补丁 (amber/emerald/orange/cyan/teal/violet/...) =====
            palette_css = generate_v3_palette_css()
            css += palette_css
            with open(os.path.join(COMMON_OUT, "tailwind.css"), "w", encoding="utf-8") as fp:
                fp.write(css)
            print(f"[copy] common/tailwind.css (from {cand}, {len(css)//1024} KB, +arbitrary {len(arbitrary_css)//1024} KB, +palette {len(palette_css)//1024} KB)")
            tw_written = True
            break
    if not tw_written:
        print("[warn] 未找到 tailwind.css 源文件,页面样式会崩")

    # 处理每个页面并写到 pages/
    for name in PAGES:
        processed = process_page(name)
        with open(os.path.join(PAGES_DIR, name), "w", encoding="utf-8") as f:
            f.write(processed)
    print(f"[done] 已生成 {len(PAGES)} 个页面 -> {PAGES_DIR}")

    # 写外层壳
    with open(OUT_SHELL, "w", encoding="utf-8") as f:
        f.write(build_shell())
    shell_kb = os.path.getsize(OUT_SHELL) / 1024
    print(f"[done] 已生成外层壳 {OUT_SHELL}  ({shell_kb:.1f} KB)")
    print(f"[done] 双击 {OUT_SHELL} 即可使用")

    # ---------- 自动打包 zip（方便直接发给外部）----------
    import zipfile
    zip_path = os.path.join(ROOT, "财务中台离线页面.zip")
    if os.path.exists(zip_path):
        os.remove(zip_path)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for dirpath, _, filenames in os.walk(DIST_DIR):
            for fn in filenames:
                if fn == ".DS_Store":
                    continue
                abs_p = os.path.join(dirpath, fn)
                # 保留顶层文件夹名，解压后是 财务中台离线页面/xxx
                arc_p = os.path.relpath(abs_p, ROOT)
                zf.write(abs_p, arc_p)
    zip_mb = os.path.getsize(zip_path) / 1024 / 1024
    print(f"[done] 已打包 {zip_path}  ({zip_mb:.2f} MB)  ← 直接发这个 zip")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 fms20260324/ 下的多页原型合并为一个自包含 HTML。
- 页面通过 iframe(srcdoc) 承载，互相隔离，避免样式/id 冲突
- tailwind、lucide 保留 CDN 引用（体积友好，需联网）
- 本地 common/*.css common/*.js js/*.js styles 内联到每个 iframe
- 侧边栏跳转改为 postMessage，切换外层壳的 iframe srcdoc
产物：dist/财务中台原型-单文件.html
"""
import os
import re
import json
import html
import base64

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIST_DIR = os.path.join(ROOT, "dist")
OUT_FILE = os.path.join(DIST_DIR, "财务中台原型-单文件.html")

COMMON_DIR = os.path.join(ROOT, "common")
JS_DIR = os.path.join(ROOT, "js")


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_asset(rel_path):
    """读取相对 ROOT 的资源文件"""
    full = os.path.join(ROOT, rel_path)
    if not os.path.exists(full):
        return ""
    return read_text(full)


# ---------- 1. 预加载所有需要内联的本地资源 ----------
ASSETS = {
    "common/styles.css": load_asset("common/styles.css"),
    "common/prd-viewer.css": load_asset("common/prd-viewer.css"),
    "common/prd-viewer.js": load_asset("common/prd-viewer.js"),
    "common/scripts.js": load_asset("common/scripts.js"),
    "js/req-annotation.js": load_asset("js/req-annotation.js"),
    "js/subject-dropdown.js": load_asset("js/subject-dropdown.js"),
    "common/prd-sections.json": load_asset("common/prd-sections.json"),
    "common/prd-full.html": load_asset("common/prd-full.html"),
    "common/soft-project-task-drawer.html": load_asset("common/soft-project-task-drawer.html"),
}

SIDEBAR_HTML = load_asset("common/sidebar.html")


# ---------- 2. 收集所有页面 ----------
def list_pages():
    pages = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        # 只取顶层，不含 index/README
        if name in ("index.html",):
            continue
        # 跳过 .bak / .deleted 已被扩展名过滤
        pages.append(name)
    return pages


PAGES = list_pages()
print(f"[info] 发现 {len(PAGES)} 个页面待打包")


# ---------- 3. 页面级改写 ----------
CDN_TAILWIND = "https://cdn.tailwindcss.com"
CDN_LUCIDE = "https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"

# 本地 tailwind / lucide（离线模式必需）
TAILWIND_JS = load_asset("common/tailwind.js")
LUCIDE_JS = load_asset("common/lucide.min.js")
OFFLINE_MODE = bool(TAILWIND_JS) and bool(LUCIDE_JS)
if OFFLINE_MODE:
    print("[info] 离线模式：将内联 tailwind + lucide")
else:
    print("[warn] 未找到 common/tailwind.js 或 common/lucide.min.js，回退到 CDN 模式")


def inline_page(page_name):
    """读取单个页面 HTML，改写本地资源引用为内联；返回改写后的完整 HTML 字符串。"""
    src = read_text(os.path.join(ROOT, page_name))

    # 3.1 处理 tailwind / lucide 引用（离线模式改成从父窗口共享同一份代码,避免 38x800KB 膨胀）
    if OFFLINE_MODE:
        src = re.sub(
            r'<script\s+src=["\']https?://cdn\.tailwindcss\.com[^"\']*["\']\s*></script>',
            "", src)
        src = re.sub(
            r'<script\s+src=["\']https?://cdn\.jsdelivr\.net/npm/lucide[^"\']*["\']\s*></script>',
            "", src)
        src = re.sub(
            r'<script\s+src=["\']common/tailwind\.js["\']\s*></script>',
            "", src)
        src = re.sub(
            r'<script\s+src=["\']common/lucide\.min\.js["\']\s*></script>',
            "", src)
        # 从父窗口共享 tailwind + lucide 源码(读父页 <script type=text/plain> 的 textContent),
        # 避免每页内嵌 800KB
        shared_libs = """
<script>
(function(){
  try {
    if (window.parent && window.parent !== window) {
      var pd = window.parent.document;
      var twNode = pd.getElementById('__tailwind_src__');
      var lcNode = pd.getElementById('__lucide_src__');
      if (twNode) { var s1 = document.createElement('script'); s1.textContent = twNode.textContent; document.head.appendChild(s1); }
      if (lcNode) { var s2 = document.createElement('script'); s2.textContent = lcNode.textContent; document.head.appendChild(s2); }
    }
  } catch(e) { console.warn('shared libs load failed', e); }
})();
</script>
"""
        if "<head>" in src:
            src = src.replace("<head>", "<head>\n" + shared_libs, 1)
    else:
        src = re.sub(
            r'<script\s+src=["\']common/tailwind\.js["\']\s*></script>',
            lambda m: f'<script src="{CDN_TAILWIND}"></script>', src)
        src = re.sub(
            r'<script\s+src=["\']common/lucide\.min\.js["\']\s*></script>',
            lambda m: f'<script src="{CDN_LUCIDE}"></script>', src)

    # 3.2 内联 common/styles.css
    src = re.sub(
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']common/styles\.css["\']\s*/?>',
        lambda m: f'<style>\n{ASSETS["common/styles.css"]}\n</style>',
        src,
    )
    # 3.3 内联 common/prd-viewer.css
    src = re.sub(
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']common/prd-viewer\.css["\']\s*/?>',
        lambda m: f'<style>\n{ASSETS["common/prd-viewer.css"]}\n</style>',
        src,
    )
    # 3.4 内联 common/prd-viewer.js
    src = re.sub(
        r'<script\s+src=["\']common/prd-viewer\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["common/prd-viewer.js"]}\n</script>',
        src,
    )
    # 3.5 内联 common/scripts.js
    src = re.sub(
        r'<script\s+src=["\']common/scripts\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["common/scripts.js"]}\n</script>',
        src,
    )
    # 3.6 内联 js/req-annotation.js
    src = re.sub(
        r'<script\s+src=["\']js/req-annotation\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["js/req-annotation.js"]}\n</script>',
        src,
    )
    # 3.7 内联 js/subject-dropdown.js
    src = re.sub(
        r'<script\s+src=["\']js/subject-dropdown\.js["\'](\s+defer)?\s*></script>',
        lambda m: f'<script>\n{ASSETS["js/subject-dropdown.js"]}\n</script>',
        src,
    )

    # 3.8 移除子页面里 fetch common/sidebar.html 的逻辑（由外层壳统一提供侧边栏）
    #     方案：把 sidebar-container 隐藏 + main-content 的 ml-64 去掉
    src = re.sub(
        r'<div\s+id=["\']sidebar-container["\'][^>]*></div>',
        "",
        src,
    )
    # 主内容区去掉 ml-64（因为不在外层壳的左侧偏移下）
    src = src.replace('class="flex-1 ml-64', 'class="flex-1 ')
    src = src.replace("class='flex-1 ml-64", "class='flex-1 ")

    # 3.9 页面内跳转 href="xxx.html" -> postMessage 通知父窗口切换页
    def replace_href(match):
        target = match.group(1)
        if target in PAGES or target == "index.html":
            return f'href="javascript:void(0)" onclick="parent.postMessage({{type:\'navigate\',page:\'{target}\'}}, \'*\')"'
        return match.group(0)

    src = re.sub(r'href="([\w\-]+\.html)"', replace_href, src)

    # 3.10 处理 fetch 常用资源：prd-sections.json / prd-full.html / sidebar.html
    #      简单粗暴：注入到 window 上，让原代码能读到（如果代码使用 fetch，则拦截 fetch）
    prd_sections_b64 = base64.b64encode(ASSETS["common/prd-sections.json"].encode("utf-8")).decode()
    prd_full_b64 = base64.b64encode(ASSETS["common/prd-full.html"].encode("utf-8")).decode()
    drawer_b64 = base64.b64encode(ASSETS["common/soft-project-task-drawer.html"].encode("utf-8")).decode()
    sidebar_b64 = base64.b64encode(SIDEBAR_HTML.encode("utf-8")).decode()

    fetch_shim = f"""
<script>
(function(){{
  const _origFetch = window.fetch ? window.fetch.bind(window) : null;
  const inlineMap = {{
    'common/prd-sections.json': atob('{prd_sections_b64}'),
    'common/prd-full.html': atob('{prd_full_b64}'),
    'common/soft-project-task-drawer.html': atob('{drawer_b64}'),
    'common/sidebar.html': atob('{sidebar_b64}'),
  }};
  window.fetch = function(url, opts){{
    try{{
      const raw = typeof url === 'string' ? url : (url && url.url) || '';
      const clean = raw.split('?')[0];
      for (const key in inlineMap){{
        if (clean === key || clean.endsWith('/' + key)){{
          const body = inlineMap[key];
          return Promise.resolve(new Response(body, {{status:200, headers:{{'Content-Type': key.endsWith('.json')?'application/json':'text/html'}}}}));
        }}
      }}
    }}catch(e){{}}
    return _origFetch ? _origFetch(url, opts) : Promise.reject(new Error('fetch not available'));
  }};
}})();
</script>
"""
    # 把 shim 插到 </head> 前
    if "</head>" in src:
        src = src.replace("</head>", fetch_shim + "\n</head>", 1)
    else:
        src = fetch_shim + src

    return src


# ---------- 4. 组装外层壳 ----------
def build_shell():
    # 每个页面的 HTML 单独作为一个 <script type="text/plain"> 块存放,避免 38 页 srcdoc
    # 一次性塞进单个 JSON 导致浏览器解析卡死(懒加载:切页时才读 textContent)
    pages_map = {}
    for p in PAGES:
        pages_map[p] = inline_page(p)
    if os.path.exists(os.path.join(ROOT, "index.html")) and "index.html" not in pages_map:
        pages_map["index.html"] = inline_page("index.html")

    def to_page_block(name, content):
        # <script type="text/plain"> 里不会被浏览器执行,但要把结束标记转义
        safe = content.replace("</script>", "<\\/script>")
        # 生成一个稳定的 id(把非法字符替换)
        safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", name)
        return f'<script type="text/plain" class="page-src" data-name="{html.escape(name)}" id="page-{safe_id}">{safe}</script>'

    page_blocks = "\n".join(to_page_block(n, c) for n, c in pages_map.items())
    page_names_json = json.dumps(list(pages_map.keys()), ensure_ascii=False)

    # 侧边栏跳转脚本 + 页切换脚本
    if OFFLINE_MODE:
        # 外层壳自己不加载 tailwind runtime(首屏秒开),只用手写 CSS 覆盖侧边栏用到的类;
        # tailwind + lucide 源码放 <script type="text/plain"> 节点,供 iframe 从 parent.document 读取共享
        _end_tag = "</script>"
        _end_tag_esc = "<\\/script>"
        _tw_safe = TAILWIND_JS.replace(_end_tag, _end_tag_esc)
        _lu_safe = LUCIDE_JS.replace(_end_tag, _end_tag_esc)
        shell_head_libs = (
            f'<script type="text/plain" id="__tailwind_src__">{_tw_safe}</script>\n'
            f'<script type="text/plain" id="__lucide_src__">{_lu_safe}</script>\n'
        )
    else:
        shell_head_libs = f'<script src="{CDN_TAILWIND}"></script>\n<script src="{CDN_LUCIDE}"></script>'

    # 外层壳侧边栏专用 CSS(不依赖 tailwind runtime)
    shell_sidebar_css = """
#sidebar-container .w-64 { width: 16rem; }
#sidebar-container aside.sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 16rem; z-index: 10; overflow-y: auto; color: #fff; }
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
#sidebar-container button:hover, #sidebar-container a:hover { background: rgba(255,255,255,.1); }
#sidebar-container .w-3\\.5 { width: .875rem; } #sidebar-container .h-3\\.5 { height: .875rem; }
#sidebar-container .w-4 { width: 1rem; } #sidebar-container .h-4 { height: 1rem; }
#sidebar-container .w-5 { width: 1.25rem; } #sidebar-container .h-5 { height: 1.25rem; }
#page-frame { position: absolute; left: 16rem; top: 0; right: 0; bottom: 0; width: calc(100% - 16rem); height: 100%; border: 0; }
"""

    shell = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>财务中台 · 单文件原型</title>
{shell_head_libs}
<style>
{ASSETS["common/styles.css"]}
{shell_sidebar_css}
html, body {{ height: 100%; margin: 0; }}
.app {{ position: relative; height: 100vh; }}
.notice {{ position: fixed; right: 12px; bottom: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; z-index: 9999; }}
</style>
</head>
<body class="bg-neutral">
<div class="app">
  <div id="sidebar-container"></div>
  <iframe id="page-frame" title="page"></iframe>
</div>
<div class="notice">财务中台原型 · 单文件版</div>

<script id="pages-data" type="application/json">{page_names_json}</script>
{page_blocks}
<script>
const PAGE_NAMES = JSON.parse(document.getElementById('pages-data').textContent);
const DEFAULT_PAGE = PAGE_NAMES.indexOf('index.html') >= 0 ? 'index.html' : PAGE_NAMES[0];

function getPageHtml(name) {{
  const nodes = document.querySelectorAll('script.page-src');
  for (let i = 0; i < nodes.length; i++) {{
    if (nodes[i].getAttribute('data-name') === name) return nodes[i].textContent;
  }}
  return null;
}}

// 注入侧边栏
document.getElementById('sidebar-container').innerHTML ={json.dumps(SIDEBAR_HTML)};

// 用事件委托绑定侧边栏点击(所有 a[href$=".html"] 一律走 loadPage,阻止默认跳转)
document.getElementById('sidebar-container').addEventListener('click', function(e) {{
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  // 匹配任意 xxx.html
  const m = href.match(/([\\w\\-]+\\.html)(?:[?#].*)?$/);
  if (m) {{
    e.preventDefault();
    e.stopPropagation();
    loadPage(m[1]);
  }}
}}, true); // capture: 抢先于 scripts.js 的处理

// 加载 common/scripts.js 逻辑(侧边栏折叠/切换)
(function(){{
  const script = document.createElement('script');
  script.textContent = {json.dumps(ASSETS["common/scripts.js"])};
  document.body.appendChild(script);
  // 立即触发一次初始化(scripts.js 通常在 DOMContentLoaded 里做,而这里是动态注入)
  if (typeof window.initCommonFunctions === 'function') {{
    try {{ window.initCommonFunctions(); }} catch(err) {{ console.warn(err); }}
  }}
}})();

function loadPage(name) {{
  const html = getPageHtml(name) || getPageHtml(DEFAULT_PAGE);
  if (!html) {{ console.warn('page not found:', name); return; }}
  const frame = document.getElementById('page-frame');
  frame.srcdoc = html;
  // 高亮
  document.querySelectorAll('#sidebar a').forEach(a => a.classList.remove('active'));
}}

// 监听 iframe 内部跳转
window.addEventListener('message', (e) => {{
  const data = e.data || {{}};
  if (data.type === 'navigate' && data.page) {{
    loadPage(data.page);
  }}
}});

// 初始化
loadPage(DEFAULT_PAGE);

// 首屏后再空闲加载 lucide 渲染侧边栏图标(不阻塞首屏)
function renderShellIcons() {{
  const src = document.getElementById('__lucide_src__');
  if (!src) return;
  const s = document.createElement('script');
  s.textContent = src.textContent;
  s.onload = null;
  document.body.appendChild(s);
  setTimeout(() => {{
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }}, 0);
}}
if ('requestIdleCallback' in window) {{
  requestIdleCallback(renderShellIcons, {{ timeout: 2000 }});
}} else {{
  setTimeout(renderShellIcons, 300);
}}
</script>
</body>
</html>
"""
    return shell


def inline_page_from_index():
    """index.html 相对特殊，也走同样内联"""
    return inline_page("index.html") if "index.html" not in PAGES else ""


# ---------- 5. 输出 ----------
def main():
    os.makedirs(DIST_DIR, exist_ok=True)
    # 让 index.html 也进入内联（PAGES 里已排除，单独处理）
    # 修改 inline_page 支持 index.html：临时把它加进 PAGES 以便 href 改写认得
    global PAGES
    if "index.html" not in PAGES and os.path.exists(os.path.join(ROOT, "index.html")):
        PAGES = ["index.html"] + PAGES

    html_out = build_shell()
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(html_out)
    size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
    print(f"[done] 已生成 {OUT_FILE}  ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
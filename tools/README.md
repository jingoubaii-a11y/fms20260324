# 财务中台离线原型构建说明

## 一句话

改完原始 HTML，在本目录父级跑一次 `python3 tools/build-multifile.py`，把新的 `财务中台离线页面/` 整包发给对方即可。

---

## 维护约定

- **新增脚本**：在下方"目录关系"里补一行说明（文件名 + 一句话职责），必要时新增独立章节写用法
- **删除/归档脚本**：从"目录关系"移除，并说明去向
- **本 README 是 `tools/` 的唯一权威说明**，脚本头部的 docstring 只写用法细节，全景视图看这里
- **`tools/` 只服务当前 `fms20260324/` 原型**，不通用；换项目请复制一份再改，不要提到公共位置

## 目录关系

```
fms20260324/
├── index.html / financial-entity.html / ...      ← 原始页面（正常开发/维护这里）
├── common/                                        ← 公共资源
│   ├── sidebar.html      侧栏结构
│   ├── styles.css        全局样式
│   ├── scripts.js        通用 JS
│   ├── prd-viewer.{css,js}
│   ├── req-annotation.js
│   └── subject-dropdown.js
├── tools/                      ← 本目录：私有构建套件（仅服务本原型，不跨项目复用）
│   ├── build-multifile.py      ← 主打脚本，生成 财务中台离线页面/ 离线多页版
│   ├── build-prd.py            将 PRD/prd.md 切片为 common/prd-sections.json（原型 PRD 抽屉用）
│   ├── build-single-html.py    历史遗留：合成单文件 dist/财务中台原型-单文件.html（需联网，不推荐再用）
│   ├── inject-prd-viewer.py    一次性：给新增页面注入 PRD 抽屉的 link/script（老页面已注入过）
│   ├── tailwind.css            tailwind v2 完整版本地缓存（2.8 MB，build-multifile.py 的原料）
│   └── README.md               本文
└── 财务中台离线页面/                  ← 构建产物（发给外部用的）
    ├── 财务中台原型.html    ← 入口文件（双击即可用）
    ├── pages/               各业务页面（去外链、内联资源后）
    └── common/              tailwind.css + lucide 图标
```

## 使用方法

### 日常更新流程

1. 在 `fms20260324/` 下正常编辑原始 HTML（页面 or common/*）
2. 打开终端，切到项目根：
   ```bash
   cd wiki/项目/02财务融合二期/01Finhub/fms20260324
   ```
3. 执行构建：
   ```bash
   python3 tools/build-multifile.py
   ```
4. 交付 `财务中台离线页面/` 整个文件夹给外部（对方双击 `财务中台原型.html`）

### 构建器自动完成的事

- 清除 tailwind CDN runtime、lucide/googleapis/loli.net/placeholder 等外链
- 内联 `common/*.css` / `common/*.js` 到每个页面
- 全站扫描 tailwind arbitrary values（如 `w-[60px]`）自动生成对应 CSS
- 补齐 tailwind v3 新调色板（amber/emerald/violet/orange/... 共 10 色 × 10 shade）
- 侧栏 HTML 注入到 shell + iframe 切页 + href 拦截为 postMessage
- 侧栏菜单 `<a>` 去下划线

## 交付与发送

### 直接发 zip（推荐）

构建脚本已自动打包 `财务中台离线页面.zip`（放在 `fms20260324/` 根目录，约 1 MB，压缩比很高），直接发这个 zip 给对方即可。

```
fms20260324/
├── 财务中台离线页面.zip   ← 直接发这个（构建自动生成）
└── 财务中台离线页面/       ← 打包源，本地留着备查
    ├── 财务中台原型.html
    ├── pages/
    └── common/
```

### 对方使用步骤

1. 解压 zip，得到 `财务中台离线页面/` 文件夹
2. 双击里面的 **财务中台原型.html**
3. 无需联网、无需安装任何软件；侧栏点菜单切换页面

### 给对方的话术（可直接复制到邮件）

> 附件解压后，双击 **财务中台原型.html** 即可打开使用，无需安装任何软件，无需联网。
> 侧栏点击菜单切换页面。整个文件夹（含 pages/、common/）需保持完整，不要单独移动 HTML 文件。

### 发前自测建议

1. 把生成的 zip 解压到桌面另起一个位置
2. 断网
3. 双击 `财务中台原型.html`
4. 侧栏所有菜单点一遍，确认没有页面空白或图标缺失

### 为什么不能只发单个 HTML

- `财务中台原型.html` 是 40 KB 的外壳，用 `<iframe src="pages/index.html">` 加载业务页
- 业务页 `<link href="../common/tailwind.css">` 引用公共 CSS
- 图标 `<img src="../common/lucide/xxx.svg">` 引用本地 SVG

因此必须打包整个文件夹或走脚本自动生成的 zip。

---

## 什么情况下需要动构建脚本

一般不用动。只有以下情况需要改 [`build-multifile.py`](build-multifile.py)：

| 场景 | 修改位置 |
|------|---------|
| 新增/删除页面 | 顶部 `PAGES` 列表 |
| 原页面用了新的外链需要清理 | `process_page()` 里的外网正则 |
| 构建后新 tailwind arbitrary 前缀没生成 CSS | `generate_arbitrary_css()` 的 pattern |
| 用了新 tailwind 色（如 `fuchsia`） | `V3_PALETTE` 常量加一色 |
| 侧栏容器样式调整 | `SHELL_SIDEBAR_CSS` 常量 |

## 常见问题

**Q: 构建后打开某页面样式不对/进度条不见/卡片空白？**
A: 大概率是用了新的 tailwind arbitrary value 或新调色板 shade，脚本没生成对应 CSS。看终端输出里的 `[info] arbitrary` 和 `[info] v3 palette` 计数，然后在浏览器 devtools 里搜没生效的 class，反查是否需要在脚本中扩展。

**Q: 外部反馈打开慢/一直加载？**
A: 说明还有外网资源未清理干净。用编辑器搜 `财务中台离线页面/` 下有没有 `googleapis` / `jsdelivr` / `unpkg` / `cdnjs` / `via.placeholder` / `loli.net`，如果有，在 `process_page()` 里补正则。

**Q: 想临时预览某个页面单独调试？**
A: 直接在浏览器打开 `fms20260324/xxx.html`（原始文件），走的是 CDN 版本，改样式立即生效。调好再构建。

## 构建产物大小参考

- `财务中台离线页面/财务中台原型.html`：~40 KB（shell）
- `财务中台离线页面/common/tailwind.css`：~2.93 MB（v2 完整版 + arbitrary + v3 palette 补丁）
- `财务中台离线页面/pages/*.html`：每个页面 30~200 KB（含内联 CSS/JS）
- 全包 zip 后一般在 3~4 MB
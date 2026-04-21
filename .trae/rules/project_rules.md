# 项目编码规范

## JavaScript 编写规则

### 1. HTML 内嵌脚本限制

- **禁止**在 `<script>` 标签内使用 **模板字符串（Template Literals）**，即反引号 `` ` ``
- **原因**：通过工具写入 HTML 时，`` ` `` 和 `${}` 会被错误转义为 `\`` 和 `\${}`，导致 JS 语法破坏
- **替代方案**：使用普通字符串 `'...'` + `+` 拼接

```javascript
// ❌ 禁止：HTML 内嵌脚本中使用模板字符串
<script>
  var html = \`<div id="\${id}">\${content}</div>\`;
</script>

// ✅ 正确：使用字符串拼接
<script>
  var html = '<div id="' + id + '">' + content + '</div>';
</script>
```

### 2. JS 文件抽离规范

- **复杂交互逻辑（>20行）必须抽离为外部 `.js` 文件**
- 外部 JS 文件中可正常使用模板字符串、ES6+ 语法
- 目录结构：

```
project-root/
├── js/                    # 独立JS文件目录
│   ├── req-annotation.js  # 需求标注组件
│   └── ...
├── common/
│   └── scripts.js         # 公共脚本
└── *.html                 # HTML页面（仅含结构+样式）
```

### 3. 变量声明

- HTML 内嵌脚本统一使用 `var`（兼容性优先）
- 外部 `.js` 文件推荐使用 `const` / `let`

### 4. 函数定义

- HTML 内嵌脚本使用 `function` 声明式
- 避免箭头函数的 `this` 绑定问题

## CSS 样式规则

### 1. 内联样式 vs 外部文件

- 页面级通用样式 → `common/styles.css`
- 组件特有样式 → 页面内 `<style>` 标签
- 动态计算样式 → 仅允许使用 `element.style.xxx = ...`

## 需求标注角标规范（req-annotation）

### 1. req-marker 包裹原则

`req-marker` 的包裹范围**必须精确到目标组件本身**，禁止跨模块合并：

```html
<!-- ❌ 错误：req-marker 包裹了整行（筛选+按钮），角标跑到按钮区 -->
<div class="req-marker flex justify-between" id="req-marker-2">
    <span class="req-badge" data-req="2">2</span>
    <div><!-- 筛选区 --></div>
    <div><!-- 按钮区 --></div>
</div>

<!-- ✅ 正确：req-marker 只包裹目标组件 -->
<div class="flex justify-between">
    <div class="req-marker inline-block" id="req-marker-2">
        <span class="req-badge" data-req="2">2</span>
        <select>单据编号</select>
    </div>
    <div class="req-marker" id="req-marker-3">
        <span class="req-badge" data-req="3">3</span>
        <button>导出</button><button>确认</button>
    </div>
</div>
```

**规则：一个 req-marker = 一个功能模块，角标出现在该模块的右上角。**

### 2. 浮动角标必选 CSS 属性

`.req-badge-float` **必须包含**以下属性，缺一不可：

```css
.req-badge-float {
    position: fixed !important;   /* 必须！脱离文档流，避免 overflow 裁剪 */
    z-index: 9999;                /* 必须！确保在最上层 */
    pointer-events: auto;         /* 必须！允许 hover 触发 */
}
```

### 3. 坐标计算引用对象

JS 中 `updateFloatingPositions()` **必须引用 `parentElement`（即 req-marker）**，而非 badge 本身：

```javascript
// ✅ 正确：取父容器（req-marker）的坐标
var markerRect = item.original.parentElement.getBoundingClientRect();
item.el.style.top = (markerRect.top - 10) + 'px';
item.el.style.left = (markerRect.right - badgeWidth - 6) + 'px';

// ❌ 错误：取 badge 自身坐标（badge 可能被隐藏/裁剪，坐标为0）
var badgeRect = item.original.getBoundingClientRect(); // 不可靠
```

### 4. 浮窗避障四边检测

浮窗定位时**必须检查四边界**，不能只查右下：

```javascript
// 必须四边兜底
if (left + width > window.innerWidth - 16) left = window.innerWidth - width - 16;
if (top + height > window.innerHeight - 16) top = refTop - gap - maxHeight;
if (left < 16) left = 16;           // 左边界兜底
if (top < 16) top = refBottom + gap; // 上边界兜底
```

### 5. req-marker 禁止套在 overflow 容器上

`.req-marker` 内置 `display: inline-block` + `position: relative`，**不能直接作为需要 `overflow: auto/scroll` 的容器**，否则滚动条会失效。

```html
<!-- ❌ 错误：req-marker 直接做滚动容器，inline-block 导致宽度撑开，overflow 不触发 -->
<div class="req-marker overflow-x-auto" id="req-marker-4">
    <span class="req-badge" data-req="4">4</span>
    <table>...</table>  <!-- 表格超出时无滚动条！ -->
</div>

<!-- ✅ 正确：用独立 div 做滚动容器，req-marker 只负责角标定位 -->
<div class="req-marker" id="req-marker-4">
    <span class="req-badge" data-req="4">4</span>
    <div class="table-wrapper">
        <table>...</table>  <!-- 滚动正常 -->
    </div>
</div>
```

```css
/* 滚动容器必须独立，display: block + width: 100% */
.table-wrapper {
    display: block;
    width: 100%;
    overflow-x: auto;
}
```

**涉及场景**：表格列表、代码块、长内容区域等所有需要滚动的组件。

## 文件修改检查清单

每次通过工具修改文件后，确认以下项：

- [ ] HTML 中 `<script>` 块是否包含 `` ` `` 反引号？如有，改为字符串拼接或抽离
- [ ] JS 逻辑是否超过 20 行？如是，考虑抽离到 `js/` 目录
- [ ] **req-marker 是否精确包裹目标组件？有无跨模块？**
- [ ] **`.req-badge-float` 是否有 `position: fixed !important`？**
- [ ] **坐标计算是否引用 `parentElement` 而非 badge 本身？**
- [ ] **浮窗定位是否有四边界兜底检测？**
- [ ] **req-marker 是否套在 overflow 容器上？如有，拆分为内层独立滚动容器**
- [ ] 修改后是否在浏览器控制台验证无语法错误？

## 已知问题记录

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| 2026-04-21 | HTML 内嵌模板字符串导致 JS 无法执行 | 抽离为 js/req-annotation.js，HTML 改用 `<script src>` 引入 |
| 2026-04-21 | 角标被父容器 overflow 裁剪不可见 | 角标克隆到 body，使用 position: fixed |
| 2026-04-21 | 角标位置偏移/消失 | .req-badge-float 缺少 position: fixed |
| 2026-04-21 | 浮窗超出视口被截断 | 增加四边界安全距检测 + 反向弹回 |
| 2026-04-21 | 角标离目标组件太远 | req-marker 包裹范围过大，拆分为精确模块 |
| 2026-04-21 | 列表超出容器无滚动条 | req-marker 的 inline-block 与 overflow-x 冲突，需内层独立滚动容器 |

# 财务中台 · 通用筛选组件规约

> **参考实现**：[`financial-entity.html`](../financial-entity.html) L45-L106
> **适用范围**：财务中台原型目录 `fms20260324/` 下所有列表页
> **强制程度**：⚠️ 新增列表页必须复用；老页面改造时同步替换

---

## 一、组件设计原则

1. **筛选条件收敛到"一个输入框"**：多个筛选字段共用一个文本框，通过左侧下拉切换当前筛选维度，视觉简洁不占多行
2. **常用筛选前置**：把 2~4 个最常用的字段放到快筛下拉，罕用字段进入"高级筛选"折叠区
3. **高级筛选默认收起**：以按钮 + 展开面板形式提供，避免默认状态下把页面顶部撑满
4. **搜索/刷新按钮成对出现**：紧邻输入框，图标化不带文字，减少视觉噪音
5. **占位符随筛选维度动态切换**：用户切换下拉后，input 的 placeholder 自动提示当前搜索什么

---

## 二、DOM 结构模板(直接复制粘贴到新页面)

```html
<!-- 搜索条件和按钮 -->
<div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex-1 flex items-center space-x-2">
        <!-- 筛选条件选择器 -->
        <select id="filter-select" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none text-sm">
            <option value="code">主键编码字段</option>
            <option value="name">主键名称字段</option>
            <option value="status">状态</option>
        </select>

        <!-- 输入框 -->
        <input type="text" id="filter-input"
               placeholder="按主键编码字段搜索"
               class="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">

        <!-- 搜索按钮 -->
        <button class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
            <i data-lucide="search" class="w-4 h-4"></i>
        </button>

        <!-- 刷新按钮 -->
        <button class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
            <i data-lucide="refresh-ccw" class="w-4 h-4"></i>
        </button>

        <!-- 高级筛选按钮 -->
        <button id="advanced-filter-btn" class="px-3 py-2 text-primary hover:bg-secondary rounded-md transition-colors flex items-center">
            高级筛选
            <i data-lucide="chevron-down" class="w-4 h-4 ml-1"></i>
        </button>
    </div>

    <!-- 右侧业务按钮组（新增/导入/导出/同步 等页面独有按钮） -->
    <div class="flex space-x-3">
        <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
            新增
        </button>
    </div>
</div>

<!-- 高级筛选条件（默认隐藏） -->
<div id="advanced-filter" class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 hidden">
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">字段 A</label>
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">字段 B</label>
        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">字段 C</label>
        <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option value="">全部</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
        </select>
    </div>
    <!-- 需要更多字段就继续加,3 列自适应 -->
</div>
```

---

## 三、JS 行为模板(动态 placeholder + 高级筛选展开)

```javascript
// 1. 筛选条件下拉切换 → 同步 placeholder + 清空输入
const filterSelect = document.getElementById('filter-select');
const filterInput  = document.getElementById('filter-input');

filterSelect.addEventListener('change', function () {
    const map = {
        code:   '按主键编码字段搜索',
        name:   '按主键名称字段搜索',
        status: '按状态搜索',
    };
    filterInput.placeholder = map[this.value] || '';
    filterInput.value = '';   // 切换维度后清空,避免错筛
});

// 2. 高级筛选展开/收起 + 箭头翻转
const advBtn   = document.getElementById('advanced-filter-btn');
const advPanel = document.getElementById('advanced-filter');
advBtn.addEventListener('click', () => {
    advPanel.classList.toggle('hidden');
    const icon = advBtn.querySelector('[data-lucide]');
    if (icon) {
        icon.classList.toggle('rotate-180');
    }
});
```

---

## 四、字段配置约定

| 位置 | 放什么字段 | 举例 |
| --- | --- | --- |
| **快筛下拉(2~4 项)** | 主键编码/主键名称/状态,以及使用频次最高的一个业务维度 | 财务主体编码/名称/状态 |
| **高级筛选(3 列网格)** | 时间范围/多选枚举/关联对象/其他非高频字段 | 创建时间/关联公司/纳税人类型/更新人 |

**取舍原则**:
- 如果字段总数 ≤ 3,可以全部放快筛下拉,不做高级筛选
- 如果字段涉及**时间范围**、**多选**、**级联下拉**,必须放高级筛选(单一输入框放不下)
- 状态字段既可以放快筛,也可以放高级,看是否是核心筛选维度

---

## 五、样式变量

所有颜色/圆角/字号统一使用 [`financial-entity.html`](../financial-entity.html:9-27) 中定义的 tailwind config,不要自定义:

- `primary`: `#003eb3` — 高级筛选文字/焦点边框
- `secondary`: `#e6f0ff` — 高级筛选按钮 hover 背景
- `neutral`: `#f5f7fa` — 页面背景
- `rounded-md`: 8px — 所有输入框/按钮统一圆角

---

## 六、可访问性 & 交互细节

1. **回车触发搜索**:input 上加 `keydown` 监听,回车键调用搜索按钮 click
2. **搜索按钮 hover 提示**:加 `title="搜索"`,刷新按钮加 `title="刷新"`
3. **高级筛选展开时**保持快筛输入框可见,不要用互斥关系
4. **响应式**:`md:` 断点以下,快筛区自动换行(gap-4 已处理)

---

## 七、示例参考页(按复杂度递增)

| 页面 | 参考重点 | 文件 |
| --- | --- | --- |
| **财务主体**(基准) | 快筛 + 高级筛选完整实现 | [`financial-entity.html`](../financial-entity.html) |
| **单据类型** | 类似结构,可对比看 | [`document-type.html`](../document-type.html) |
| **供应商** | 快筛多字段场景 | [`merchant.html`](../merchant.html) |

---

## 八、新增页面 checklist

新增一个列表页时,按下列顺序检查:

- [ ] 是否复制了本规约的"DOM 结构模板"?
- [ ] 快筛下拉是否放了本页最常用的 2~4 个字段?
- [ ] 高级筛选是否覆盖了其他所有筛选字段?
- [ ] `filter-select` 的 change 事件是否绑定了 placeholder 切换?
- [ ] `advanced-filter-btn` 的 click 事件是否绑定了展开/收起?
- [ ] 搜索/刷新/高级筛选按钮的 tailwind class 是否与财务主体页保持一致?
- [ ] tailwind config 的 primary/secondary 颜色是否复用,没有自定义?
- [ ] 高级筛选按钮是否加了 chevron-down 图标?

---

## 九、变更历史

| 日期 | 变更 | 触发点 |
| --- | --- | --- |
| 2026-08-02 | 首次沉淀,以 financial-entity.html 为基准 | 用户要求后续新增页面统一参照 |
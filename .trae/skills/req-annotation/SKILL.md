---
name: "req-annotation"
description: "PRD需求标注到UI原型页面。当用户要求将PRD文档的需求标注到HTML原型界面时自动调用，支持Workflow A初始化标注和Workflow B增量更新。"
---

# 需求标注 Skill (req-annotation)

## 功能概述

将 PRD 文档中的需求以**模块化方式**标注到 HTML 原型页面上，生成带交互浮窗的角标，实现**双向追溯**。

## 触发条件

用户以下任一指令时调用此 Skill：
- "将需求标注到UI界面"
- "根据 PRD 标注页面"
- "给原型添加需求说明"
- "执行 Workflow A/B 标注"

## 工作流程

### 前置检查

1. 确认用户提供的信息：
   - **PRD 文档路径**（必填）：如 `PRD/财务中台详细功能描述.md`
   - **HTML 原型路径**（必填）：如 `project-revenue-accounting.html`
   - **工作流类型**（默认 A）：
     - `A` = 初始化标注（新页面/新文档）
     - `B` = 增量更新（已有标注的修改）

2. 如果信息不完整，主动询问用户补充。

### Workflow A: 初始化标注

#### Step 1: 解析 PRD 文档

读取 PRD 文档，提取目标页面的所有需求点，包括：
- 筛选条件字段及类型
- 操作按钮及业务规则
- 列表字段及计算公式
- 详情弹窗字段
- 状态机/枚举值
- 异常处理逻辑

#### Step 2: 模块化聚合

按照以下原则对需求进行分组：

| 聚合规则 | 示例 |
|----------|------|
| 同一组件只标一个角标 | 筛选区的所有输入框→合并为"筛选条件"模块 |
| 同一功能区域合并 | 导出+确认按钮→合并为"操作按钮"模块 |
| Tab/容器整体标注 | Tab导航栏→单独一个模块 |

编号规则：从 1 开始连续编号，跳过已删除的编号。

#### Step 3: 生成 HTML 标注（结构约束 ⚠️ 重要）

**⚠️ req-marker 包裹原则（踩坑经验，必须遵守）**

`req-marker` **必须精确包裹目标组件本身**，禁止跨模块合并：

| ❌ 错误做法 | ✅ 正确做法 |
|------------|-----------|
| `req-marker` 包裹整行（筛选+按钮），角标跑到按钮区 | 每个 `req-marker` 只包裹一个功能组件 |
| 一个 marker 内含多个不相关子元素 | 一个 marker = 一个角标 = 一个模块 |

```html
<!-- ❌ 错误：req-marker 跨模块包裹 -->
<div class="req-marker flex justify-between" id="req-marker-2">
    <span class="req-badge" data-req="2">2</span>
    <div><!-- 筛选区 --></div>
    <div><!-- 按钮区 --></div>  <!-- 角标2会出现在这里！错误位置 -->
</div>

<!-- ✅ 正确：每个模块独立 req-marker -->
<div class="flex justify-between">
    <div class="req-marker inline-block" id="req-marker-2">  <!-- 只包筛选框 -->
        <span class="req-badge" data-req="2" data-title="..." data-content='...'>2</span>
        <select>单据编号</select>
    </div>
    <div class="req-marker inline-block" id="req-marker-3">  <!-- 只包按钮组 -->
        <span class="req-badge" data-req="3" ...>3</span>
        <button>导出</button><button>确认</button>
    </div>
</div>
```

**HTML 标注格式：**

```html
<!-- 角标容器：精确包裹目标组件 -->
<div class="req-marker {display-class}" id="req-marker-{编号}">
    <span class="req-badge" data-req="{编号}"
          data-title="{标题}"
          data-content='{HTML内容}'>{编号}</span>
    <!-- 原有内容不变：仅包含该模块的DOM元素 -->
</div>
```

**display-class 选择规则：**

| 目标组件类型 | display-class | 示例 |
|-------------|---------------|------|
| 行内/行内块元素 | `inline-block` | 下拉框、输入框、按钮组 |
| 块级容器 | `relative block` | 列表区、卡片、Tab导航栏 |

**CSS 要求**（已在页面 `<style>` 中定义）：
```css
.req-badge {
    display: inline-block;
    background-color: rgb(250, 173, 20);
    color: white;
    font-size: 11px; font-weight: bold;
    line-height: 16px; padding: 0px 5px;
    border-radius: 2px;
    position: absolute;
    top: -10px; right: -6px;
    z-index: 9999;
    opacity: 0; pointer-events: none; /* 原始badge隐藏，浮动副本显示 */
}
.req-badge-float {
    position: fixed !important;   /* 必须！脱离文档流 */
    z-index: 9999;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    pointer-events: auto;
}
.req-marker { position: relative; }
```

**JS 引用**（页面底部）：
```html
<div id="req-tooltip-container"></div>
<script src="js/req-annotation.js"></script>
```

> ⚠️ **禁止**在 HTML `<script>` 内使用模板字符串（反引号）。JS 必须抽离为外部文件。

#### Step 4: 浮窗内容规范

每个角标的 `data-content` 必须包含：

```
{模块标题}
├─ 显示样式（如有状态颜色）
├─ 字段清单（完整列出每个字段及来源/公式）
├─ 交互逻辑
├─ 业务规则（用 <em> 强调）
├─ 状态机（用 blockquote）
└─ 注意事项
```

使用 HTML 标签：
- `<div class="req-section-title">` 小节标题
- `<strong>` 关键词强调
- `<em>` 业务规则
- `<blockquote>` 状态机/注意事项
- `<span class="status-dot status-green/red/gray/blue/orange">` 状态色点

#### Step 5: 反向写入 PRD

在 PRD 文档对应位置写入需求编号，格式：
```markdown
#### 页面标题 [1]
##### 子模块 [2]
###### 具体项 [3]
```

编号样式与角标一致。

#### Step 6: 自检清单（含防错检查 ⚠️）

完成后逐一确认：

**基础自检：**
- [ ] **聚合自检**：同一组件是否只有 1 个角标？
- [ ] **完整性自检**：浮窗信息是否包含所有原始需求细节？
- [ ] **样式自检**：角标是否为 `rgb(250,173,20)` 11px bold？
- [ ] **反向写入自检**：PRD 编号与页面角标一一对应？
- [ ] **JS 抽离自检**：无内嵌 `<script>` 块，使用外部 `js/req-annotation.js`？
- [ ] **data 属性自检**：角标包含 `data-title` 和 `data-content`？

**结构防错自检（⚠️ 必须逐项通过）：**
- [ ] **包裹精确性**：每个 `req-marker` 是否只包裹一个功能模块？有无跨模块合并？
- [ ] **display-class 正确**：行内元素用 `inline-block`，块级容器是否加了 `relative`？
- [ ] **CSS 完整性**：`.req-badge-float` 是否有 `position: fixed !important` + `z-index: 9999`？
- [ ] **原始 badge 隐藏**：`.req-badge` 是否设了 `opacity: 0; pointer-events: none`？

### Workflow B: 增量更新

1. 对比新旧 PRD/页面差异
2. **新增需求**：生成新编号角标
3. **修改需求**：仅替换 `data-content` 内容
4. **删除需求**：移除对应角标 + PRD 编号
5. **样式锁定**：不改变任何视觉参数

## 文件结构

```
project-root/
├── js/
│   └── req-annotation.js      # 通用标注引擎（数据驱动，零硬编码）
├── .trae/
│   └── rules/
│       └── project_rules.md   # 项目编码规范（自动加载）
└── *.html                     # 原型页面（含 data-* 角标属性）
```

## 使用示例

**用户输入**：
> 根据 `PRD/财务中台详细功能描述.md` 要求，将需求标注到 `adjustment-order.html`

**执行过程**：
1. 读取 PRD → 提取调整单相关需求
2. 模块化分组 → 筛选区、按钮区、列表区、新增抽屉
3. 在 HTML 各模块添加 `.req-marker` + `.req-badge[data-*]`
4. 确保 HTML 底部有 `req-tooltip-container` + `script src`
5. 在 PRD 对应位置写回 `[n]` 编号
6. 运行自检清单

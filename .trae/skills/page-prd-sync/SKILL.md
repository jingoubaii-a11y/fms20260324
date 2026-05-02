---
name: "page-prd-sync"
description: "Bidirectional sync between HTML prototype pages and PRD/prd.md in this workspace. Forward (Page → PRD): when the user creates, modifies, refactors or deletes any HTML prototype page (including common/sidebar.html), synchronize the change into the corresponding section of PRD/prd.md and append a record to PRD/CHANGELOG.md. Reverse (PRD → Page): when the user modifies any section of PRD/prd.md or PRD/CHANGELOG.md (by direct edit, instruction, or via tools), synchronize the change into the affected HTML page(s). In BOTH directions you MUST first present a concrete sync plan and obtain explicit user confirmation before touching any file. Triggers include adding/removing buttons, fields, list columns, filters, tabs, modals, drawers, validations, status enums, copy text, row-actions, pagination, or any interaction-level / requirement-level edit."
---

# Page-PRD Sync Skill

## Overview
本工作区的 `PRD/prd.md` 是产品需求的唯一权威文档。原型页面（`*.html`）与 PRD 必须保持双向一致：
- **Forward（Page → PRD）**：页面交互层任何改动 → 同步主文档对应章节 + CHANGELOG
- **Reverse（PRD → Page）**：PRD 章节内容任何改动 → 同步受影响的 HTML 页面 + CHANGELOG

> **强制规则**：双向同步在动手修改任何文件之前，**必须先向用户提出方案并获得明确确认**（见下方 `Confirmation Protocol`）。未确认前不得调用 `replace_file` / `write_file` 修改 `PRD/prd.md`、`PRD/CHANGELOG.md` 或任何 `.html` 文件。

## When to Use

### Forward: Page → PRD
- 新增、删除、重命名任意 `.html` 页面
- 修改任意 `.html` 页面的交互层内容（按钮、字段、列表列、筛选条件、Tab、弹窗、抽屉、校验规则、状态枚举、提示文案、行内操作、分页等）
- 修改 [`common/sidebar.html`](common/sidebar.html) 的菜单结构

### Reverse: PRD → Page
- 用户直接修改 [`PRD/prd.md`](PRD/prd.md) 任意模块/子章节内容
- 用户直接修改 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md) 条目
- 用户口头指示调整某模块/子章节的字段、按钮、状态、文案、流程等
- agent 自己刚通过工具改过 `PRD/prd.md` 或 `PRD/CHANGELOG.md`，但对应 HTML 尚未跟随更新

## Detecting PRD Changes（反向触发的 5 类信号）

agent 在每轮对话中按以下任一信号识别"PRD 已发生或将发生改动"，触发反向同步流程：

1. **用户意图词**（显式命令）：
   - 直接命令：`修改 PRD`、`改一下需求`、`PRD 里加一条`、`prd.md 里把 X 改为 Y`
   - 文件 @：`@PRD/prd.md`、`@prd.md`、`@CHANGELOG.md`
   - 章节指向：`【模块名】里加 …`、`XX 子章节调整为 …`、`补一个字段到 YY`

2. **`[FILE_CHANGE_FEEDBACK]` 反馈块**（最强信号）：
   - 系统注入的 `[FILE_CHANGE_FEEDBACK] PRD/prd.md 已被修改 / …`
   - 系统注入的 `[FILE_CHANGE_FEEDBACK] PRD/CHANGELOG.md 已被修改 / …`
   - 一旦出现，必须将其后用户的改动需求作为反向同步源头处理

3. **当前打开文件 + 修改意图**：
   - `current open file is: .../PRD/prd.md`（或 `PRD/CHANGELOG.md`、`PRD/期末处理/*.md` 等）
   - 配合用户消息出现"加一条/改一下/调整/重写"等动词

4. **agent 工具上下文**：
   - 本轮或上一轮 agent 自己用 `replace_file` / `write_file` 修改过 `PRD/prd.md` 或 `PRD/CHANGELOG.md`
   - 等价于"PRD 已修改"，下一步必须评估是否需要反向同步页面

5. **隐式语义信号**（弱信号，需结合上下文判断）：
   - 用户引用 PRD 中的字段名 / 章节标题，要求"统一"、"对齐"、"以 PRD 为准"
   - 用户发现"页面和 PRD 不一致"并要求处理
   - 此类信号需在 `Confirmation Protocol` 中向用户确认理解再行动

> **判定原则**：5 类信号中只要命中任意一条，立刻进入反向同步流程的 **Step 0（提方案 + 等确认）**。多条信号叠加时按"信号 2 > 信号 1/4 > 信号 3 > 信号 5"的优先级合并处理。

## Confirmation Protocol (MANDATORY)

**任何方向的同步、任何 `replace_file` / `write_file` 调用之前**，agent 必须先输出一份结构化方案并显式等待用户确认：

### 方案模板
```
同步方向：Page → PRD  /  PRD → Page  /  双向
触发信号：（列出命中的信号编号与依据，如"信号 2: [FILE_CHANGE_FEEDBACK]"）
涉及文件：
  - PRD：PRD/prd.md → ## 【XXX】 → ### YYY（行号或锚点）
  - 页面：xxx.html / yyy.html
  - CHANGELOG：PRD/CHANGELOG.md
改动摘要（逐项列出）：
  1. ...
  2. ...
  3. ...
风险/影响：（如多页面联动、字段类型变化、可能破坏已有数据等）
请确认是否执行？
```

### 等待回复
- 必须等到用户回复 **"全部按方案执行"** 或等价的明确肯定（如"OK 执行"、"按这个改"、"go"、"do it"）
- 如用户提出修改（如"第 2 条不要"、"把 X 改成 Y"），回到方案模板重新输出，再次等待确认
- 用户回复模糊（"嗯"、"好"、"行"）需追问明确确认

### 例外（无需二次确认）
- 用户在同一轮消息里**已经写了完整方案 + 执行指令**（如"按以下 1/2/3 改并执行"），可直接动手，但回复中需复述方案以便对齐
- 用户明确说"不用确认了，直接改"，本轮可跳过；下一轮恢复确认机制

## What NOT to Sync
以下情况可不更新对端，但需在回复中明确说明：
- 仅视觉调整（间距、颜色、图标替换、文字大小）且不影响功能语义
- 修复明显笔误（如标签拼写、缺失空格）
- 用户明确指示"只改页面不动 PRD"或"只改 PRD 不动页面"

## Sync Target

**仅同步主文档：[`PRD/prd.md`](PRD/prd.md)**

不再同步任何拆分子文档（如 `集成管理prd.md`），所有变更落入主文档对应章节。

## Page → PRD Section Mapping

> **状态**：已对全站 25 个页面（含侧边栏可访问 + 子页）完成 PRD 抽屉接入。新增页面需同时更新 [`tools/build-prd.py`](tools/build-prd.py) 的 `PAGE_MAP` 与本表。

| 页面文件 | PRD 模块 | 子章节（PRD ### 或 ####） |
|---|---|---|
| `index.html` | 首页 | — |
| `financial-entity.html` | 基础资料 | 财务主体 |
| `merchant.html` | 基础资料 | 客商 |
| `project.html` | 基础资料 | 项目 |
| `material.html` | 基础资料 | 物料 |
| `cost-ratio.html` | 基础资料 | 成本比例配置 |
| `currency.html` | 公共资料 | 币别 |
| `accounting-calendar.html` | 公共资料 | 会计日历 |
| `document-type.html` | 公共资料 | 单据类型 |
| `business-type.html` | 公共资料 | 业务类型 |
| `tax-rate.html` | 公共资料 | 税率 |
| `invoice-type.html` | 公共资料 | 发票类型 |
| `unit.html` | 公共资料 | 计量单位 |
| `requirement-type.html` | 公共资料 | 需求类型 |
| `source-system.html` | 公共资料 | 来源系统 |
| `accounting-method.html` | 项目核算 | 核算方法管理 [1] |
| `accounting-workbench.html` | 项目核算 | 核算工作台 [1] |
| `decoration-accounting.html` | 项目核算 | 整装核算 [5] |
| `soft-accounting.html` | 项目核算 | 软装核算 [13] |
| `revenue-cost-adjustment.html` | 项目核算 | 收入成本调整 [22] |
| `sales-outbound.html` | 库存管理 | 销售出库 |
| `receivable.html` | 应收管理 | 应收单 |
| `period-end.html` | 期末处理 | — |
| `ebs-mapping.html` | 集成管理 | EBS映射配置 |
| `sync-log.html` | 集成管理 | 同步日志 |

**未接入（计划中）**：`process-acceptance.html`（工序验收，二期）。

**新增页面接入步骤**：
1. 在 [`tools/build-prd.py`](tools/build-prd.py) 的 `PAGE_MAP` 增加映射
2. 在该 HTML 的 `</body>` 前手动追加（或运行 `python3 tools/inject-prd-viewer.py`）：
   ```html
   <!-- PRD Viewer -->
   <link rel="stylesheet" href="common/prd-viewer.css">
   <script src="common/prd-viewer.js" defer></script>
   ```
3. 运行 `python3 tools/build-prd.py` 重建 [`common/prd-sections.json`](common/prd-sections.json)
4. 同步更新本表

## Writing Conventions（必须遵循）

参照 [`PRD/将Markdown格式思维导图转换为产品功能描述文档（PRD）系统提示词.md`](PRD/将Markdown格式思维导图转换为产品功能描述文档（PRD）系统提示词.md)：

- 字段名 / 按钮名 / 状态名 / 页面名一律用反引号包裹，例如：`保存`、`成功`、`财务主体映射`
- 模块级标题：`## 【模块名】产品页面功能描述及交互描述`
- 弹窗、抽屉、确认框单独成 `XXX（弹窗）` / `XXX（抽屉）` 小节，结构化描述：`打开方式` / `按钮` / `内容` / `行为` / `关闭方式` / `返回`
- 条目逐项原样展开，不合并、不省略、不臆造业务逻辑
- 严格客观语气，不加入未在页面出现的功能点

## Execution Steps

> **Step 0（强制）—— 提方案 + 等确认**：在执行 Step 1 之前，必须先按 `Confirmation Protocol` 输出方案模板并等待用户明确确认。未确认前禁止任何文件修改。

### Forward: Page → PRD
1. **识别改动**：明确本轮修改涉及的页面文件、改动类型与具体交互点
2. **定位章节**：根据"Page → PRD Section Mapping"在 [`PRD/prd.md`](PRD/prd.md) 中找到对应章节；若章节不存在，按层级规范新增
3. **更新文档**：使用 `replace_file` 在对应章节内新增 / 修改 / 删除条目
   - 新增条目：在最相关的小节末尾追加
   - 修改条目：定位后原位替换
   - 删除条目：直接移除该行（含其子条目）
4. **写 CHANGELOG**：按 `CHANGELOG 记录` 章节规则在 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md) 追加 `[模块/子章节] 摘要` 条目
5. **重建 sections.json**：运行 `python3 tools/build-prd.py`（或提示用户即将由 pre-commit hook 触发）
6. **质量自检**：执行下方"Quality Checklist"
7. **交付汇报**：在回复末尾使用结构化格式列出同步点：
   ```
   PRD 同步（Page → PRD）：
   - 源页面：xxx.html
   - 文件：PRD/prd.md
   - 章节：## 【XXX】产品页面功能描述及交互描述 → ### YYY
   - 改动：新增/修改/删除 N 项（条目摘要）
   - CHANGELOG：已追加 N 条
   ```

### Reverse: PRD → Page
1. **识别 PRD 改动**：根据 `Detecting PRD Changes` 5 类信号确认 PRD 已发生或将发生的改动；明确变化点（章节、字段、按钮、文案、流程等）
2. **反查受影响页面**：根据 `Page → PRD Section Mapping` 表反向匹配
   - 章节级改动 → 该章节映射的全部 HTML 页面
   - 模块级改动（如新增子章节、调整子章节顺序）→ 该模块下全部 HTML 页面
   - 跨章节联动（如新增公共字段）→ 列出所有可能受影响的页面，向用户确认范围
3. **页面差异分析**：
   - 对每个受影响页面读取当前 HTML 内容
   - 对照 PRD 改动点，列出页面需要新增 / 修改 / 删除的具体 DOM/JS 改动
4. **更新页面**：使用 `replace_file` / `write_file` 实施改动
   - 涉及结构变化（新增 Tab、模块、弹窗）必须保留现有交互一致性（Toast、ConfirmModal、FAQ 等通用组件）
   - JS 中数据 mock、事件绑定、状态管理需同步更新
5. **页面间一致性检查**：若同一改动影响多个页面（如全局组件升级），逐页应用并校验
6. **写 CHANGELOG**：在 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md) 追加反向同步条目（如 PRD 本次改动尚未写入 CHANGELOG，先补 CHANGELOG 再做页面同步）
7. **重建 sections.json**：运行 `python3 tools/build-prd.py`
8. **质量自检**：执行下方"Quality Checklist"
9. **交付汇报**：
   ```
   PRD 同步（PRD → Page）：
   - 源章节：## 【XXX】 → ### YYY
   - 受影响页面：xxx.html / yyy.html / ...
   - 改动：每个页面的具体修改摘要
   - CHANGELOG：已追加 N 条
   ```

## Quality Checklist

提交前逐项自检（按方向选择对应项 + 通用项）：

### 通用（双向必查）
- [ ] **已先输出方案并获得用户明确确认**（"全部按方案执行"或等价回复）
- [ ] 已识别同步方向（Page → PRD / PRD → Page / 双向）
- [ ] 已在 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md) 追加本次改动条目，标签 `[模块/子章节]` 与主文档一致
- [ ] 若未使用 Git 提交，已手动运行 `python3 tools/build-prd.py`
- [ ] 在回复中明确列出同步点（方向 + 文件路径 + 章节定位 + 改动摘要）

### Forward 专用
- [ ] 已定位到 [`PRD/prd.md`](PRD/prd.md) 中的正确章节
- [ ] 所有字段 / 按钮 / 状态 / 页面名使用反引号包裹
- [ ] 弹窗 / 抽屉 / 确认框使用 `XXX（弹窗）` / `XXX（抽屉）` 单独成节
- [ ] 条目按页面交互逐项展开，未合并、未省略
- [ ] 未引入页面中不存在的功能点

### Reverse 专用
- [ ] 已通过 `Page → PRD Section Mapping` 反查并列出全部受影响页面
- [ ] 多页面联动时已逐页应用改动且通用组件保持一致
- [ ] 页面 JS（数据 mock、事件、状态）已同步 PRD 字段/枚举变化
- [ ] 未在页面中引入 PRD 未描述的功能点

## Edge Cases

- **新增页面但 PRD 章节不存在**：先在主文档对应模块下新增 `### 页面名` 小节，再补全条目
- **多页面联动改动（如侧边栏新增分组）**：在每个相关章节同步更新，并在汇报中列出全部改动点
- **撤销 / 回滚改动**：同步将 PRD / 页面 中的对应条目回滚至改动前状态
- **用户仅询问而未执行改动**：不更新 PRD / 页面，仅回答问题
- **Reverse：PRD 改动但无明确映射页面**（例如全局术语替换、`Overview` 章节调整）：向用户确认是否跳过页面同步，或列出"可能相关"页面让用户筛选
- **Reverse：PRD 改动涉及 PRD 尚未接入的页面**（如 `process-acceptance.html`）：仅更新 PRD 与 CHANGELOG，页面同步挂起并在汇报中标注
- **双向冲突**：同一轮对话中同时出现页面与 PRD 的反向改动意图时，先与用户确认以哪端为准，再进入单向流程

## CHANGELOG 记录（必须同步）

每次更新 [`PRD/prd.md`](PRD/prd.md) 时，同时在 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md) 追加一条变更记录，供原型页面的 PRD 查看抽屉展示「变更记录」Tab。

### 写入位置
- 按 `YYYY-MM-DD` 分组的二级标题（`## YYYY-MM-DD`），最新日期放在文档最上方
- 同一天的多条改动追加到当天的 `## YYYY-MM-DD` 下方

### 条目格式
```markdown
- [模块名/子章节名] 改动摘要（新增/修改/删除）
```

- `模块名` 与 `子章节名` 必须与 `PRD/prd.md` 的 `## 【模块】` 和 `### 小节` 文案完全一致
- 模块级改动可省略 `/子章节名`，写成 `[模块名]`
- 改动摘要保持 1 行、客观简短，与 Writing Conventions 中的反引号约定一致

### 示例
```markdown
## 2026-05-01
- [集成管理/同步日志] 新增 `请求参数（弹窗）` 小节，含 `复制` / `关闭` 按钮与四种关闭方式
- [集成管理/EBS映射配置] `财务主体映射` 子 Tab 新增唯一性校验提示

## 2026-04-30
- [集成管理] 新增集成管理模块（`EBS映射配置`、`同步日志` 两个子菜单）
```

### 构建产物
- `PRD/prd.md` 或 `PRD/CHANGELOG.md` 被修改并 commit 时，Git `pre-commit` hook 会自动执行 `python3 tools/build-prd.py` 重建 [`common/prd-sections.json`](common/prd-sections.json)
- 手动重建命令：`python3 tools/build-prd.py`
- 如未使用 Git 提交（仅本地预览），需手动执行一次上述命令，否则抽屉看到的仍是旧内容

> 自检项（CHANGELOG 追加、手动 build）已并入上方 `Quality Checklist` → `通用`，此处不再重复。

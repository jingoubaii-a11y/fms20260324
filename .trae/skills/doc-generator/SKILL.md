---
name: "doc-generator"
description: "通用文档生成技能，支持PRD、技术文档、API文档等多种类型。基于页面实现代码和规格文档自动生成结构化文档。Invoke when user asks to generate any type of document, PRD, or technical specification."
---

# Document Generator Skill

## Overview
通用文档生成技能，能够根据页面实现代码（index.tsx）、规格文档（spec.md）及用户需求，智能识别文档类型并匹配对应模板，生成面向不同受众的结构化文档。

## When to Use
- 用户要求生成PRD文档时
- 用户需要将已实现的页面转化为技术文档时
- 用户需要生成API接口文档时
- 用户需要生成用户手册或操作指南时
- 用户需要根据spec.md生成正式文档时
- 用户询问"如何生成文档"、"帮我写个文档"时

## Supported Document Types

### 1. 产品需求文档 (PRD)
**模板来源**: `prd-generator/prd-generator/template/`

**子类型**:
| 类型 | 模板文件 | 适用场景 |
|------|----------|----------|
| 数据看板类 | data-prd-template.md | 数据统计、报表分析、指标监控 |
| 后台列表类 | backend-list-prd-template.md | 数据列表管理、查询列表、台账 |
| 表单编辑类 | backend-form-edit-prd-template.md | 新增/编辑表单、配置管理 |
| 表单预览类 | backend-form-preview-prd-template.md | 详情查看、预览、只读页面 |
| 用户前台类 | user-frontend-prd-template.md | C端页面、营销活动、产品展示 |

**输出路径**: `src/prototypes/<page-name>/prd.md`

### 2. 技术实现文档
**适用场景**:
- 架构设计说明
- 核心算法说明
- 技术选型说明
- 代码逻辑说明

**重点内容**:
- 技术架构图
- 核心模块说明
- 数据流说明
- 关键实现细节
- 性能考虑

**输出路径**: `docs/<module-name>/technical-doc.md`

### 3. API 接口文档
**适用场景**:
- RESTful API 说明
- 接口对接文档
- 第三方集成文档

**重点内容**:
- 接口地址和方法
- 请求参数说明
- 响应格式说明
- 错误码定义
- 调用示例

**输出路径**: `docs/api/<api-name>.md`

### 4. 用户操作手册
**适用场景**:
- 系统操作指南
- 功能使用说明
- FAQ 文档

**重点内容**:
- 操作步骤截图
- 功能说明
- 常见问题解答
- 注意事项

**输出路径**: `docs/user-guide/<feature-name>.md`

## Workflow

### Phase 1: 需求分析 (Analysis)

#### Step 1.1: 信息收集
- [ ] 读取目标页面的主要实现文件 (`index.tsx` 或其他)
- [ ] 读取 `spec.md` 规格文档（如果存在）
- [ ] 读取相关配置文件和环境变量
- [ ] 查看 UI 截图或原型（如果存在）
- [ ] 了解项目整体结构和约定

#### Step 1.2: 类型识别
根据收集的信息自动识别文档类型：
```
包含图表/指标 → 数据看板类 PRD
包含列表/筛选 → 后台列表类 PRD
包含表单输入 → 表单编辑类 PRD
只有展示内容 → 表单预览类 PRD
C端界面 → 用户前台类 PRD
涉及接口调用 → API 文档
需要操作指导 → 用户手册
其他情况 → 技术文档
```

#### Step 1.3: 需求确认
向用户确认以下信息：
1. **文档类型**（如未自动识别或识别不准确）
2. **目标受众**（研发、测试、产品、用户）
3. **功能范围**（是否只关注特定模块）
4. **详细程度**（概要还是详细）
5. **特殊要求**（格式、语言、术语偏好）

### Phase 2: 内容生成 (Generation)

#### Step 2.1: 模板选择与加载
- 根据文档类型选择对应模板
- 如果是 PRD，使用 `prd-generator` 的模板
- 如果是其他类型，使用内置通用模板

#### Step 2.2: 信息提取与整理
从源文件中提取关键信息：

**从代码中提取**:
- 组件结构和层级关系
- 状态管理和数据流
- 业务逻辑和交互规则
- 接口调用和数据格式
- 校验规则和错误处理

**从 spec.md 中提取**:
- 技术约定和规范
- 数据定义和口径
- 字段格式和约束
- 接口规范

**从 UI 中提取**:
- 页面布局和视觉层次
- 交互流程和状态变化
- 信息展示优先级

#### Step 2.3: 内容填充
按照模板结构组织内容：
1. 替换所有占位符为实际内容
2. 使用统一的术语和表达方式
3. 保持逻辑清晰、层次分明
4. 确保内容的准确性和完整性
5. 添加必要的示例和说明

#### Step 2.4: 文件保存
遵循路径规范保存生成的文档：
- PRD: `src/prototypes/<page-name>/prd.md`
- 技术文档: `docs/<module-name>/technical-doc.md`
- API文档: `docs/api/<api-name>.md`
- 用户手册: `docs/user-guide/<feature-name>.md`

### Phase 3: 质量保证 (Quality Assurance)

#### Step 3.1: 一致性核对
检查以下维度：

**维度1: 功能一致性**
- [ ] 文档描述的功能在源码中都存在
- [ ] 没有描述不存在的功能
- [ ] 交互逻辑描述准确
- [ ] 展示规则描述正确

**维度2: 技术一致性**
- [ ] 数据定义与 spec.md 一致
- [ ] 字段格式与实现一致
- [ ] 接口说明与实际一致
- [ ] 无冲突或矛盾内容

**维度3: 范围一致性**
- [ ] 只包含用户指定范围的内容
- [ ] 未超出指定范围
- [ ] 未遗漏核心内容

**维度4: 完整性检查**
- [ ] 所有主要模块都已覆盖
- [ ] 所有关键字段都已定义
- [ ] 所有关键流程都已说明
- [ ] 模板必填项都已填充

#### Step 3.2: 问题修复
如果发现不一致或问题：
1. 记录具体问题描述
2. 返回 Phase 2 重新生成修正
3. 再次执行一致性核对
4. 循环直到全部通过

#### Step 3.3: 最终交付
✅ 全部检查通过后，向用户交付文档并说明：
- 生成的文档路径
- 文档的主要内容和结构
- 可能需要注意的特殊点
- 建议的后续操作（如 review）

## Rules & Conventions

### 路径规范
- **PRD文档**: 必须保存到 `src/prototypes/<page-name>/prd.md`
- **技术文档**: 保存到 `docs/<module-name>/technical-doc.md`
- **API文档**: 保存到 `docs/api/<api-name>.md`
- **用户手册**: 保存到 `docs/user-guide/<feature-name>.md`

### 命名规范
- 文件名使用小写字母和连字符：`my-document.md`
- 目录名使用小写字母和连字符：`user-management/`
- 避免使用空格和特殊字符

### 内容规范
- **术语统一**: 使用目标受众熟悉的术语
- **客观准确**: 只描述实际存在的功能和实现
- **简洁明了**: 避免冗余表述和主观臆测
- **结构清晰**: 合理使用标题、列表、表格等格式
- **示例充分**: 关键概念提供具体示例

### 质量标准
- **准确性**: 所有信息必须与源码和 spec 一致
- **完整性**: 不遗漏关键功能和重要细节
- **可读性**: 目标受众能够轻松理解
- **可维护性**: 结构清晰便于后续更新

## Templates Reference

### PRD Templates Location
```
prd-generator/prd-generator/template/
├── data-prd-template.md              # 数据看板类
├── backend-list-prd-template.md      # 后台列表类
├── backend-form-edit-prd-template.md # 表单编辑类
├── backend-form-preview-prd-template.md # 表单预览类
└── user-frontend-prd-template.md     # 用户前台类
```

### Generic Template Structure (非PRD文档)
```markdown
# <文档标题>

## 1. 概述
<简要说明文档的目的、范围和目标受众>

## 2. 背景
<说明为什么需要这个功能/文档>

## 3. 详细内容
<按模块/功能详细说明>

## 4. 示例
<提供具体的使用示例或代码示例>

## 5. 注意事项
<列出重要的注意事项和限制>
```

## Example Usage

### Example 1: 生成 PRD
```
用户：帮我生成 user-management 页面的PRD
→ 执行流程：
  1. 读取 src/pages/user-management/index.tsx
  读取 spec.md（如果存在）
  2. 识别为后台列表类页面
  3. 应用 backend-list-prd-template.md
  4. 生成 src/prototypes/user-management/prd.md
  5. 执行一致性核对
  6. 交付文档
```

### Example 2: 生成 API 文档
```
用户：帮我生成订单相关的API文档
→ 执行流程：
  1. 收集订单相关的接口代码和调用处
  2. 提取接口地址、参数、响应格式
  3. 使用通用 API 文档模板
  4. 生成 docs/api/order-api.md
  5. 核对接口信息的准确性
  6. 交付文档
```

### Example 3: 生成技术文档
```
用户：帮我写一个权限模块的技术文档
→ 执行流程：
  1. 分析权限模块的代码实现
  2. 整理权限控制的核心逻辑
  3. 生成 docs/permission/technical-doc.md
  4. 包含架构图、数据流、关键算法说明
  5. 交付文档
```

## Error Handling

### 常见问题及解决方案

**Q: 无法自动识别文档类型？**
A: 向用户提供类型选项让用户手动选择

**Q: spec.md 不存在？**
A: 仅基于代码生成文档，标注"规格文档待补充"

**Q: 页面同时包含多种类型功能？**
A: 选择最主要的功能类型作为主模板，其他类型在对应章节详细说明

**Q: 用户要求修改已生成的文档？**
A: 了解修改需求后重新执行 Phase 2 和 Phase 3

**Q: 文档非常复杂，单个模板不够用？**
A: 将文档拆分为多个子模块，每个模块独立生成后再整合

## Best Practices

1. **先分析再生成**: 充分理解需求后再开始生成，避免返工
2. **保持客观**: 只描述实际存在的功能，不添加臆测内容
3. **注重细节**: 字段定义、校验规则等细节要准确完整
4. **质量第一**: 一定要经过完整的 QA 流程再交付
5. **持续改进**: 根据用户反馈不断优化生成质量和效率
6. **沟通确认**: 有疑问及时与用户沟通，不要自行假设

# 财务中台系统 (FMS) - 技术规格文档

## Why

财务中台需要统一的技术规格文档来规范系统架构、数据模型、业务规则和接口标准，确保开发、测试、运维团队对系统有一致的理解，支撑多组织核算、跨系统数据同步、项目收入核算等核心业务的稳定运行。

## What Changes

- 新增完整的财务中台技术规格文档
- 定义系统架构和模块边界
- 规范数据模型和字段标准
- 明确业务规则和计算逻辑
- 统一接口规范和数据交换标准

## Impact

- Affected specs: 全部功能模块（基础资料、公共资料、项目管理、库存管理、应收管理、期末处理）
- Affected code: 30个HTML页面实现文件、公共样式和脚本

## System Overview

### 系统定位

财务中台（Financial Middle Platform, FMS）提供统一的基础主数据管理、项目管理和核算功能，规范口径、统一规则、保障数据一致性与系统扩展性。

### 核心能力

1. **主数据管理**：统一管理财务主体、客商、项目、物料等核心主数据
2. **项目管理**：支持整装/软装/设计费三类项目的全生命周期核算管理
3. **收入核算**：完工百分比法、完成合同法、收款确收法三种核算方法
4. **库存管理**：销售出库、成本获取
5. **应收管理**：应收单管理
6. **期末处理**：期间结账、对账处理

### 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      表现层 (Presentation)                    │
│    30个 HTML 页面 | 公共样式 (common/styles.css)             │
│    公共脚本 (common/scripts.js, js/req-annotation.js)        │
├─────────────────────────────────────────────────────────────┤
│                      业务层 (Business Logic)                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ 基础资料  │ 公共资料  │ 项目管理  │ 库存管理  │ 应收管理  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      数据层 (Data Access)                     │
│  主数据服务 | 核算引擎 | 接口适配器 (SVI/积木云装/金蝶/EBS)   │
├─────────────────────────────────────────────────────────────┤
│                   外部系统集成 (Integration)                   │
│     SVI 系统 | 积木云装 (SAAS) | 金蝶云星空 | EBS           │
└─────────────────────────────────────────────────────────────┘
```

## ADDED Requirements

### Requirement: 基础资料管理模块

系统 SHALL 提供统一的基础主数据管理功能，包括财务主体、客商、项目、物料等核心实体的 CRUD 操作，支持跨系统数据同步。

#### R1.1: 财务主体管理

- **WHEN** 用户访问财务主体页面
- **THEN** 系统展示财务主体列表，包含编码、名称、关联公司、纳税人识别号、纳税人类型、状态等字段
- **AND** 支持新增、编辑、查看、启用/停用操作
- **AND** 支持从积木云装同步新增/更新财务主体数据

**数据模型**:

```
FinancialEntity {
  id: string (PK)
  code: string (64位, 唯一)
  name: string (64位)
  companyId: string (FK)
  taxId: string (纳税人识别号)
  taxpayerType: enum [一般纳税人, 小规模纳税人]
  seal: string (图片URL)
  status: enum [启用, 停用]
  createdAt: datetime
  updatedAt: datetime
}
```

#### R1.2: 客商管理

- **WHEN** 用户访问客商页面
- **THEN** 系统展示客商分组树和客商列表（左右布局1:4）
- **AND** 支持客商分组的层级管理（新增/编辑/删除）
- **AND** 支持客商的新增、编辑、查看操作
- **AND** 客商信息包含基本信息和开票信息两个页签

**数据模型**:

```
MerchantGroup {
  id: string (PK)
  parentId: string (FK, 自引用)
  code: string (12位, 唯一)
  name: string (20位)
  description: string (200位)
  level: integer (层级深度)
}

Merchant {
  id: string (PK)
  code: string (32位, 唯一)
  name: string (64位, 必填)
  groupId: string (FK, 必填, 只能选末级分组)
  isInternal: boolean (默认false)
  type: enum [客户, 供应商, 客供一体]
  nature: enum [法人, 自然人, 个体户]
  
  // 基本信息
  creditCode: string (18位, 统一社会信用代码)
  
  // 开票信息
  invoiceTitle: string (64位)
  taxRegistrationNo: string (18位)
  bankName: string (50位)
  bankAccount: string (30位)
  invoicePhone: string (20位)
  invoiceAddress: string (100位)
  defaultTaxRate: string (FK -> TaxRate)
  defaultInvoiceType: string (FK -> InvoiceType)
  taxpayerIdentifier: enum [一般纳税人, 小规模纳税人]
  
  status: enum [启用, 停用]
  sourceSystem: enum [svi, 积木云装]
  createdAt: datetime
  updatedAt: datetime
}

MerchantChangeLog {
  id: string (PK)
  merchantId: string (FK)
  fieldName: string (变更对象)
  oldValue: string (变更前)
  newValue: string (变更后)
  operator: string (操作人)
  operateTime: datetime (操作时间)
  sourceSystem: string (来源系统)
}
```

**业务规则**:

- 客商编码唯一性校验
- 客商分组只能选择末级分组
- 删除分组前校验：该分组下无客商数据且为末级分组
- 跨系统取值：SVI 和积木云装的客商数据都需要同步到财务中台

#### R1.3: 项目管理

- **WHEN** 用户访问项目页面
- **THEN** 系统展示项目列表，支持多维筛选（财务主体、日期范围、项目类型、合同号等）
- **AND** 支持项目的新增、编辑、查看操作
- **AND** 项目信息包含基础信息、核算信息、状态信息、设计费信息（条件显示）四个页签

**数据模型**:

```
Project {
  id: string (PK)
  
  // 基础信息
  financialEntityId: string (FK -> FinancialEntity)
  projectType: enum [整装, 软装, 设计费]
  requirementType: string (FK -> RequirementType)
  customerName: string
  customerCode: string
  orderNo: string
  contractNo: string (64位)
  contractName: string
  businessLine: string
  productCategory: string
  signedStore: string
  arrivalStore: string
  clueStore: string
  province: string
  city: string
  district: string
  buildingName: string (200位)
  buildingAddress: string (200位)
  signingDate: datetime
  sourceSystem: string (FK -> SourceSystem)
  
  // 核算信息
  estimatedTotalRevenue: decimal(10,2) (锁定, 自动计算)
  preStartRevenue: decimal(10,2)
  changeOrderRevenue: decimal(10,2)
  additionalRevenue: decimal(10,2) (锁定)
  estimatedTotalCost: decimal(10,2) (锁定, 自动计算)
  preStartCost: decimal(10,2)
  changeOrderCost: decimal(10,2) (锁定)
  estimatedGrossProfitRate: decimal(5,2) (锁定, 自动计算)
  totalReceivable: decimal(10,2)
  netReceiptAmount: decimal(10,2)
  cumulativeConfirmedRevenue: decimal(10,2) (锁定)
  decorationTailTaxAmount: decimal(10,2) (锁定, 条件显示)
  cutoffCompletionTaxReceiptAmount: decimal(10,2)
  cutoffCompletionTaxRefundAmount: decimal(10,2)
  taxableReceivableAmount: decimal(10,2)
  taxationMethod: enum [一般计税, 简易计税]
  taxRate: decimal(5,2)
  contractingMode: enum [项目经理, 工程师]
  
  // 设计费信息 (projectType=设计费时显示)
  relatedContractNo: string (64位)
  designFeeRatio: decimal(5,4)
  designFeePendingConfirmAmount: decimal(10,2) (锁定, 自动计算)
  
  // 状态信息
  projectStatus: enum [待开工, 在建, 停工, 竣工, 退单]
  actualStartDate: datetime
  actualCompletionDate: datetime
  financialConfirmationDate: datetime
  closeStatus: enum [打开, 关闭]
  lastAccountingPeriod: string
  
  contractStatus: enum [打开, 关闭] (switch按钮)
  status: enum [启用, 停用]
  createdAt: datetime
  updatedAt: datetime
}

ProjectChangeLog {
  id: string (PK)
  projectId: string (FK)
  changedField: string (变更对象)
  oldValue: string
  newValue: string
  operator: string
  operateTime: datetime
}
```

**核心计算逻辑**:

1. **预计总收入** = 开工前收入 + 增减项收入 + 附加收入
2. **预计总成本** = 开工前成本 + 增减项目成本
3. **预计毛利率** = (预计总收入 - 预计总成本) / 预计总收入
4. **整装尾款计税金额** = (应收总额 - 截止竣工计税收款金额 - 截止竣工计税退款金额) × 税率

**跨系统取值规则**:

- 根据项目来源系统判断是从 SVI 还是积木云装取值
- 跨系统取值字段在新增/编辑状态下不可人工修改，均锁定
- 合同状态=打开时，项目新增和更新都需同步财务中台

**计税方式判断逻辑**:

```
IF 项目类型 = 整装 THEN
  IF 合同签单日期 < 2026-01-01 THEN
    IF 渠道税率 = 9% THEN 计税方式 = 一般计税
    ELSE 计税方式 = 简易计税
  ELSE 计税方式 = 一般计税
ELSE 计税方式 = 一般计税
END IF
```

**税率确定规则**:

- 整装 + 一般计税 → 9%
- 整装 + 简易计税 → 3%
- 软装 → 13%
- 设计费 → 6%

#### R1.4: 物料管理

- **WHEN** 用户访问物料页面
- **THEN** 系统展示物料分类树和物料列表（左右布局1:4）
- **AND** 支持物料分类的层级管理
- **AND** 支持物料的新增、编辑操作
- **AND** 支持物料单位换算管理（独立页签）

**数据模型**:

```
MaterialCategory {
  id: string (PK)
  parentId: string (FK, 自引用)
  code: string (64位, 唯一)
  name: string (64位)
}

Material {
  id: string (PK)
  code: string (64位, 唯一, 必填)
  name: string (64位, 必填)
  mainUnit: string (FK -> Unit, 必填, 采购/库存单位)
  salesUnit: string (FK -> Unit, 必填, 销售单位)
  defaultTaxRate: string (FK -> TaxRate)
  status: enum [启用, 停用]
}

MaterialUnitConversion {
  id: string (PK)
  materialId: string (FK -> Material, 必填)
  materialName: string (必填)
  mainUnit: string (必填, 根据物料自动带出, 不可修改)
  salesUnit: string (必填, 可修改)
  conversionFactor: decimal(10,4) (>0, 必填, 1销售单位=x主单位)
  status: enum [启用, 停用]
}
```

**业务规则**:

- 物料和物料单位换算所有字段由 SVI & 积木云装系统同步
- 删除分类前校验：该分类下不存在物料
- 换算系数必须大于0，精度4位

#### R1.5: 成本比例配置

- **WHEN** 用户访问成本比例配置页面
- **THEN** 系统展示成本比例配置列表
- **AND** 支持新增、编辑操作
- **AND** 用于配置不同产品分类的设计费提成比例

**数据模型**:

```
CostRatioConfig {
  id: string (PK)
  code: string (64位, 必填)
  name: string (64位, 必填)
  productCategory: string (FK, 必填)
  designFeeCostRatio: decimal(5,4) (>0, 必填)
  startDate: date (必填, 不能晚于结束日期)
  endDate: date (必填, 不能早于开始日期)
  applicableFinancialEntities: array<string> (多选, 必填)
  status: enum [启用, 停用]
}
```

**业务规则**:

- 同一财务主体的不同成本比例配置的开始和结束日期不能重叠
- 开始日期不能晚于结束日期

***

### Requirement: 公共资料管理模块

系统 SHALL 提供底层规则配置功能，集中管理系统的基础数据和业务规则，确保改一处通全系统。

#### R2.1: 币别管理

- **WHEN** 用户访问币别页面
- **THEN** 系统展示币别列表，支持搜索、新增、编辑、删除操作

**数据模型**:

```
Currency {
  id: string (PK)
  code: string (64位, 必填, 唯一)
  name: string (64位, 必填)
  currencyCode: string (64位, 必填)
  isDefault: boolean (必填, 默认币别唯一)
  unitPrecision: integer (默认6, >0)
  amountPrecision: integer (默认2, >0)
  status: enum [启用, 停用]
}
```

**业务规则**:

- 默认币别唯一性校验
- 单价精度和金额精度有业务发生时不允许改小，只允许改大
- 删除前校验是否被使用

#### R2.2: 会计日历管理

- **WHEN** 用户访问会计日历页面
- **THEN** 系统展示会计日历列表，支持新增、编辑、修改会计期间、追加会计期间操作
- **AND** 编辑时展示会计期间明细表，支持对已有会计期间的起止日期进行修改

**数据模型**:

```
AccountingCalendar {
  id: string (PK)
  code: string (64位, 必填, 唯一)
  name: string (64位, 必填)
  startYear: integer (必填, 如2026)
  startDate: date (必填)
  endDate: date (自动取期间明细最晚结束日期)
  periodType: enum [自然月, 月] (必填)
  status: enum [启用, 停用]
}

AccountingPeriod {
  id: string (PK)
  calendarId: string (FK -> AccountingCalendar)
  fiscalYear: integer (如2026)
  periodNumber: integer (01~12)
  startDate: date
  endDate: date
  quarter: enum [Q1, Q2, Q3, Q4] (自动归属)
}
```

**业务规则**:

- 至少保留一个启用的会计日历
- 启用新日历时需确认是否停用原日历
- 已被业务单据引用的日历不允许停用
- 期间类型=自然月时，不允许修改会计期间明细
- 期间类型=月时，可修改当前期间+1及之后的开始和结束日期
- 追加会计期间时自动生成下一年度12个期间

#### R2.3: 单据类型管理

- **WHEN** 用户访问单据类型页面
- **THEN** 系统展示单据类型列表，支持按单据筛选
- **AND** 支持新增、编辑操作

**适用单据**: 应收单、销售出库单、项目收入核算单、销售收入计算单

**数据模型**:

```
DocumentType {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  isDefault: boolean (同一单据内唯一)
  documentCategory: enum [应收单, 销售出库单, 项目收入核算单, 销售收入计算单]
  description: string (256位)
  status: enum [启用, 停用]
}
```

**业务规则**:

- 是否默认=是则不能停用
- 同一单据中只能有一个默认单据类型

#### R2.4: 业务类型管理

- **WHEN** 用户访问业务类型页面
- **THEN** 系统展示业务类型分组树和业务类型列表（左右布局1:4）
- **AND** 支持最多三级分组结构

**数据模型**:

```
BusinessTypeGroup {
  id: string (PK)
  parentId: string (FK, 自引用)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  description: string (256位)
  level: integer (最大3级)
}

BusinessType {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  groupId: string (FK -> BusinessTypeGroup)
  description: string (256位)
  status: enum [启用, 停用]
}
```

#### R2.5: 税率管理

- **WHEN** 用户访问税率页面
- **THEN** 系统展示税率列表，支持搜索、新增、编辑、删除操作

**数据模型**:

```
TaxRate {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  rate: decimal(5,2) ([0, 100], 必填)
  description: string (256位)
  status: enum [启用, 停用]
}
```

#### R2.6: 发票类型管理

- **WHEN** 用户访问发票类型页面
- **THEN** 系统展示发票类型列表，支持 CRUD 操作

**数据模型**:

```
InvoiceType {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  description: string (256位)
  status: enum [启用, 停用]
}
```

#### R2.7: 计量单位管理

- **WHEN** 用户访问计量单位页面
- **THEN** 系统展示计量单位分组和列表（左右布局1:4）
- **AND** 支持从积木云装供应链域同步数据

**数据模型**:

```
UnitGroup {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  description: string (256位)
}

Unit {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  precision: integer ([0, 100], 必填)
  groupId: string (FK -> UnitGroup)
  description: string (256位)
  status: enum [启用, 停用]
}
```

#### R2.8: 需求类型管理

- **WHEN** 用户访问需求类型页面
- **THEN** 系统展示需求类型列表
- **AND** 支持与业务系统需求标签解耦，通过映射配置关联

**数据模型**:

```
RequirementType {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  projectType: enum [整装, 软装, 设计费] (必填)
  businessLine: string (枚举值, 必填)
  relatedOrderRequirementTags: array<string> (多选, 来自SVI和积木云装)
  description: string (256位)
  status: enum [启用, 停用]
}
```

**业务线枚举选项**:

- 零售–零售–SHJ–整装业务
- 零售–零售–SHJ–局改业务
- 零售–零售–SHJ–软装业务
- 零售–零售–SHJ–定制业务
- 零售–零售–SHJ–设计业务
- 零售–零售–SHJ–零售业务
- 零售–零售–SHJ–服务业务
- 零售–零售–SHJ–其他业务

#### R2.9: 来源系统管理

- **WHEN** 用户访问来源系统页面
- **THEN** 系统展示来源系统列表，支持新增、启用/禁用操作

**数据模型**:

```
SourceSystem {
  id: string (PK)
  code: string (必填, 唯一)
  name: string (必填)
  description: string
  status: enum [启用, 停用]
}
```

***

### Requirement: 项目管理与核算模块

系统 SHALL 提供项目核算方法管理、核算工作台、软装收入计算任务、项目收入核算任务等功能。

#### R3.1: 核算方法管理

- **WHEN** 用户访问核算方法管理页面
- **THEN** 系统展示核算方法列表，支持新增、编辑操作

**数据模型**:

```
AccountingMethod {
  id: string (PK)
  code: string (32位, 必填, 唯一)
  name: string (64位, 必填)
  projectType: enum [整装, 软装, 设计费] (必填)
  method: enum [完成合同法, 完工百分比法, 收款确收] (必填)
  effectiveDate: date (>=今天, 必填)
  expiryDate: date (>=今天, 必填)
  status: enum [启用, 停用]
}
```

**业务规则**:

- 启用状态下，同一项目类型的生效和失效日期不能重合
- 生效日期不能早于失效日期

**三种核算方法说明**:

1. **完成合同法**: 适用于软装项目，财务确认竣工后一次性确认收入
2. **完工百分比法**: 适用于整装项目，根据施工进度分期确认收入
3. **收款确收法**: 适用于设计费项目，根据实际收款确认收入

#### R3.2: 核算工作台

- **WHEN** 用户访问核算工作台页面
- **THEN** 系统展示业务全局监控仪表板，包含以下指标卡片：

**本期应核算项目统计**:

- 按项目类型（整装、软装、设计费）分别展示
- 区分在建、竣工项目
- 显示数量和占比

**取数逻辑**:

```sql
-- 完工百分比法（整装）
SELECT * FROM Project 
WHERE actualStartDate IS NOT NULL 
  AND actualStartDate <= currentPeriodEndDate
  AND contractStatus = '打开'
  AND projectType = '整装'

-- 完成合同法（软装）
SELECT * FROM Project 
WHERE financialConfirmationDate IS NOT NULL 
  AND financialConfirmationDate <= currentPeriodEndDate
  AND contractStatus = '打开'
  AND projectType = '软装'

-- 收款确收法（设计费）
SELECT * FROM Project 
WHERE contractStatus = '打开'
  AND projectType = '设计费'
  AND netReceiptAmount != 0
```

**其他监控指标**:

- 核算进度：按项目类型展示完成、进行中、未开始数量
- 项目检查通过率：通过数量/应核算数量
- 软装竣工出库进度：已出库/应出库合同数量
- 软装出库成本获取进度：已获取/已出库合同数量
- 软装对账成功率：对账成功/应出库合同数量
- 最近动态：EBS科目获取、金蝶软装工费获取、软装三方对账、软装竣工出库

#### R3.3: 软装收入计算任务

- **WHEN** 用户新增软装收入计算任务
- **THEN** 系统创建计算任务并执行以下流程：

**任务参数**:

```
SoftRevenueCalculationTask {
  id: string (PK)
  batchNo: string (计算批次号)
  financialEntities: array<string> (财务组织, 多选)
  accountingPeriod: string (锁定, 当前会计期间)
  contractNos: array<string> (合同号, 可选)
  recalculateUnconfirmed: boolean (是否重算已计算未确认的合同)
  recalculateConfirmed: boolean (是否重算已确认的合同)
  calculationStatus: enum [待计算, 计算中, 已计算, 计算失败]
  createdBy: string
  createdAt: datetime
}
```

**计算流程**:

1. **确认核算范围**
   - 排除正在计算中的批次
   - 创建或更新软装销售收入计算单
2. **采集信息**
   - 非重算合同：采集销售出库单信息（生效状态、软定销售出库类型）
   - 重算合同：仅采集应收总额
3. **计算前异常检查**
   - 被分摊物料数量均为0 → 失败
   - 存在负数物料数量 → 警告但继续
   - 应收总额<0 → 失败
   - 所有物料客户价=0 → 失败
   - 对账状态≠成功 → 失败
   - 未生成竣工销售出库单 → 失败
4. **数量转化**
   - 物料存在单位转换系数时执行换算
   - 销售数量 = 出库数量 × 单位转换系数
5. **分摊逻辑**
   ```
   价税合计 = 销售数量×客户价 / ∑(销售数量×客户价) × 待分摊金额
   税额 = 价税合计 / (1+税率) × 税率
   不含税金额 = 价税合计 - 税额
   含税单价 = 价税合计 / 销售数量
   不含税单价 = 不含税金额 / 销售数量
   ```
   - 金额精度：价税合计、税额、不含税金额保留2位小数
   - 单价精度：不含税单价、含税单价保留6位小数
   - 差异调整：允许差额 = 行数 × 0.005，超出则报错
6. **生成计算报告**
   - 成功：反写销售出库单和软装收入计算单
   - 失败：更新异常信息字段

**软装销售收入计算单**:

```
SoftRevenueCalculationDocument {
  id: string (PK)
  documentNo: string (自动生成, JSD+yymmdd+8位流水)
  documentType: enum [竣工收入分摊, 重算收入分摊]
  reconciliationNo: string (对账单号)
  accountingPeriod: string
  financialEntityId: string
  contractNo: string
  financialConfirmationDate: date
  amountToAllocate: decimal(10,2) (待分摊金额=应收总额)
  taxRate: decimal(5,2)
  calculationBatchNo: string
  isRecalculation: boolean
  recalculationDocumentNo: string
  
  // 分录明细
  items: Array<{
    sequenceNo: integer
    materialCode: string
    materialName: string
    batchNo: string
    inventoryQuantity: decimal
    inventoryUnit: string
    salesQuantity: decimal (换算后)
    taxRate: decimal(5,2)
    customerPrice: decimal
    projectManagerPrice: decimal
    sourceLineNo: integer
    
    amountTaxIncluded: decimal(10,2) (价税合计)
    taxAmount: decimal(10,2) (税额)
    amountExcludingTax: decimal(10,2) (不含税金额)
    unitPriceTaxIncluded: decimal(6) (含税单价)
    unitPriceExcludingTax: decimal(6) (不含税单价)
    
    sourceSystem: string
    sourceDocument: string
    revenueUpdateTime: datetime
  }>
  
  calculationExceptionInfo: string (异常信息)
  calculationStatus: enum [未计算, 计算中, 已计算, 计算失败]
}
```

#### R3.4: 项目收入核算任务

- **WHEN** 用户新增项目收入核算任务
- **THEN** 系统执行项目收入核算流程：

**核算前检查**:

**整装项目（完工百分比法）**:

1. 项目档案检查：
   - 未完工项目：预计总收入>0 且 预计总成本>0
   - 已完工项目：应收总额≤0 且 整装收款计税已完成最新获取
2. EBS科目获取完成校验：
   - 合同履约成本科目发生额获取完成
   - 获取时间需晚于收入核算期间的次月1号24点之后（可配置）

**软装项目（完成合同法）**:

1. 软装销售收入计算完成状态校验
   - 第一次核算：校验竣工收入分摊单计算状态=已计算
   - 后续重算：校验重算收入分摊单计算状态=已计算
2. 软装出库成本获取校验（仅第一次核算）
3. 金蝶软装工费获取最新数据校验

**设计费项目（收款确收法）**: 待补充

**项目核算单据**:

```
ProjectAccountingDocument {
  id: string (PK)
  documentNo: string (自动生成)
  projectType: enum [整装, 软装, 设计费]
  accountingMethod: enum [完成合同法, 完工百分比法, 收款确收]
  accountingPeriod: string
  financialEntityId: string
  contractNo: string
  contractName: string
  taxationMethod: string
  taxRate: decimal(5,2)
  customerName: string
  customerCode: string
  buildingName: string
  buildingAddress: string
  requirementType: string
  productName: string
  productCategory: string
  businessLine: string
  arrivalStore: string
  signingDesigner: string
  signingDepartment: string
  signingDate: date
  actualStartDate: date
  actualCompletionDate: date
  financialConfirmationDate: date
  
  // 收入相关
  totalReceivable: decimal(10,2)
  estimatedTotalCost: decimal(10,2)
  estimatedTotalRevenue: decimal(10,2)
  estimatedGrossProfitRate: decimal(5,2)
  cutoffCompletionTaxReceiptAmount: decimal(10,2)
  cutoffCompletionTaxRefundAmount: decimal(10,2)
  
  // 本期确认收入
  currentPeriodConfirmedRevenue: decimal(10,2)
  cumulativeConfirmedRevenue: decimal(10,2)
  
  calculationBatchNo: string
  isRecalculation: boolean
  confirmationStatus: enum [未确认, 已确认]
  calculationStatus: enum [未计算, 计算中, 已计算, 计算失败]
  exceptionInfo: string
  createdBy: string
  createdAt: datetime
}
```

#### R3.5: 调整单管理

- **WHEN** 用户访问调整单页面
- **THEN** 系统展示调整单列表，支持按项目、期间、类型等条件筛选
- **AND** 支持新增、编辑、审核调整单操作
- **AND** 调整单用于对项目核算数据进行修正和调整

**业务场景**:

- 项目收入核算数据错误需要修正
- 成本数据需要调整
- 特殊业务场景的手工调整

**数据模型**:

```
AdjustmentOrder {
  id: string (PK)
  documentNo: string (自动生成, 编码规则待定)
  adjustmentType: enum [收入调整, 成本调整, 其他调整]
  projectId: string (FK -> Project, 必填)
  projectType: enum [整装, 软装, 设计费]
  accountingPeriod: string (必填)
  financialEntityId: string (FK)
  
  // 调整前数据
  originalRevenue: decimal(10,2) (原确认收入)
  originalCost: decimal(10,2) (原确认成本)
  
  // 调整数据
  adjustmentAmount: decimal(10,2) (调整金额, 必填)
  adjustmentDirection: enum [调增, 调减] (必填)
  
  // 调整后数据
  adjustedRevenue: decimal(10,2) (调整后收入)
  adjustedCost: decimal(10,2) (调整后成本)
  
  reason: string (调整原因, 必填)
  description: string (详细说明)
  attachmentUrls: array<string> (附件)
  
  status: enum [草稿, 已审核, 已生效]
  approvedBy: string
  approvedAt: datetime
  
  createdBy: string
  createdAt: datetime
  updatedAt: datetime
}
```

**业务规则**:

1. 调整单必须关联到具体项目
2. 调整金额不能为0
3. 调整后数据需重新计算相关指标
4. 已生效的调整单不允许删除或修改
5. 调整单需经过审核流程才能生效

#### R3.6: 库存对账管理

- **WHEN** 用户访问库存对账页面
- **THEN** 系统展示库存对账列表，支持按财务主体、会计期间、合同号等条件筛选
- **AND** 支持手动触发对账、查看对账结果、处理对账异常操作

**业务场景**:

- 软装项目竣工后，需将业务系统、金蝶及EBS三方系统库存数据进行核对
- 确保需销售出库物料的数量与实际库存系统一致
- 对账成功后才能自动销售出库，进行后续软装收入计算

**数据模型**:

```
InventoryReconciliation {
  id: string (PK)
  reconciliationNo: string (自动生成, KD+yyyymmdd+4位流水)
  financialEntityId: string (FK, 必填)
  accountingPeriod: string (必填)
  contractNo: string (FK -> Project, 必填)
  contractName: string (锁定, 自动带出)
  reconciliationDate: date (对账日期, 必填)
  
  // 对账来源
  sourceSystem: enum [金蝶K3, EBS, 手工录入] (必填)
  sourceDocumentNo: string (来源单据号)
  
  // 对账结果
  totalLines: integer (总行数)
  matchedLines: integer (匹配行数)
  unmatchedLines: integer (不匹配行数)
  totalQuantity: decimal (系统出库总量)
  sourceTotalQuantity: decimal (来源系统总量)
  quantityDifference: decimal (数量差异)
  totalAmount: decimal (系统出库总金额)
  sourceTotalAmount: decimal (来源系统金额)
  amountDifference: decimal (金额差异)
  
  // 状态
  status: enum [待对账, 对账中, 对账成功, 对账失败, 部分匹配] (必填)
  exceptionInfo: string (异常信息)
  
  // 明细
  items: Array<{
    id: string
    materialCode: string (物料编码)
    materialName: string (物料名称)
    batchNo: string (批号)
    
    systemQuantity: decimal (系统数量)
    systemUnit: string (系统单位)
    systemAmount: decimal (系统金额)
    
    sourceQuantity: decimal (来源数量)
    sourceUnit: string (来源单位)
    sourceAmount: decimal (来源金额)
    
    quantityDifference: decimal (数量差异)
    amountDifference: decimal (金额差异)
    matchStatus: enum [匹配, 数量不符, 金额不符, 缺失] (必填)
    exceptionReason: string (异常原因)
  }>
  
  reconciledBy: string (对账人)
  reconciledAt: datetime (对账时间)
  approvedBy: string (审核人)
  approvedAt: datetime (审核时间)
  
  createdBy: string
  createdAt: datetime
  updatedAt: datetime
}
```

**业务规则**:

1. 同一合同同一会计期间只能存在一张有效的对账单
2. 对账失败或部分匹配时，不允许进行软装收入计算
3. 数量差异容忍度：±0.001（可配置）
4. 已对账成功的对账单不允许删除
5. 对账数据来源优先级：金蝶K3 > 业务系统 >EBS 

**对账流程**:

1. **选择对账范围**
   - 选择财务主体、会计期间、合同号（支持批量选择）
   - 系统自动获取该合同的销售出库明细
2. **获取源系统数据**
   - 自动调用金蝶/EBS接口获取对应物料库存数据
   - 接口失败时支持手工录入
3. **执行对账逻辑**
   - 按物料编码+批号进行匹配
   - 计算数量和金额差异
   - 判定匹配状态
4. **生成对账结果**
   - 全部匹配 → 状态=对账成功
   - 存在不匹配 → 状态=部分匹配或对账失败
   - 生成异常说明
5. **异常处理**
   - 用户可查看不匹配明细
   - 支持调整系统数据或标记为合理差异
   - 重新对账直至通过

**筛选条件**:

- 财务主体（多选）、会计期间、合同号
- 对账状态、对账日期范围、对账单号
- 来源系统

**列表字段**:

- 对账单号、财务主体、会计期间、合同号、合同名称
- 对账日期、来源系统、总行数、匹配行数、不匹配行数
- 数量差异、金额差异、状态、对账人、对账时间
- 操作（查看、重新对账、打印）

***

### Requirement: 库存管理模块

系统 SHALL 提供销售出库单管理功能，支持出库单的录入、审核、成本获取和EBS同步。

#### R4.1: 销售出库管理

- **WHEN** 用户访问销售出库页面
- **THEN** 系统展示销售出库列表，支持多维筛选
- **AND** 支持新增、编辑、保存、生效操作

**筛选条件**:

- 财务主体（多选）、业务日期范围、单据类型（多选）、会计期间
- 单据编号、同步EBS状态、合同号、计税方式、物料分类、物料名称、批号、到店门店

**数据模型**:

```
SalesOutboundDocument {
  id: string (PK)
  documentNo: string (XSCK+8位流水, 必填, 锁定)
  documentTypeId: string (FK -> DocumentType, 必填)
  financialEntityId: string (FK, 必填)
  storeId: string (到店门店, 必填)
  departmentId: string (销售部门, 必填)
  salesmanId: string (销售员)
  businessDate: date (必填)
  accountingPeriod: string (锁定, 自动带出, 校验未结账)
  status: enum [草稿, 生效] (生效后锁定所有字段)
  customerId: string (FK -> Merchant, 类型=客户, 必填)
  customerName: string (锁定, 自动带出)
  contact: string
  phone: string
  shippingAddress: string
  contractNo: string (FK -> Project, 必填)
  contractName: string (锁定)
  productCategory: string (锁定)
  productName: string (锁定)
  requirementType: string (锁定)
  
  // 单据头汇总
  totalAmountTaxIncluded: decimal(10,2) (明细行之和, 锁定)
  totalTaxAmount: decimal(10,2) (锁��)
  totalAmountExcludingTax: decimal(10,2) (锁定)
  totalCostAmount: decimal(10,2) (锁定)
  costAcquisitionTime: datetime (EBS反写时间戳)
  remark: string
  syncEbsFlag: enum [是, 否] (所有分录都是"是"时才为"是")
  syncKingdeeFlag: enum [是, 否] (所有分录都是"是"时才为"是")
  
  createdAt: datetime
  updatedAt: datetime
  
  // 明细行
  items: Array<SalesOutboundItem>
}

SalesOutboundItem {
  id: string (PK)
  documentId: string (FK)
  lineNo: integer (自动生成)
  businessType: string (锁定, 选择子类型后自动带出上级类型)
  subBusinessType: string (FK -> BusinessType, 必填)
  salesOrderNo: string (锁定, 从合同带出)
  materialCode: string (FK -> Material, 必填)
  materialName: string (锁定)
  batchNo: string (选择物料后可编辑, 必填)
  salesUnit: string (从物料带入, 必填)
  salesQuantity: decimal (必填, ≠0)
  currencyId: string (FK -> Currency, 必填)
  customerPrice: decimal (单价精度)
  
  // 价格计算字段 (5种编辑场景)
  unitPriceExcludingTax: decimal (不含税单价, 单价精度)
  unitPriceTaxIncluded: decimal (含税单价, 单价精度)
  taxRate: decimal(5,2) (可输入或选择税率)
  amountTaxIncluded: decimal(10,2) (价税合计, 金额精度)
  taxAmount: decimal(10,2) (税额, 金额精度)
  amountExcludingTax: decimal(10,2) (不含税金额, 金额精度)
  
  sourceDocumentType: string (源单表名, 锁定)
  sourceDocumentNo: string (源单编号, 锁定)
  outboundUnit: string (物料主单位, 必填)
  outboundQuantity: decimal (必填, ≠0)
  costAmount: decimal(10,2) (金额精度)
  costUnitPrice: decimal (单价精度)
  syncEbsFlag: enum [是, 否]
  syncKingdeeFlag: enum [是, 否]
}
```

**价格计算核心规则**:

**前提条件**:

1. 参与计算固定字段：税率、数量（空时默认0）
2. 恒等式：价税合计 = 不含税金额 + 税额
3. 精度：税额/价税合计/不含税金额取金额精度；单价取单价精度

**5种编辑场景**:

1. **修改不含税单价**（基准）:
   - 不含税金额 = 不含税单价 × 数量
   - 税额 = 不含税金额 × 税率
   - 价税合计 = 不含税金额 + 税额
   - 含税单价 = 不含税单价 × (1+税率)
2. **修改含税单价**（基准）:
   - 不含税单价 = 含税单价 ÷ (1+税率)
   - 其余同场景1
3. **修改不含税金额**（基准）:
   - 税额 = 不含税金额 × 税率
   - 价税合计 = 不含税金额 + 税额
   - 不含税单价 = 不含税金额 ÷ 数量
   - 含税单价 = 不含税单价 × (1+税率)
4. **修改税额**（不倒算单价）:
   - 核心逻辑：锁定单价，仅调整金额
   - 不含税金额 = 价税合计 - 税额
   - 保持单价不变
5. **修改价税合计**（基准）:
   - 不含税金额 = 价税合计 ÷ (1+税率)
   - 税额 = 价税合计 - 不含税金额
   - 不含税单价 = 不含税金额 ÷ 数量
   - 含税单价 = 不含税单价 × (1+税率)

**触发时机**:

- 输入完成或失去焦点时触发对应场景计算
- 税率/数量修改时以"不含税单价为基准"重算
- 尾差优先调整税额最后1位小数
- 数量=0时修改单价不会刷新金额

**业务规则**:

- 保存校验：业务日期属于当前期间 且 分录同步状态≠"是"
- 会计期间已结账则不允许录入
- 生效状态锁定所有字段

**外部系统同步规则**:

- **生效后同步目标**:
  - **EBS（Oracle ERP）**: 同步销售出库单据用于成本核算和财务记账
  - **金蝶云星空**: 同步销售出库单据用于税务处理和资金管理
  
- **同步标识机制**:
  - 每条明细行都有 `syncEbsFlag` 和 `syncKingdeeFlag` 字段
  - 单据头的同步标识由分录决定：
    - `syncEbsFlag`: 所有分录的 syncEbsFlag 都是"是"时，单据头才为"是"
    - `syncKingdeeFlag`: 所有分录的 syncKingdeeFlag 都是"是"时，单据头才为"是"
  
- **同步触发时机**:
  - 单据**生效**后自动触发同步任务
  - 同步任务异步执行，不阻塞用户操作
  - 同步成功后反写对应标识为"是"
  - 同步失败记录异常信息，支持手动重试
  
- **同步数据范围**:
  - **同步到EBS**: 单据头信息 + 应收明细行 + 成本明细行（含金额、税额、物料信息）
  - **同步到金蝶**: 单据头信息 + 应收明细行（含客户、合同、税务信息）
  
- **同步后限制**:
  - 已同步至EBS的分录不允许编辑（syncEbsFlag="是"）
  - 已同步至金蝶的分录不允许编辑（syncKingdeeFlag="是"）
  - 整单不允许编辑的条件：任一系统的同步标识为"是"

***

### Requirement: 应收管理模块

系统 SHALL 提供应收单管理功能，支持应收单的录入、审核和EBS同步。

#### R5.1: 应收单管理

- **WHEN** 用户访问应收单页面
- **THEN** 系统展示应收单列表，支持多维筛选
- **AND** 支持新增、编辑、保存、生效操作

**筛选条件**:

- 财务主体、业务日期、单据类型、单据编号、同步EBS状态
- 客户名称、会计期间、开工日期、业务类型/子类型、合同号、计税方式、到店门店

**数据模型**:

```
ReceivableDocument {
  id: string (PK)
  documentNo: string (AR+8位流水, 必填, 锁定)
  documentTypeId: string (FK -> DocumentType, 必填)
  financialEntityId: string (FK, 必填)
  storeId: string (到店门店, 必填)
  departmentId: string (销售部门, 必填)
  salesmanId: string (销售员)
  businessDate: date (必填)
  accountingPeriod: string (锁定, 自动带出, 校验未结账)
  status: enum [草稿, 生效]
  customerId: string (FK -> Merchant, 类型=客户, 必填)
  customerName: string (锁定)
  contact: string
  phone: string
  shippingAddress: string
  contractNo: string (FK -> Project, 必填)
  contractName: string (锁定)
  signingDate: date (锁定)
  startDate: date (锁定)
  financialConfirmationDate: date (锁定)
  taxationMethod: string (可编辑)
  productCategory: string (锁定)
  productName: string (锁定)
  requirementType: string (锁定)
  
  totalAmountTaxIncluded: decimal(10,2) (锁定)
  totalTaxAmount: decimal(10,2) (锁定)
  totalAmountExcludingTax: decimal(10,2) (锁定)
  totalCostAmount: decimal(10,2) (锁定)
  remark: string
  syncEbsFlag: enum [是, 否] (所有分录都是"是"时才为"是")
  syncKingdeeFlag: enum [是, 否] (所有分录都是"是"时才为"是")
  
  createdAt: datetime
  updatedAt: datetime
  
  // 应收明细
  receivableItems: Array<ReceivableItem>
  // 成本明细
  costItems: Array<CostItem>
}

ReceivableItem {
  id: string (PK)
  documentId: string (FK)
  lineNo: integer
  businessType: string (锁定)
  subBusinessType: string (FK -> BusinessType, 必填)
  salesOrderNo: string (锁定)
  materialCode: string (FK -> Material, 必填)
  materialName: string (锁定)
  batchNo: string
  unit: string (FK -> Unit, 必填)
  quantity: decimal (必填, ≠0)
  currencyId: string (FK -> Currency, 必填)
  unitPriceExcludingTax: decimal
  unitPriceTaxIncluded: decimal
  taxRate: decimal(5,2)
  amountTaxIncluded: decimal(10,2)
  taxAmount: decimal(10,2)
  amountExcludingTax: decimal(10,2)
  sourceDocumentType: string (锁定)
  sourceDocumentNo: string (锁定)
  syncEbsFlag: enum [是, 否]
  syncKingdeeFlag: enum [是, 否]
}
```

**业务规则**:

- 与销售出库单相同的保存校验规则
- 会计期间已结账不允许录入
- 生效后锁定所有字段

**外部系统同步规则**:

- **生效后同步目标**:
  - **EBS（Oracle ERP）**: 同步应收单据用于成本核算和财务记账
  - **金蝶云星空**: 同步应收单据用于应收账款管理和税务处理
  
- **同步标识机制**:
  - 每条明细行都有 `syncEbsFlag` 和 `syncKingdeeFlag` 字段
  - 单据头的同步标识由分录决定：
    - `syncEbsFlag`: 所有分录的 syncEbsFlag 都是"是"时，单据头才为"是"
    - `syncKingdeeFlag`: 所有分录的 syncKingdeeFlag 都是"是"时，单据头才为"是"
  
- **同步触发时机**:
  - 单据**生效**后自动触发同步任务
  - 同步任务异步执行，不阻塞用户操作
  - 同步成功后反写对应标识为"是"
  - 同步失败记录异常信息，支持手动重试
  
- **同步数据范围**:
  - **同步到EBS**: 单据头信息 + 应收明细行 + 成本明细行（含金额、税额、物料信息）
  - **同步到金蝶**: 单据头信息 + 应收明细行（含客户、合同、税务信息、收款类型）
  
- **同步后限制**:
  - 已同步至EBS的分录不允许编辑（syncEbsFlag="是"）
  - 已同步至金蝶的分录不允许编辑（syncKingdeeFlag="是"）
  - 整单不允许编辑的条件：任一系统的同步标识为"是"

***

### Requirement: 期末处理模块

系统 SHALL 提供期末结账、工序验收等功能。

#### R6.1: 期末结账

- **WHEN** 用户执行期末结账操作
- **THEN** 系统校验当前会计期间的所有业务单据已处理完毕
- **AND** 执行结账操作，锁定该期间的数据

**结账前校验**:

- 所有销售出库单已生效或同步EBS
- 所有应收单已生效或同步EBS
- 所有项目核算单据已确认
- 软装收入计算已完成

#### R6.2: 工序验收（二期）

- **WHEN** 项目达到某个工序节点
- **THEN** 系统支持工序验收操作
- **AND** 触发对应仓位物料出库

***

## Interface Specifications

### External System Integration

#### SVI 系统集成

**数据同步内容**:

- 客商数据（客户、供应商）
- 项目数据（整装、软装、设计费）
- 物料数据
- 收款数据（应收单、交易明细）

**接口要求**:

- 提供标准的 RESTful API
- 支持增量同步和全量同步
- 数据格式：JSON
- 认证方式：OAuth2.0

#### 积木云装 (SAAS) 集成

**数据同步内容**:

- 客商数据
- 项目数据
- 物料数据
- 计量单位数据
- 门店、部门、员工组织架构
- 收款数据（应收单、收款单）

**接口要求**:

- 同 SVI 系统
- 支持实时同步和定时批量同步

#### **金蝶云星空集成**

**数据获取内容**:

- 收款单（用于整装尾款计税）
- 收款退款单
- 应收单（计税应收金额）
- 软装工费数据

**性能要求**:

- 月均竣工工地 800-1000 个
- 每个工地约 20 个计税应收单
- 财务确认竣工后当天获取
- 要求中间表避免实时查询效率低

#### EBS 集成

**数据同步内容**:

- 出库成本数据（反写到销售出库单）
- 科目发生额数据（合同履约成本）
- 成本明细数据

**同步标识**:

- 每条分录都有 `syncEbsFlag` 字段
- 单据头的 `syncEbsFlag` 由分录决定（全部"是"才为"是"）

***

## Cross-System Data Source Summary (跨系统数据来源汇总)

### 基础资料 - 跨系统数据来源

| 数据实体 | 来源系统 | 同步方式 | 数据范围 | 备注 |
|---------|----------|----------|----------|------|
| **财务主体** | 积木云装 | 增量/全量同步 | 根据纳税人识别号对比同步 | 支持新增和更新同步 |
| **客商** | SVI + 积木云装 | 增量/全量同步 | 两个系统的客商数据都需要同步 | 包含客户和供应商 |
| **项目** | SVI + 积木云装 | 增量同步 | 合同状态=打开时同步 | 根据来源系统判断取值 |
| **物料** | SVI + 积木云装 | 全量同步 | 所有物料和单位换算数据 | 一般不手工新增/更新 |
| **成本比例配置** | 本地维护 | 手工录入 | - | 系统内独立维护 |

**关键规则**:
1. **财务主体**: 通过"同步新增财务主体"和"同步更新财务主体"按钮从积木云装获取
2. **客商**: SVI 和积木云装的客商数据都需同步到财务中台，支持变更日志查看
3. **项目**: 
   - 新增/编辑状态下跨系统字段锁定，不可人工修改
   - 合同状态=打开时才同步（避免历史数据因接口逻辑变更而变更）
   - 来源字段包括：基础信息（客户、订单、合同等）、核算信息（收入/成本相关）、状态信息
4. **物料**: 物料和物料单位换算所有字段由业务系统同步，财务中台一般不手工操作
5. **计量单位**: 从积木云装供应链域获取（见公共资料部分）

### 公共资料 - 跨系统数据来源

| 数据实体 | 来源系统 | 同步方式 | 数据范围 | 备注 |
|---------|----------|----------|----------|------|
| **计量单位** | 积木云装 (供应链域) | 增量/全量同步 | 计量单位和单位换算 | 从供应链域获取 |
| **币别** | 本地维护 | 手工录入 | - | 当前仅支持单币种 |
| **会计日历** | 本地维护 | 手工录入 | - | 系统内独立配置 |
| **单据类型** | 本地维护 | 手工录入 | - | 系统内定义 |
| **税率** | 本地维护 | 手工录入 | - | 系统内配置 |
| **发票类型** | 本地维护 | 手工录入 | - | 系统内配置 |
| **需求类型** | 本地维护 + 业务字典映射 | 手工录入+自动关联 | 关联SVI和积木云装的需求标签 | 与业务系统解耦设计 |
| **来源系统** | 本地维护 | 手工录入 | - | 用于标识数据来源 |
| **业务类型** | 本地维护 | 手工录入 | - | 系统内定义 |
| **工序** | 本地维护 (二期) | 手工录入 | - | 二期功能 |

**关键规则**:
1. **计量单位**: 新增和更新都必须从积木云装供应链域获取，不从其他系统或手工创建
2. **需求类型**: 
   - 中台自建一套稳定的需求类型体系
   - 与业务系统的需求标签做解耦
   - 通过灵活配置映射关联业务系统的需求标签及其归属的项目类型
   - 关联的订单需求标签直接取自业务系统现有枚举（SVI和积木云装）
3. **其他公共资料**: 币别、会计日历、单据类型、税率、发票类型等均为本地维护，不从外部系统同步

### 业务单据 - 外部系统数据依赖

| 单据类型 | 外部数据来源 | 依赖说明 | 获取时机 |
|---------|-------------|----------|----------|
| **销售出库单** | 项目基础资料 | 自动带出合同号、客户、产品等信息 | 编辑时 |
| **销售出库单** | 物料基础资料 | 选择物料后带出名称、单位等信息 | 编辑明细行时 |
| **销售出库单** | 积木云装 | 到店门店、销售部门、销售员 | 编辑时选择 |
| **应收单** | 项目基础资料 | 自动带出合同号、签单日期、计税方式等 | 编辑时 |
| **应收单** | 客商基础资料 | 选择客户后带出名称等信息 | 编辑时 |
| **应收单** | 积木云装 | 到店门店、销售部门、销售员 | 编辑时选择 |
| **项目核算单据** | 项目基础资料 | 采集所有项目相关信息 | 核算时 |
| **项目核算单据** | 金蝶云星空 | 整装尾款计税金额（收款单、退款单） | 核算前检查 |
| **项目核算单据** | EBS | 合同履约成本科目发生额 | 核算前检查 |
| **软装收入计算单** | 销售出库单 | 采集出库明细作为分摊依据 | 计算时 |
| **软装收入计算单** | 金蝶云星空 | 软装工费数据 | 核算前校验 |

***

## Data Dictionary

### Common Fields

| 字段名                 | 类型       | 说明                    | 示例                                     |
| ------------------- | -------- | --------------------- | -------------------------------------- |
| id                  | string   | 主键UUID                | "550e8400-e29b-41d4-a716-446655440000" |
| code                | string   | 编码                    | "FIN001"                               |
| name                | string   | 名称                    | "财务主体A"                                |
| status              | enum     | 状态                    | "启用"/"停用"                              |
| createdAt           | datetime | 创建时间                  | "2026-01-15 10:30:00"                  |
| updatedAt: datetime | 更新时间     | "2026-01-16 14:20:00" | <br />                                 |

### Enumerations

**项目类型**: 整装 | 软装 | 设计费

**计税方式**: 一般计税 | 简易计税

**纳税人类型**: 一般纳税人 | 小规模纳税人

**客商类型**: 客户 | 供应商 | 客供一体

**客商性质**: 法人 | 自然人 | 个体户

**项目状态**: 待开工 | 在建 | 停工 | 竣工 | 退单

**单据状态**: 草稿 | 生效

**单据类型应用**:

- 应收单
- 销售出库单
- 项目收入核算单
- 销售收入计算单

**核算方法**: 完成合同法 | 完工百分比法 | 收款确收

**期间类型**: 自然月 | 月

**来源系统**: svi | 积木云装

**业务线**:

- 零售–零售–SHJ–整装业务
- 零售–零售–SHJ–局改业务
- 零售–零售–SHJ–软装业务
- 零售–零售–SHJ–定制业务
- 零售–零售–SHJ–设计业务
- 零售–零售–SHJ–零售业务
- 零售–零售–SHJ–服务业务
- 零售–零售–SHJ–其他业务

**发包模式**: 项目经理 | 工程师

***

## Business Rules Summary

### 通用交互规则

1. **权限控制**: 不同角色可访问不同功能模块
2. **列表功能**: 支持排序、分页、空态显示、异常提示
3. **新建/编辑**: 支持表单校验、防重复提交、操作反馈
4. **删除操作**: 重要操作需二次确认，检查依赖数据
5. **状态切换**: 变更时进行校验确保数据一致性
6. **筛选条件**: 未特殊说明时全局风格统一
7. **默认值规则**:
   - 会计期间筛选：默认当前会计期间
   - 业务日期筛选：默认当月

### 数据校验规则

1. **唯一性校验**: 编码字段必须唯一
2. **必填校验**: 标记必填的字段不能为空
3. **长度校验**: 字符串字段长度限制
4. **范围校验**: 数值字段范围限制
5. **关联校验**: 外键关联数据存在性
6. **业务校验**: 特定业务规则的校验

### 跨系统数据同步规则

1. **数据源优先级**: 跨系统字段不可手动修改
2. **同步时机**:
   - 合同状态=打开时同步项目数据
   - 物料/计量单位从业务系统同步
3. **数据一致性**: 多系统数据冲突时的处理策略

***

## Non-Functional Requirements

### Performance Requirements

1. **响应时间**: 页面加载 < 3秒，查询操作 < 2秒
2. **并发用户**: 支持 100+ 用户同时在线操作
3. **数据处理**: 批量核算任务支持异步执行，提供进度反馈
4. **数据同步**: 跨系统数据同步延迟 < 5分钟（实时同步场景）

### Security Requirements

1. **身份认证**: 基于 RBAC 的权限控制
2. **数据加密**: 敏感数据传输加密（HTTPS）
3. **审计日志**: 关键操作记录操作日志
4. **数据隔离**: 多财务主体数据隔离

### Reliability Requirements

1. **可用性**: 系统可用性 ≥ 99.9%
2. **数据备份**: 每日增量备份，每周全量备份
3. **故障恢复**: RTO ≤ 4小时，RPO ≤ 1小时
4. **容错机制**: 异步任务失败重试机制

### Scalability Requirements

1. **水平扩展**: 支持微服务架构，各模块独立部署
2. **数据库**: 支持读写分离、分库分表
3. **缓存**: Redis 缓存热点数据
4. **消息队列**: 异步任务解耦

***

## Page Implementation Mapping

### HTML Pages List (30 pages)

| 页面文件                            | 模块   | 功能描述                |
| ------------------------------- | ---- | ------------------- |
| index.html                      | 首页   | 系统概览和快速导航           |
| financial-entity.html           | 基础资料 | 财务主体管理              |
| merchant.html                   | 基础资料 | 客商管理（含分组）           |
| project.html                    | 基础资料 | 项目管理                |
| material.html                   | 基础资料 | 物料管理（含分类、单位换算）      |
| cost-ratio.html                 | 基础资料 | 成本比例配置              |
| currency.html                   | 公共资料 | 币别管理                |
| accounting-calendar.html        | 公共资料 | 会计日历管理              |
| document-type.html              | 公共资料 | 单据类型管理              |
| tax-rate.html                   | 公共资料 | 税率管理                |
| invoice-type.html               | 公共资料 | 发票类型管理              |
| unit.html                       | 公共资料 | 计量单位管理              |
| requirement-type.html           | 公共资料 | 需求类型管理              |
| source-system.html              | 公共资料 | 来源系统管理              |
| accounting-method.html          | 项目管理 | 核算方法管理              |
| accounting-workbench.html       | 项目管理 | 核算工作台               |
| soft-revenue-calculation.html   | 项目管理 | 软装收入计算任务            |
| project-revenue-accounting.html | 项目管理 | 项目收入核算任务            |
| project-accounting.html         | 项目管理 | 项目收入核算              |
| adjustment-order.html           | 项目管理 | 调整单管理               |
| inventory-detail.html           | 项目管理 | 库存明细查询              |
| sales-outbound.html             | 库存管理 | 销售出库管理              |
| stock-reconciliation.html       | 库存管理 | 销售出库单               |
| receivable.html                 | 应收管理 | 应收单管理               |
| period-end.html                 | 期末处理 | 启用管理、库存关账、项目关账、期末结账 |
| navigation-template.html        | 公共   | 导航模板                |

***

## Technical Constraints

### Frontend Technology Stack

- **UI Framework**: 原生 HTML + CSS + JavaScript
- **Style Guide**: 统一的组件库和交互规范
- **Responsive Design**: 支持主流浏览器（Chrome、Firefox、Safari、Edge）
- **Accessibility**: 符合 WCAG 2.1 AA 标准

### Backend Technology Stack (待确认)

- **API Style**: RESTful API
- **Database**: 待确认（建议 PostgreSQL/MySQL）
- **Cache**: Redis
- **Message Queue**: RabbitMQ/Kafka
- **File Storage**: OSS/S3

### Integration Patterns

- **Synchronous API**: 实时数据查询和CRUD操作
- **Asynchronous Task**: 批量计算、数据同步、报表生成
- **Event-Driven**: 跨系统数据变更通知
- **Scheduled Job**: 定时数据同步和清理任务

***

## Future Considerations

### Phase 2 Features (二期)

1. **工序管理**: 施工节点定义、工序验收、自动出库
2. **多币种支持**: 多币种核算、汇率管理
3. **预算管理**: 项目预算编制、预算控制
4. **报表中心**: 自定义报表、财务报表

### Enhancement Opportunities

1. **移动端适配**: 支持移动设备审批和查询
2. **智能核算**: AI辅助的收入预测和异常检测
3. **数据分析**: BI看板和数据挖掘
4. **流程自动化**: RPA自动化重复操作

***

## Appendix

### A. Term Definitions (名词解释)

| 术语   | 定义                                                     |
| ---- | ------------------------------------------------------ |
| 财务主体 | 核算主体与组织架构，明确核算范围，支持多组织核算                               |
| 客商   | 客户与供应商的统称，维护往来对象信息                                     |
| 项目   | 公司主营业务（装修项目，一个主合同一个项目，一般区分为整装、软装、设计费），作为成本归集、收入确认的核心维度 |
| 物料   | 商品/产品基础信息，统一计价、核算与成本口径                                 |
| 会计期间 | 会计年度的时间分段，用于核算和报表                                      |
| 核算方法 | 收入确认的方法：完成合同法、完工百分比法、收款确收                              |
| EBS  | Oracle ERP 系统，京东集团的财务核算系统                              |
| 金蝶   | 金蝶云星空系统，用于税务和资金管理                                      |
| SVI  | 生活家旧业务系统                                               |
| 积木云装 | 生活家SAAS 化的业务系统                                         |

### B. References

- PRD文档: `/PRD/prd.md`
- 页面实现: 30个HTML文件（根目录）
- 公共样式: `/common/styles.css`
- 公共脚本: `/common/scripts.js`, `/js/req-annotation.js`

### C. Revision History

| 版本  | 日期         | 作者     | 变更说明                    |
| --- | ---------- | ------ | ----------------------- |
| 1.0 | 2026-04-21 | System | 初始版本，基于PRD和页面实现创建完整规格文档 |


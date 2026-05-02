#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-prd.py
将 PRD/prd.md 与 PRD/CHANGELOG.md 切片为 common/prd-sections.json，
供原型页面 PRD 抽屉运行时按页面文件名读取展示。

用法:
    python3 tools/build-prd.py

输出:
    common/prd-sections.json
"""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Dict, List, Optional, Tuple

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRD_FILE = os.path.join(ROOT, "PRD", "prd.md")
CHANGELOG_FILE = os.path.join(ROOT, "PRD", "CHANGELOG.md")
OUTPUT_FILE = os.path.join(ROOT, "common", "prd-sections.json")

# 页面 -> {模块名, 可选子章节名}
# 提取规则:
#   - 仅指定 module: 抽出整段 ## 【module】... 模块内容
#   - 指定 module + section: 抽出该模块内 ### 或 #### 子章节
# 注意: 子章节名需与 PRD/prd.md 中的 ### / #### 标题文本完全一致
PAGE_MAP: Dict[str, Dict[str, str]] = {
    # 首页
    "index.html": {"module": "首页"},
    # 基础资料（5 页 + 模块自身说明）
    "financial-entity.html": {"module": "基础资料", "section": "财务主体"},
    "merchant.html": {"module": "基础资料", "section": "客商"},
    "project.html": {"module": "基础资料", "section": "项目"},
    "material.html": {"module": "基础资料", "section": "物料"},
    "cost-ratio.html": {"module": "基础资料", "section": "成本比例配置"},
    # 公共资料（9 页）
    "currency.html": {"module": "公共资料", "section": "币别"},
    "accounting-calendar.html": {"module": "公共资料", "section": "会计日历"},
    "document-type.html": {"module": "公共资料", "section": "单据类型"},
    "business-type.html": {"module": "公共资料", "section": "业务类型"},
    "tax-rate.html": {"module": "公共资料", "section": "税率"},
    "invoice-type.html": {"module": "公共资料", "section": "发票类型"},
    "unit.html": {"module": "公共资料", "section": "计量单位"},
    "requirement-type.html": {"module": "公共资料", "section": "需求类型"},
    "source-system.html": {"module": "公共资料", "section": "来源系统"},
    # 项目核算（5 页，section 名需包含原文角标如 [1] [5] [13] [22]）
    "accounting-method.html":{"module": "项目核算", "section": "核算方法管理 [1]"},
    "accounting-workbench.html": {"module": "项目核算", "section": "核算工作台 [1]"},
    "decoration-accounting.html": {"module": "项目核算", "section": "整装核算 [5]"},
    "soft-accounting.html": {"module": "项目核算", "section": "软装核算 [13]"},
    "revenue-cost-adjustment.html": {"module": "项目核算", "section": "收入成本调整 [22]"},
    # 库存管理
    "sales-outbound.html": {"module": "库存管理", "section": "销售出库"},
    # 应收管理
    "receivable.html": {"module": "应收管理", "section": "应收单"},
    # 期末处理（整模块，含 4 个子章节）
    "period-end.html": {"module": "期末处理"},
    # 集成管理
    "ebs-mapping.html": {"module": "集成管理", "section": "EBS映射配置"},
    "sync-log.html": {"module": "集成管理", "section": "同步日志"},
}

MODULE_HEADER_RE = re.compile(r"^##\s+【(?P<name>[^】]+)】.*$")
# 子章节同时支持 ### 与 #### 两级（基础资料 / 公共资料下按 #### 组织页面）
SECTION_HEADER_RE = re.compile(r"^#{3,4}\s+(?P<name>.+?)\s*$")
CHANGELOG_DATE_RE = re.compile(r"^##\s+(?P<date>\d{4}-\d{2}-\d{2})\s*$")
CHANGELOG_ITEM_RE = re.compile(
    r"^-\s*\[(?P<tag>[^\]]+)\]\s*(?P<summary>.+)$"
)


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# 与前端 common/prd-viewer.js / prd-full.html 保持一致的 slug 规则：
#   - 去首尾空白
#   - 空白 -> '-'
#   - 非 [\w\-\u4e00-\u9fa5] 字符去除
_SLUG_CLEAN_RE = re.compile(r"\s+")
_SLUG_KEEP_RE = re.compile(r"[^\w\-\u4e00-\u9fa5]+")


def slugify(text: str) -> str:
    base = _SLUG_CLEAN_RE.sub("-", text.strip())
    base = _SLUG_KEEP_RE.sub("", base)
    return base or "section"


def slice_module(prd_text: str, module_name: str) -> Optional[str]:
    """从 PRD 中切出指定模块的完整内容（含模块标题，到下一 ## 标题前结束）。"""
    lines = prd_text.splitlines()
    start: Optional[int] = None
    end: int = len(lines)
    for i, line in enumerate(lines):
        m = MODULE_HEADER_RE.match(line)
        if m and m.group("name") == module_name:
            start = i
            continue
        if start is not None and line.startswith("## ") and not line.startswith("### "):
            # 遇到下一个 ## 标题，结束
            if i != start:
                end = i
                break
    if start is None:
        return None
    return "\n".join(lines[start:end]).rstrip() + "\n"


def locate_module(prd_text: str, module_name: str) -> Optional[Tuple[int, int]]:
    """返回模块在 prd.md 中的起止行号（1-based，含起止）。

    - 起始行: ##【模块名】 所在行
    - 结束行: 下一个 ## 标题的前一行；若无则到文件末尾
    """
    lines = prd_text.splitlines()
    start: Optional[int] = None
    end: int = len(lines)
    for i, line in enumerate(lines):
        m = MODULE_HEADER_RE.match(line)
        if m and m.group("name") == module_name:
            start = i
            continue
        if start is not None and line.startswith("## ") and not line.startswith("### "):
            if i != start:
                end = i
                break
    if start is None:
        return None
    return (start + 1, end)  # 1-based 起始；end 已是排他上界，对应最后内容行


def slice_section(module_text: str, section_name: str) -> Optional[str]:
    """从模块内容中切出指定 ### 或 #### 子章节（含标题，到遇到同级或更高级标题为止）。"""
    lines = module_text.splitlines()
    start: Optional[int] = None
    start_level: int = 0  # 3 => ###；4 => ####
    end: int = len(lines)
    for i, line in enumerate(lines):
        m = SECTION_HEADER_RE.match(line)
        if m and m.group("name").strip() == section_name and start is None:
            start = i
            # 判断本次匹配的层级
            hashes = len(line) - len(line.lstrip("#"))  # 简单版本：按前缀 # 数
            # lstrip 方向错了，用切片更稳妥
            start_level = len(line) - len(line.lstrip()) if False else 0
            # 精确统计前导 # 的数量
            k = 0
            while k < len(line) and line[k] == "#":
                k += 1
            start_level = k
            continue
        if start is not None and i > start:
            # 统计该行前导 # 数量
            k = 0
            while k < len(line) and line[k] == "#":
                k += 1
            # 遇到同级或更高级（# 数量 <= start_level）的 Markdown 标题则截断
            if k > 0 and k <= start_level and line[k:k + 1] == " ":
                end = i
                break
    if start is None:
        return None
    return "\n".join(lines[start:end]).rstrip() + "\n"


def locate_section(
    prd_text: str, module_range: Tuple[int, int], section_name: str
) -> Optional[Tuple[int, int]]:
    """在给定模块行区间（1-based）内定位子章节起止行号，支持 ### 与 ####。"""
    lines = prd_text.splitlines()
    mod_start, mod_end = module_range
    start: Optional[int] = None
    start_level: int = 0
    end: int = mod_end
    for idx in range(mod_start - 1, mod_end):
        line = lines[idx]
        m = SECTION_HEADER_RE.match(line)
        if m and m.group("name").strip() == section_name and start is None:
            start = idx
            k = 0
            while k < len(line) and line[k] == "#":
                k += 1
            start_level = k
            continue
        if start is not None and idx > start:
            k = 0
            while k < len(line) and line[k] == "#":
                k += 1
            if k > 0 and k <= start_level and line[k:k + 1] == " ":
                end = idx
                break
    if start is None:
        return None
    return (start + 1, end)


def parse_changelog(changelog_text: str) -> List[Dict[str, str]]:
    """解析 CHANGELOG.md 为条目列表 [{date, tag, summary}]，按文档出现顺序保留（最新在前）。"""
    entries: List[Dict[str, str]] = []
    current_date: Optional[str] = None
    for raw_line in changelog_text.splitlines():
        line = raw_line.rstrip()
        m_date = CHANGELOG_DATE_RE.match(line)
        if m_date:
            current_date = m_date.group("date")
            continue
        if current_date:
            m_item = CHANGELOG_ITEM_RE.match(line.lstrip())
            if m_item:
                entries.append(
                    {
                        "date": current_date,
                        "tag": m_item.group("tag").strip(),
                        "summary": m_item.group("summary").strip(),
                    }
                )
    return entries


def filter_changelog(
    entries: List[Dict[str, str]], module: str, section: Optional[str]
) -> List[Dict[str, str]]:
    """根据页面映射筛选 changelog 条目。
    - 若提供 section: 匹配 [module/section] 或 [module]（模块整体改动也算本页相关）
    - 若仅 module: 匹配 [module] 与 [module/*]
    """
    result: List[Dict[str, str]] = []
    for e in entries:
        tag = e["tag"]
        # 解析标签: 模块 或 模块/子章节
        if "/" in tag:
            mod, sec = (s.strip() for s in tag.split("/", 1))
        else:
            mod, sec = tag.strip(), None
        if mod != module:
            continue
        if section is None:
            # 仅模块: 任何 [module] 或 [module/*] 都算
            result.append({"date": e["date"], "summary": e["summary"], "scope": tag})
        else:
            if sec is None or sec == section:
                result.append({"date": e["date"], "summary": e["summary"], "scope": tag})
    return result


def build() -> Tuple[Dict[str, Dict], List[str]]:
    if not os.path.exists(PRD_FILE):
        print(f"[ERROR] PRD 文件不存在: {PRD_FILE}", file=sys.stderr)
        sys.exit(1)
    prd_text = read_text(PRD_FILE)
    changelog_text = read_text(CHANGELOG_FILE) if os.path.exists(CHANGELOG_FILE) else ""
    changelog_entries = parse_changelog(changelog_text)

    sections: Dict[str, Dict] = {}
    warnings: List[str] = []

    for page, cfg in PAGE_MAP.items():
        module = cfg["module"]
        section = cfg.get("section")
        module_range = locate_module(prd_text, module)
        module_text = slice_module(prd_text, module)
        if module_text is None or module_range is None:
            warnings.append(f"[{page}] 找不到模块: 【{module}】")
            sections[page] = {
                "title": section or module,
                "module": module,
                "section": section,
                "markdown": "",
                "changelog": [],
                "missing": True,
            }
            continue
        section_range: Optional[Tuple[int, int]] = None
        if section:
            md = slice_section(module_text, section)
            section_range = locate_section(prd_text, module_range, section)
            if md is None:
                warnings.append(f"[{page}] 模块【{module}】内未找到子章节: ### {section}")
                md = ""
        else:
            md = module_text
        cl = filter_changelog(changelog_entries, module, section)
        # 锚点 slug：与前端 prd-viewer.js / prd-full.html 保持一致（原文本 + 去空格）
        module_slug = slugify(module)
        section_slug = slugify(section) if section else None
        sections[page] = {
            "title": section or module,
            "module": module,
            "section": section,
            "markdown": md,
            "changelog": cl,
            "missing": not bool(md),
            # 全文定位用
            "moduleSlug": module_slug,
            "sectionSlug": section_slug,
            "moduleRange": {"start": module_range[0], "end": module_range[1]},
            "sectionRange": (
                {"start": section_range[0], "end": section_range[1]}
                if section_range
                else None
            ),
        }

    return sections, warnings


def main() -> int:
    sections, warnings = build()
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated": True,
                "schema": 1,
                "sections": sections,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    rel_out = os.path.relpath(OUTPUT_FILE, ROOT)
    print(f"[OK] 已生成 {rel_out}（{len(sections)} 个页面映射）")
    if warnings:
        print("[WARN] 以下条目存在缺失:")
        for w in warnings:
            print("  - " + w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
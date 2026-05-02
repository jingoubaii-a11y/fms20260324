#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量在原型页面 </body> 前插入 PRD Viewer 接入片段。
- 已存在则跳过
- 必须出现在最末尾的 </body> 前
- 仅处理 PAGE_MAP 中列出的页面
"""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SNIPPET = (
    "    <!-- PRD Viewer -->\n"
    '    <link rel="stylesheet" href="common/prd-viewer.css">\n'
    '    <script src="common/prd-viewer.js" defer></script>\n'
)

# 待接入的页面（与 build-prd.py 的 PAGE_MAP 一致，但排除已接入的 ebs-mapping/sync-log）
TARGET_PAGES = [
    "index.html",
    # 基础资料
    "financial-entity.html", "merchant.html", "project.html",
    "material.html", "cost-ratio.html",
    # 公共资料
    "currency.html", "accounting-calendar.html", "document-type.html",
    "business-type.html", "tax-rate.html", "invoice-type.html",
    "unit.html", "requirement-type.html", "source-system.html",
    # 项目核算
    "accounting-method.html", "accounting-workbench.html",
    "decoration-accounting.html", "soft-accounting.html",
    "revenue-cost-adjustment.html",
    # 库存管理
    "sales-outbound.html",
    # 应收管理
    "receivable.html",
    # 期末处理
    "period-end.html",
]

MARKER = "common/prd-viewer.js"
BODY_CLOSE = "</body>"


def inject(path: str) -> str:
    """返回处理结果: skipped / injected / error"""
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return f"missing"
    with open(full, "r", encoding="utf-8") as f:
        text = f.read()
    if MARKER in text:
        return "skipped"
    # 仅替换最后一处 </body>
    idx = text.rfind(BODY_CLOSE)
    if idx == -1:
        return "no-body"
    new_text = text[:idx] + "\n" + SNIPPET + text[idx:]
    with open(full, "w", encoding="utf-8") as f:
        f.write(new_text)
    return "injected"


def main() -> int:
    stats = {"injected": 0, "skipped": 0, "missing": 0, "no-body": 0}
    for page in TARGET_PAGES:
        result = inject(page)
        stats[result] = stats.get(result, 0) + 1
        flag = {
            "injected": "✓",
            "skipped": "·",
            "missing": "✗",
            "no-body": "!",
        }.get(result, "?")
        print(f"  {flag} {result:9} {page}")
    print()
    print(f"完成：注入 {stats['injected']}、跳过 {stats['skipped']}、"
          f"缺文件 {stats['missing']}、无 body {stats['no-body']}")
    return 0 if stats["missing"] == 0 and stats["no-body"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
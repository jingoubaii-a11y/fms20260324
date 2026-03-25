#!/usr/bin/env python3
"""
批量更新所有页面，为它们添加页面特定的初始化函数，确保按钮点击事件能够正常工作。
"""

import os
import re

# 定义需要更新的页面列表
pages_to_update = [
    'accounting-calendar.html',
    'accounting-method.html',
    'cost-ratio.html',
    'currency.html',
    'document-type.html',
    'financial-entity.html',
    'invoice-type.html',
    'material.html',
    'merchant.html',
    'process-acceptance.html',
    'project-accounting.html',
    'project-overview.html',
    'project.html',
    'requirement-type.html',
    'source-system.html',
    'tax-rate.html',
    'unit.html'
]

# 定义初始化函数模板
def get_init_function(page_name):
    """
    根据页面名称生成对应的初始化函数
    """
    # 提取页面名称（不含扩展名）
    page_base = os.path.splitext(page_name)[0]
    
    # 生成按钮ID和抽屉ID的映射
    button_id_map = {
        'invoice-type.html': 'add-invoice-type',
        'requirement-type.html': 'add-requirement-type',
        'unit.html': 'add-unit',
        'material.html': 'add-btn',
        'merchant.html': 'add-btn',
        'project.html': 'add-btn',
        'accounting-calendar.html': 'add-btn',
        'accounting-method.html': 'add-btn',
        'cost-ratio.html': 'add-btn',
        'currency.html': 'add-btn',
        'document-type.html': 'add-btn',
        'financial-entity.html': 'add-btn',
        'process-acceptance.html': 'add-btn',
        'project-accounting.html': 'add-btn',
        'project-overview.html': 'add-btn',
        'source-system.html': 'add-btn',
        'tax-rate.html': 'add-btn'
    }
    
    drawer_id_map = {
        'invoice-type.html': 'invoice-type-drawer',
        'requirement-type.html': 'requirement-type-drawer',
        'unit.html': 'unit-drawer',
        'material.html': 'material-drawer',
        'merchant.html': 'merchant-drawer',
        'project.html': 'project-drawer',
        'accounting-calendar.html': 'accounting-calendar-drawer',
        'accounting-method.html': 'accounting-method-drawer',
        'cost-ratio.html': 'cost-ratio-drawer',
        'currency.html': 'currency-drawer',
        'document-type.html': 'document-type-drawer',
        'financial-entity.html': 'financial-entity-drawer',
        'process-acceptance.html': 'process-acceptance-drawer',
        'project-accounting.html': 'project-accounting-drawer',
        'project-overview.html': 'project-overview-drawer',
        'source-system.html': 'source-system-drawer',
        'tax-rate.html': 'tax-rate-drawer'
    }
    
    # 获取当前页面的按钮ID和抽屉ID
    button_id = button_id_map.get(page_name, 'add-btn')
    drawer_id = drawer_id_map.get(page_name, f'{page_base}-drawer')
    
    # 生成初始化函数
    init_function = f'''
        // 初始化页面特定功能
        function initPageFunctions() {{
            // 新增按钮点击事件
            const addBtn = document.getElementById('{button_id}');
            const drawer = document.getElementById('{drawer_id}');
            
            if (addBtn && drawer) {{
                addBtn.addEventListener('click', function() {{
                    // 确保openDrawer函数可用
                    if (typeof openDrawer === 'function') {{
                        openDrawer(drawer);
                    }} else {{
                        // 如果openDrawer函数不可用，直接添加open类
                        drawer.classList.add('open');
                        const drawerOverlay = document.getElementById('drawer-overlay');
                        if (drawerOverlay) {{
                            drawerOverlay.classList.add('open');
                        }}
                    }}
                }});
            }}
            
            // 关闭抽屉按钮
            const closeDrawerBtn = document.getElementById('close-drawer');
            const cancelBtn = document.getElementById('cancel-btn');
            
            if (closeDrawerBtn && drawer) {{
                closeDrawerBtn.addEventListener('click', function() {{
                    if (typeof closeDrawer === 'function') {{
                        closeDrawer(drawer);
                    }} else {{
                        drawer.classList.remove('open');
                        const drawerOverlay = document.getElementById('drawer-overlay');
                        if (drawerOverlay) {{
                            drawerOverlay.classList.remove('open');
                        }}
                    }}
                }});
            }}
            
            if (cancelBtn && drawer) {{
                cancelBtn.addEventListener('click', function() {{
                    if (typeof closeDrawer === 'function') {{
                        closeDrawer(drawer);
                    }} else {{
                        drawer.classList.remove('open');
                        const drawerOverlay = document.getElementById('drawer-overlay');
                        if (drawerOverlay) {{
                            drawerOverlay.classList.remove('open');
                        }}
                    }}
                }});
            }}
            
            // 编辑按钮点击事件
            const editButtons = document.querySelectorAll('.edit-{page_base}');
            editButtons.forEach(button => {{
                button.addEventListener('click', function() {{
                    if (typeof openDrawer === 'function') {{
                        openDrawer(drawer);
                    }} else {{
                        drawer.classList.add('open');
                        const drawerOverlay = document.getElementById('drawer-overlay');
                        if (drawerOverlay) {{
                            drawerOverlay.classList.add('open');
                        }}
                    }}
                    // 这里可以添加填充编辑数据的逻辑
                }});
            }});
        }}
        
        // 页面加载完成后初始化页面特定功能
        document.addEventListener('DOMContentLoaded', function() {{
            // 等待公共脚本加载完成
            setTimeout(initPageFunctions, 300);
        }});
'''
    
    return init_function

def update_page(page_path):
    """
    更新单个页面，添加初始化函数
    """
    try:
        with open(page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 生成初始化函数
        page_name = os.path.basename(page_path)
        init_function = get_init_function(page_name)
        
        # 查找脚本结束标签前的位置
        script_end_pattern = r'(\s*// 页面加载完成后加载侧边栏[\s\S]*?loadSidebar\(\);\s*}\s*\n)(\s*</script>)'
        match = re.search(script_end_pattern, content)
        
        if match:
            # 提取匹配的部分和脚本结束标签
            before_init = match.group(1)
            script_end = match.group(2)
            
            # 构建新的内容
            new_content = content.replace(match.group(0), before_init + init_function + script_end)
            
            # 写入更新后的内容
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✓ 已更新 {page_name}")
        else:
            print(f"⚠ 未找到更新位置 {page_name}")
    except Exception as e:
        print(f"✗ 更新失败 {os.path.basename(page_path)}: {e}")

def main():
    """
    主函数，批量更新所有页面
    """
    print("开始更新页面...")
    print("=" * 50)
    
    for page in pages_to_update:
        page_path = os.path.join(os.path.dirname(__file__), page)
        if os.path.exists(page_path):
            update_page(page_path)
        else:
            print(f"⚠ 页面不存在 {page}")
    
    print("=" * 50)
    print("更新完成！")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import os
import re

# 要修改的文件列表
files_to_update = [
    'project.html',
    'unit.html',
    'invoice-type.html',
    'merchant.html',
    'requirement-type.html',
    'material.html',
    'tax-rate.html',
    'source-system.html',
    'project-overview.html',
    'project-accounting.html',
    'process-acceptance.html'
]

# 侧边栏容器HTML
sidebar_container = '<div id="sidebar-container"></div>'

# 侧边栏加载脚本
sidebar_script = '''
        // 加载侧边栏
        async function loadSidebar() {
            try {
                const response = await fetch('common/sidebar.html');
                const sidebarHtml = await response.text();
                document.getElementById('sidebar-container').innerHTML = sidebarHtml;
                
                // 加载公共脚本
                const script = document.createElement('script');
                script.src = 'common/scripts.js';
                script.onload = function() {
                    // 脚本加载完成后初始化
                    if (typeof initCommonFunctions === 'function') {
                        initCommonFunctions();
                    }
                    // 初始化页面特定功能
                    initPageFunctions();
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('加载侧边栏失败:', error);
            }
        }
        
        // 页面加载完成后加载侧边栏
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadSidebar);
        } else {
            loadSidebar();
        }
'''

# 页面特定功能包装函数
page_functions_wrapper = '''
        // 页面特定功能
        function initPageFunctions() {
'''

# 遍历文件进行修改
for file_name in files_to_update:
    file_path = os.path.join('/Users/lecter/Documents/财务中台2_优化/prototype', file_name)
    
    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        continue
    
    print(f"处理文件: {file_name}")
    
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换硬编码的侧边栏为侧边栏容器
    # 匹配整个aside标签及其内容
    sidebar_pattern = r'<aside id="sidebar"[\s\S]*?</aside>'
    if re.search(sidebar_pattern, content):
        content = re.sub(sidebar_pattern, sidebar_container, content)
        print(f"  - 替换了硬编码侧边栏")
    else:
        print(f"  - 未找到硬编码侧边栏")
        continue
    
    # 查找脚本标签
    script_pattern = r'(<script>)([\s\S]*?)(</script>)'
    match = re.search(script_pattern, content)
    if match:
        script_start = match.group(1)
        script_content = match.group(2)
        script_end = match.group(3)
        
        # 检查是否已经有loadSidebar函数
        if 'loadSidebar' not in script_content:
            # 包装页面特定功能
            if '// 初始化Lucide图标' in script_content:
                # 找到初始化Lucide图标的位置
                lucide_init_pos = script_content.find('// 初始化Lucide图标')
                # 在初始化Lucide图标之前插入侧边栏加载脚本
                new_script_content = script_content[:lucide_init_pos] + sidebar_script + '\n\n        ' + script_content[lucide_init_pos:]
                
                # 找到第一个事件监听器或函数定义的位置
                # 查找常见的事件监听器模式
                event_patterns = [
                    r'const.*?=.*?getElementById',
                    r'document\.querySelector',
                    r'addEventListener',
                    r'function\s+\w+'
                ]
                
                insert_pos = None
                for pattern in event_patterns:
                    match = re.search(pattern, new_script_content)
                    if match:
                        insert_pos = match.start()
                        break
                
                if insert_pos:
                    # 在第一个事件监听器之前插入页面特定功能包装
                    new_script_content = new_script_content[:insert_pos] + page_functions_wrapper + '\n            ' + new_script_content[insert_pos:]
                    
                    # 在脚本结尾之前添加闭合大括号
                    if new_script_content.endswith('</script>'):
                        new_script_content = new_script_content[:-9] + '\n        }\n    </script>'
                    
                # 替换原始脚本
                content = content.replace(match.group(0), script_start + new_script_content + script_end)
                print(f"  - 添加了侧边栏加载脚本")
            else:
                print(f"  - 未找到Lucide图标初始化代码")
        else:
            print(f"  - 已经存在loadSidebar函数")
    else:
        print(f"  - 未找到脚本标签")
    
    # 保存修改后的文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  - 保存了修改后的文件")

print("\n处理完成！")

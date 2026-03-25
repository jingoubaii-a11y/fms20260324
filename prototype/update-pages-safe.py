#!/usr/bin/env python3
import os

# 要处理的文件列表
files = [
    "currency.html",
    "document-type.html",
    "invoice-type.html",
    "material.html",
    "merchant.html",
    "process-acceptance.html",
    "project-accounting.html",
    "project-overview.html",
    "project.html",
    "requirement-type.html",
    "source-system.html",
    "tax-rate.html",
    "unit.html"
]

# 侧边栏容器HTML
sidebar_container = '        <!-- 侧边栏 -->\n        <div id="sidebar-container"></div>'

# 加载侧边栏的脚本
load_sidebar_script = '''    <script>
        // 加载侧边栏
        async function loadSidebar() {
            try {
                const response = await fetch('common/sidebar.html');
                const sidebarHtml = await response.text();
                document.getElementById('sidebar-container').innerHTML = sidebarHtml;
                
                // 等待DOM更新完成
                setTimeout(() => {
                    // 加载公共脚本
                    const script = document.createElement('script');
                    script.src = 'common/scripts.js';
                    script.onload = function() {
                        // 脚本加载完成后初始化
                        if (typeof initCommonFunctions === 'function') {
                            initCommonFunctions();
                        }
                    };
                    document.body.appendChild(script);
                }, 100);
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
    </script>'''

# 公共CSS引用
common_css = '    <link rel="stylesheet" href="common/styles.css">'

for file in files:
    print(f"Processing {file}")
    
    # 确保文件存在
    if not os.path.exists(file):
        print(f"File {file} does not exist, skipping")
        continue
    
    # 备份原始文件
    backup_file = f"{file}.bak"
    if not os.path.exists(backup_file):
        try:
            os.system(f"cp {file} {backup_file}")
            print(f"Created backup: {backup_file}")
        except Exception as e:
            print(f"Error creating backup: {e}")
            continue
    
    try:
        # 读取文件内容
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 确保文件有内容
        if not content:
            print(f"File {file} is empty, skipping")
            continue
        
        # 替换样式部分
        if '<style>' in content and '</style>' in content:
            start = content.find('<style>')
            end = content.find('</style>', start) + len('</style>')
            content = content[:start] + common_css + content[end:]
            print(f"Replaced style section in {file}")
        
        # 替换侧边栏部分
        if '<!-- 侧边栏 -->' in content and '</aside>' in content:
            start = content.find('<!-- 侧边栏 -->')
            end = content.find('</aside>', start) + len('</aside>')
            content = content[:start] + sidebar_container + content[end:]
            print(f"Replaced sidebar section in {file}")
        
        # 替换脚本部分
        if '<script>' in content and '</script>' in content:
            start = content.rfind('<script>')
            end = content.rfind('</script>') + len('</script>')
            content = content[:start] + load_sidebar_script + content[end:]
            print(f"Replaced script section in {file}")
        
        # 确保内容不为空
        if content:
            # 写入修改后的内容
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
        else:
            print(f"Content is empty after processing, skipping write for {file}")
            # 恢复备份
            os.system(f"cp {backup_file} {file}")
            print(f"Restored backup for {file}")
            
    except Exception as e:
        print(f"Error processing {file}: {e}")
        # 恢复备份
        if os.path.exists(backup_file):
            os.system(f"cp {backup_file} {file}")
            print(f"Restored backup for {file}")
        continue

print("All files processed!")

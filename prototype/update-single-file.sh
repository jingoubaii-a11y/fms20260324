#!/bin/bash

# 单个文件更新脚本
if [ $# -ne 1 ]; then
    echo "Usage: $0 <filename.html>"
    exit 1
fi

file=$1

echo "Processing $file"

# 备份原始文件
cp "$file" "$file.bak"

# 读取文件内容
content=$(cat "$file")

# 替换样式部分，引入公共CSS文件
content=$(echo "$content" | sed '/<style>/,/<\/style>/c\    <link rel="stylesheet" href="common/styles.css">')

# 替换侧边栏部分，使用侧边栏容器
content=$(echo "$content" | sed '/<!-- 侧边栏 -->/,/<\/aside>/c\        <!-- 侧边栏 -->\n        <div id="sidebar-container"></div>')

# 替换脚本部分，使用加载侧边栏的脚本
content=$(echo "$content" | sed "/<script>/,/<\/script>/c\    <script>\n        // 加载侧边栏\n        async function loadSidebar() {\n            try {\n                const response = await fetch('common/sidebar.html');\n                const sidebarHtml = await response.text();\n                document.getElementById('sidebar-container').innerHTML = sidebarHtml;\n                setTimeout(() => {\n                    const script = document.createElement('script');\n                    script.src = 'common/scripts.js';\n                    script.onload = function() {\n                        if (typeof initCommonFunctions === 'function') {\n                            initCommonFunctions();\n                        }\n                    };\n                    document.body.appendChild(script);\n                }, 100);\n            } catch (error) {\n                console.error('加载侧边栏失败:', error);\n            }\n        }\n        if (document.readyState === 'loading') {\n            document.addEventListener('DOMContentLoaded', loadSidebar);\n        } else {\n            loadSidebar();\n        }\n    </script>")

# 写入修改后的内容
echo "$content" > "$file"

echo "Updated $file"
echo "Done!"

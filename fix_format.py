
# 读取文件
with open('/Users/ext.yangjing202/Documents/fms20260324/PRD/财务中台详细功能描述.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 处理所有包含 `、` 且在 `详情` 下的字段行
i = 0
while i < len(lines):
    line = lines[i]
    # 检查是否是详情的字段部分并且包含、
    if '`' in line and '、' in line and '详情' in ''.join(lines[max(0, i-10):i+1]):
        # 检查是否需要处理
        content = line.strip()
        # 检查是否以多个 - `xxx`、`yyy` 开头
        if '、' in content and '`' in content and '- ' in content:
            # 找到缩进级别
            indent = line.split('-')[0]
            
            # 提取内容部分
            if content.startswith('- '):
                content = content[2:]
            
            # 分割字段
            fields = []
            current = []
            in_backtick = False
            
            for char in content:
                if char == '`':
                    in_backtick = not in_backtick
                    current.append(char)
                elif char == '、' and not in_backtick:
                    # 分隔符
                    if current:
                        fields.append(''.join(current))
                    current = []
                else:
                    current.append(char)
            
            if current:
                fields.append(''.join(current))
            
            if len(fields) &gt; 1:
                # 需要替换
                print(f"Found line {i} to process: {len(fields)} fields")
                new_lines = []
                for field in fields:
                    new_line = indent + '- ' + field.strip() + '\n'
                    new_lines.append(new_line)
                
                # 替换
                lines = lines[:i] + new_lines + lines[i+1:]
                
                # 跳过已处理的行
                i += len(new_lines)
                continue
    
    i += 1

# 写回文件
with open('/Users/ext.yangjing202/Documents/fms20260324/PRD/财务中台详细功能描述.md', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done!")

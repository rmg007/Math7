import os
import re

root_dir = 'admin-panel/src'

for root, _, files in os.walk(root_dir):
    for filename in files:
        if filename.endswith('.test.tsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Use regex to find and replace
            new_content = re.sub(r'mockChain as any', 'mockChain', content)
            new_content = re.sub(r'supabase\.from\((.*?)\) as any', r'supabase.from(\1)', new_content)
            
            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed: {filepath}")

print("Done")

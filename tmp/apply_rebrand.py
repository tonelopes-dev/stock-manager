import os
import re

def map_replacement(match):
    prefix = match.group(1)
    color = match.group(2)
    
    # Handle simple white/black cases
    if color == 'white':
        if prefix == 'bg': return "bg-background"
        if prefix == 'text': return "text-background"
        return match.group(0) # Keep others like border-white if not sure, but usually border-border is better.
    if color == 'black':
        if prefix == 'bg': return "bg-foreground"
        if prefix == 'text': return "text-foreground"
        return match.group(0)

    try:
        weight = int(match.group(3))
    except:
        return match.group(0)
    
    # Brand Colors (Purple/Indigo/Blue/Violet) -> Primary
    if color in ['blue', 'indigo', 'purple', 'violet']:
        return f"{prefix}-primary"
    
    # Destructive (Red)
    if color == 'red':
        if weight >= 500:
            return f"{prefix}-destructive"
        return f"{prefix}-destructive/10"
    
    # Neutrals (Slate/Gray/Zinc/Neutral/Stone)
    if color in ['slate', 'gray', 'zinc', 'neutral', 'stone']:
        if weight <= 100:
            if prefix == 'bg': return "bg-muted"
            if prefix == 'border': return "border-border"
            return "text-muted-foreground" if prefix == 'text' else f"{prefix}-muted"
        if weight <= 300:
            if prefix == 'border': return "border-border"
            return "text-muted-foreground" if prefix == 'text' else f"{prefix}-muted"
        if weight <= 600:
            return "text-muted-foreground" if prefix == 'text' else f"{prefix}-muted"
        return "text-foreground" if prefix == 'text' else f"{prefix}-foreground"
    
    # Status / Brand Orange (Orange/Amber/Yellow)
    if color in ['orange', 'amber', 'yellow']:
        # Map to orange-500 as approved
        return f"{prefix}-orange-500"
    
    return match.group(0)

regex_complex = re.compile(r'(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose)-(\d+)')
regex_simple = re.compile(r'(bg|text|border|ring|fill|stroke)-(white|black)')

base_dir = r'c:\Projetos\stock-manager'
modified_files = 0
replacements_count = 0

for folder in ['app', 'components']:
    search_path = os.path.join(base_dir, folder)
    if not os.path.exists(search_path): continue
    
    for root, dirs, files in os.walk(search_path):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = regex_complex.sub(map_replacement, content)
                    new_content = regex_simple.sub(map_replacement, new_content)
                    
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        modified_files += 1
                        # Count matches for reporting (rough estimate)
                        replacements_count += len(re.findall(regex_complex, content)) + len(re.findall(regex_simple, content))
                except Exception as e:
                    print(f"Error processing {file}: {e}")

print(f"Sucessefully updated {modified_files} files.")
print(f"Estimated replacements: {replacements_count}")

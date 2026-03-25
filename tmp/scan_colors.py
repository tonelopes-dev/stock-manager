import os
import re

def map_color(prefix, color, weight=None):
    if color == 'white':
        if prefix == 'bg': return "bg-background"
        if prefix == 'text': return "text-background"
        return f"{prefix}-white"
    if color == 'black':
        if prefix == 'bg': return "bg-foreground"
        if prefix == 'text': return "text-foreground"
        return f"{prefix}-black"
        
    try:
        weight = int(weight)
    except:
        return f"{prefix}-{color}"
    
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
        # Kipo brand orange
        return f"{prefix}-orange-500"
    
    return f"{prefix}-{color}-{weight}"

results = []
base_dir = r'c:\Projetos\stock-manager'

regex_complex = r'(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose)-(\d+)'
regex_simple = r'(bg|text|border|ring|fill|stroke)-(white|black)'

for folder in ['app', 'components']:
    search_path = os.path.join(base_dir, folder)
    if not os.path.exists(search_path): continue
    
    for root, dirs, files in os.walk(search_path):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, base_dir)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = re.findall(regex_complex, content)
                        for m in set(matches):
                            original = f"{m[0]}-{m[1]}-{m[2]}"
                            suggested = map_color(m[0], m[1], m[2])
                            results.append((rel_path, original, suggested))
                        
                        matches_simple = re.findall(regex_simple, content)
                        for m in set(matches_simple):
                            original = f"{m[0]}-{m[1]}"
                            suggested = map_color(m[0], m[1])
                            results.append((rel_path, original, suggested))
                except:
                    pass

results.sort(key=lambda x: x[0])

output_file = r'c:\Projetos\stock-manager\kipo_rebrand_plan.md'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("# Plano de Rebranding Kipo: Migração de Cores Literais\n\n")
    f.write("Este documento lista todos os arquivos que contêm cores literais do Tailwind e sugere a substituição por classes semânticas do Shadcn baseadas na nova identidade visual (Roxo Elétrico e Laranja).\n\n")
    f.write("| Arquivo / Componente | Cor Literal | Sugestão Semântica |\n")
    f.write("| :--- | :--- | :--- |\n")
    
    seen = set()
    for res in results:
        if res not in seen:
            f.write(f"| `{res[0]}` | `{res[1]}` | `{res[2]}` |\n")
            seen.add(res)
            
print(f"Plan generated at {output_file}")

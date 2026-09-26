import os

def resolve_file_to_head(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    resolved_lines = []
    state = "normal"
    
    for line in lines:
        if line.startswith("<<<<<<<"):
            state = "head"
        elif line.startswith("======="):
            state = "theirs"
        elif line.startswith(">>>>>>>"):
            state = "normal"
        else:
            if state == "normal":
                resolved_lines.append(line)
            elif state == "head":
                resolved_lines.append(line)
            # ignore theirs
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)

resolve_file_to_head(".gitignore")
resolve_file_to_head("README.md")

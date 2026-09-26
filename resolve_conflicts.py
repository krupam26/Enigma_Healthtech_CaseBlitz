import os

def resolve_file(filepath, choice):
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
            elif state == "head" and choice == "head":
                resolved_lines.append(line)
            elif state == "theirs" and choice == "theirs":
                resolved_lines.append(line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)

resolve_file("backend/app/config.py", "head")
resolve_file("backend/app/routers/ai_bridge.py", "head")
resolve_file("backend/app/routers/caregiver.py", "theirs")
resolve_file("frontend/src/pages/Login.tsx", "head")

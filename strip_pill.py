import os

def strip_pill3d(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Remove import and usage
        new_lines = []
        for line in lines:
            if 'Pill3D' not in line:
                new_lines.append(line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Stripped Pill3D from {filepath}")
    except Exception as e:
        print(f"Failed to strip {filepath}: {e}")

strip_pill3d('frontend/src/pages/Landing.tsx')
strip_pill3d('frontend/src/pages/Login.tsx')
strip_pill3d('frontend/src/pages/Signup.tsx')

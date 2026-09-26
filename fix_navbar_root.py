import re
nav = 'src/components/Navbar.jsx'
with open(nav, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<button[^>]*class(?:Name)?="nav-login-btn"[^>]*>.*?</button>', '<a href="/login" className="nav-login-btn">Dashboard / Login</a>', content, flags=re.DOTALL)
with open(nav, 'w', encoding='utf-8') as f:
    f.write(content)

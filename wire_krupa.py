import os
import re

hero = 'frontend/src/landing_krupa/components/HeroSection.jsx'
with open(hero, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("import PillCanvas from './PillCanvas';", "")
content = content.replace("<PillCanvas />", "<!-- 3D Pill Canvas Disabled to prevent WebGL hang -->")
with open(hero, 'w', encoding='utf-8') as f:
    f.write(content)

nav = 'frontend/src/landing_krupa/components/Navbar.jsx'
with open(nav, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<button[^>]*class(?:Name)?="nav-login-btn"[^>]*>.*?</button>', '<a href="/login" className="nav-login-btn">Dashboard / Login</a>', content, flags=re.DOTALL)
with open(nav, 'w', encoding='utf-8') as f:
    f.write(content)

landing_tsx = '''import KrupaApp from '../landing_krupa/App.jsx'
import '../landing_krupa/index.css'
import '../landing_krupa/App.css'

export default function Landing() {
  return <KrupaApp />
}
'''
with open('frontend/src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(landing_tsx)

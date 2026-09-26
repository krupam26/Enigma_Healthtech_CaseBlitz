import re
with open('src/services/api.ts', 'r') as f:
    text = f.read()

text = text.replace("const BACKEND_URL = 'http://localhost:8000'\nconst ML_URL = 'http://localhost:8001'", """const BACKEND_URL = 'http://localhost:8000'
const ML_URL = 'http://localhost:8001'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {})
  };
};""")

text = re.sub(r'headers:\s*\{([^}]*)\}', lambda m: "headers: { " + m.group(1).strip() + (', ' if m.group(1).strip() else '') + "...getAuthHeaders() }", text)

text = re.sub(r'fetch\(`\$\{BACKEND_URL\}/api/medications/active`\)', 'fetch(`${BACKEND_URL}/api/medications/active`, { headers: getAuthHeaders() })', text)
text = re.sub(r'fetch\(`\$\{BACKEND_URL\}/api/medications/\$\{id\}`,\s*\{\s*method:\s*\'DELETE\',\s*\}\)', 'fetch(`${BACKEND_URL}/api/medications/${id}`, { method: \'DELETE\', headers: getAuthHeaders() })', text)
text = re.sub(r'fetch\(`\$\{BACKEND_URL\}/api/caregiver/patient-status`\)', 'fetch(`${BACKEND_URL}/api/caregiver/patient-status`, { headers: getAuthHeaders() })', text)
text = re.sub(r'fetch\(`\$\{BACKEND_URL\}/api/ai/parse-prescription`,\s*\{\s*method:\s*\'POST\',\s*body:\s*formData,\s*\}\)', 'fetch(`${BACKEND_URL}/api/ai/parse-prescription`, { method: \'POST\', body: formData, headers: getAuthHeaders() })', text)

def replace_catch_blocks(src):
    import re
    out = []
    i = 0
    while i < len(src):
        match = re.search(r'catch\s*\([^)]*\)\s*\{', src[i:])
        if not match:
            out.append(src[i:])
            break
        
        start = i + match.end() - 1 
        out.append(src[i:start])
        
        brace_count = 1
        j = start + 1
        while j < len(src) and brace_count > 0:
            if src[j] == '{': brace_count += 1
            elif src[j] == '}': brace_count -= 1
            j += 1
        
        out.append('{ throw err; }')
        i = j
    return ''.join(out)

text = replace_catch_blocks(text)

login_func = """async login(email: string, password: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      return data
    } catch (err) { throw err; }
  }"""
text = re.sub(r'async login\(email: string, password: string\).*?catch \(err\) \{ throw err; \}', login_func, text, flags=re.DOTALL)

signup_func = """async signup(fullName: string, email: string, password: string, role = 'PATIENT') {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      return data
    } catch (err) { throw err; }
  }"""
text = re.sub(r'async signup\(fullName: string, email: string, password: string, role = \'PATIENT\'\).*?catch \(err\) \{ throw err; \}', signup_func, text, flags=re.DOTALL)

text = text.replace("patientId: string = 'demo-patient-ramesh'", "patientId?: string")
text = text.replace("userId = 'demo-patient-ramesh'", "userId?: string")
text = text.replace("patient_id: patientId", "patient_id: userId || localStorage.getItem('user_id')")
text = text.replace("'x-user-id': userId", "'x-user-id': userId || localStorage.getItem('user_id') || ''")

with open('src/services/api.ts', 'w') as f:
    f.write(text)

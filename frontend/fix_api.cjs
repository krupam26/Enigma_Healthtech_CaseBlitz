const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

// 1. Add getAuthHeaders
const headerInjection = `const BACKEND_URL = 'http://localhost:8000'
const ML_URL = 'http://localhost:8001'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  return {
    ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    ...(userId ? { 'x-user-id': userId } : {})
  };
};
`;
code = code.replace(/const BACKEND_URL[\s\S]*?const ML_URL[^\n]*\n/, headerInjection);

// 2. Remove all catch block bodies and replace with throw err
code = code.replace(/catch\s*\((err(?:.*?)?)\)\s*\{[\s\S]*?\n\s*\}/g, 'catch ($1) { throw $1; }');

// 3. Inject getAuthHeaders into fetch options
code = code.replace(/headers:\s*\{/g, 'headers: { ...getAuthHeaders(), ');

// 4. Update fetch calls that don't have an options object
code = code.replace(/fetch\(\s*\`([^\`]+)\`\s*\)/g, 'fetch(`$1`, { headers: getAuthHeaders() })');

// 5. Update fetch calls that have options but no headers
code = code.replace(/fetch\(\s*\`([^\`]+)\`\s*,\s*\{\s*method:\s*'([^']+)'\s*\}\s*\)/g, 'fetch(`$1`, { method: \'$2\', headers: getAuthHeaders() })');
code = code.replace(/fetch\(\s*\`([^\`]+)\`\s*,\s*\{\s*method:\s*'([^']+)'\s*,\s*body:\s*([^\}]+)\s*\}\s*\)/g, 'fetch(`$1`, { method: \'$2\', body: $3, headers: getAuthHeaders() })');

// 6. Fix login and signup to store tokens
const loginFix = `
  async login(email: string, password: string) {
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/auth/login\`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      return data
    } catch (err: any) { throw err; }
  }`;
code = code.replace(/async login[\s\S]*?catch \(err: any\) \{ throw err; \}/, loginFix.trim());

const signupFix = `
  async signup(fullName: string, email: string, password: string, role = 'PATIENT') {
    try {
      const res = await fetch(\`\${BACKEND_URL}/api/auth/signup\`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      return data
    } catch (err: any) { throw err; }
  }`;
code = code.replace(/async signup[\s\S]*?catch \(err: any\) \{ throw err; \}/, signupFix.trim());

// 7. Remove demo user hardcoded defaults
code = code.replace(/patientId: string = 'demo-patient-ramesh'/g, 'patientId?: string');
code = code.replace(/userId = 'demo-patient-ramesh'/g, 'userId?: string');

code = code.replace(/'x-user-id':\s*userId\s*,?/g, '');
code = code.replace(/patient_id:\s*patientId/g, "patient_id: patientId || localStorage.getItem('user_id') || ''");

fs.writeFileSync('src/services/api.ts', code);
console.log('Done!');

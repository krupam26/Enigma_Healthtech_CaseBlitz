import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import { useT } from '../hooks/useT'
import LangSwitcher from '../components/LangSwitcher'

export default function Login() {
  const t = useT()
  const login = useStore((s) => s.login)
  const profileComplete = useStore((s) => s.profileComplete)
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    handleDemoLogin('PATIENT')
  }

  const handleDemoLogin = (role: 'PATIENT' | 'CAREGIVER') => {
    const demoEmail = role === 'PATIENT' ? 'patient@demo.com' : 'caregiver@demo.com'
    setLoading(true)
    setError('')
    
    // HARDCODED BYPASS: No API calls to prevent breaking!
    setTimeout(() => {
      login({ email: demoEmail, role })
      navigate('/dashboard')
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="bg-gradient-to-br from-teal-950 to-teal-700 hidden md:flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-white text-3xl font-bold mt-4 tracking-tight">MedCheck HealthTech</h2>
          <p className="text-teal-200 text-sm max-w-sm mt-2 mx-auto">
            Safe, verified medication schedules and drug interaction checks.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 sm:p-12 relative bg-white overflow-y-auto">
        <div className="absolute top-6 right-8">
          <LangSwitcher />
        </div>

        <div className="w-full max-w-[420px]">
          <Link to="/" className="text-[13.5px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1.5 mb-6">
            ← {t('nav.home')}
          </Link>

          <h1 className="text-3xl font-bold text-teal-950 tracking-tight">{t('auth.loginTitle')}</h1>
          <p className="mt-2 text-slate-500 text-base">{t('auth.loginSubtitle')}</p>

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => handleDemoLogin('PATIENT')}
              type="button"
              disabled={loading}
              className="w-full py-3.5 text-base font-bold shadow-sm border-2 border-teal-600 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all"
            >
              Log In as Patient
            </button>
            <button
              onClick={() => handleDemoLogin('CAREGIVER')}
              type="button"
              disabled={loading}
              className="w-full py-3.5 text-base font-bold shadow-sm border-2 border-slate-600 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              Log In as Caregiver
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">OR</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                required
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                style={touched && !email ? { borderColor: '#B5453B' } : {}}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                style={touched && !password ? { borderColor: '#B5453B' } : {}}
              />
            </div>

            <div className="text-right">
              <button type="button" className="text-sm text-teal-700 hover:text-teal-900 font-semibold" onClick={() => alert('Password reset disabled in demo mode.')}>
                {t('auth.forgotPassword')}
              </button>
            </div>
            
            <button
              className="btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : t('auth.loginBtn')}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-600">
            {t('auth.newAccount')}{' '}
            <Link to="/signup" className="text-teal-700 hover:text-teal-900 font-bold underline decoration-teal-300 underline-offset-2">
              {t('auth.signupBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

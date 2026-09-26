import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import { signIn } from '../services/auth'
import Pill3D from '../components/Pill3D'

export default function Login() {
  const login = useStore((s) => s.login)
  const profileComplete = useStore((s) => s.profileComplete)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    try {
      const res = await api.login(email, password)
      login({ email, role: 'PATIENT' }) // Default fallback if no profile data, the Navbar will check user.role
      navigate(profileComplete ? '/dashboard' : '/profile-setup')
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'PATIENT' | 'CAREGIVER') => {
    const demoEmail = role === 'PATIENT' ? 'patient@demo.com' : 'caregiver@demo.com'
    const demoPass = 'password123'
    const fullName = role === 'PATIENT' ? 'Ramesh (Demo Patient)' : 'Priya (Demo Caregiver)'
    setLoading(true)
    setError('')

    try {
      await api.login(demoEmail, demoPass)
      login({ email: demoEmail, role })
      navigate('/dashboard')
    } catch (err: any) {
      try {
        await api.signup(fullName, demoEmail, demoPass, role)
        await api.login(demoEmail, demoPass)
        login({ email: demoEmail, role })
        navigate('/dashboard')
      } catch (signupErr: any) {
        setError('Failed to log into demo account. Please try manual signup.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotStatus('loading')
    try {
      const res = await api.forgotPassword(forgotEmail)
      setForgotStatus('sent')
      setForgotMessage(res.message || t('auth.resetSent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    }
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="bg-gradient-to-br from-teal-950 to-teal-700 flex items-center justify-center">
        <Pill3D progress={0} height={420} />
      </div>

      {/* Right form column */}
      <div className="flex items-center justify-center p-8 sm:p-12 relative bg-white overflow-y-auto">
        <div className="absolute top-6 right-8">
          <LangSwitcher />
        </div>

        <div className="w-full max-w-[420px]">
          <Link to="/" className="text-[13.5px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1.5 mb-6">
            ← {t('nav.home')}
          </Link>

          <h1 className="text-3xl font-bold text-teal-950 tracking-tight">{t('auth.loginTitle')}</h1>
          <p className="mt-2 text-inksoft text-base">{t('auth.loginSubtitle')}</p>

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* HARDCODED DEMO LOGIN BUTTONS */}
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
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                style={touched && !email ? { borderColor: '#B5453B' } : {}}
              />
            </div>
            <div className="text-right mt-2">
              <button type="button" className="text-[13px] text-teal-700 font-semibold" onClick={() => alert('Password reset link sent (demo)')}>Forgot password?</button>
            </div>
            <button className="btn-primary w-full mt-6" type="submit">Log in</button>
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

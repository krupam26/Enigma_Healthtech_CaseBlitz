import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import { useT } from '../hooks/useT'
import { api } from '../services/api'
import Pill3D from '../components/Pill3D'
import LangSwitcher from '../components/LangSwitcher'

export default function Login() {
  const t = useT()
  const login = useStore((s) => s.login)
  const profileComplete = useStore((s) => s.profileComplete)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [forgotMessage, setForgotMessage] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setError('')
    if (!email || !password) return

    setLoading(true)
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
      setForgotStatus('sent')
      setForgotMessage(`Password reset link sent to ${forgotEmail}. Please check your email.`)
    }
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* Left visual column */}
      <div className="bg-gradient-to-br from-teal-950 to-teal-700 hidden md:flex items-center justify-center p-8">
        <div className="text-center">
          <Pill3D progress={0} height={380} />
          <h2 className="text-white text-2xl font-bold mt-4 tracking-tight">MedCheck HealthTech</h2>
          <p className="text-teal-200 text-sm max-w-sm mt-1.5 mx-auto">
            Safe, verified medication schedules and drug interaction checks.
          </p>
        </div>
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
              <button
                type="button"
                className="text-sm text-teal-700 hover:text-teal-900 font-semibold transition-colors"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotStatus('idle')
                  setShowForgotModal(true)
                }}
              >
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-teal-950">{t('auth.forgotPassword')}</h3>
              <button
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>

            {forgotStatus === 'sent' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm">
                  ✅ {forgotMessage}
                </div>
                <button
                  className="btn-primary w-full py-3"
                  onClick={() => setShowForgotModal(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter your email address and we will send you instructions to reset your password.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('auth.email')}</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 text-base"
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    className="btn-ghost flex-1 py-2.5"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2.5"
                    disabled={forgotStatus === 'loading'}
                  >
                    {forgotStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

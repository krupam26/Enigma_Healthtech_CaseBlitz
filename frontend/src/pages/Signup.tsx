import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import { useT } from '../hooks/useT'
import { api } from '../services/api'
import Pill3D from '../components/Pill3D'
import LangSwitcher from '../components/LangSwitcher'
import type { Lang } from '../types'

export default function Signup() {
  const t = useT()
  const signup = useStore((s) => s.signup)
  const currentLang = useStore((s) => s.lang)
  const setStoreLang = useStore((s) => s.setLang)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<'PATIENT' | 'CAREGIVER'>('PATIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.signup(name, email, password, role)
      signup(name, email, currentLang)
      navigate('/profile-setup')
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please check your details.')
    } finally {
      setLoading(false)
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
      <div className="flex items-center justify-center p-8 sm:p-12 relative bg-white">
        <div className="absolute top-6 right-8">
          <LangSwitcher />
        </div>

        <div className="w-full max-w-[420px]">
          <Link to="/" className="text-[13.5px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1.5 mb-6">
            ← {t('nav.home')}
          </Link>

          <h1 className="text-3xl font-bold text-teal-950 tracking-tight">{t('auth.signupTitle')}</h1>
          <p className="mt-2 text-inksoft text-base">{t('auth.signupSubtitle')}</p>

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.fullName')}</label>
              <input
                required
                type="text"
                placeholder="Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                required
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="CAREGIVER">Family Caregiver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Language</label>
                <select
                  value={currentLang}
                  onChange={(e) => setStoreLang(e.target.value as Lang)}
                  className="w-full px-3 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            <button
              className="btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : t('auth.signupBtn')}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-600">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-teal-700 hover:text-teal-900 font-bold underline decoration-teal-300 underline-offset-2">
              {t('auth.loginBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


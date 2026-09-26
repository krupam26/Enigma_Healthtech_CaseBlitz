import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import Pill3D from '../components/Pill3D'
import type { Lang } from '../types'

export default function Signup() {
  const signup = useStore((s) => s.signup)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [lang, setLang] = useState<Lang>('en')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    signup(name, email, lang)
    navigate('/profile-setup')
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="bg-gradient-to-br from-teal-950 to-teal-700 flex items-center justify-center">
        <Pill3D progress={0} height={420} />
      </div>
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="text-[13px] text-inksoft font-semibold">← Back to MedCheck</Link>
          <h1 className="mt-[18px] text-[30px] font-medium text-teal-950">Create your account</h1>
          <div className="mt-2 text-inksoft text-[14.5px]">Set up MedCheck in under a minute.</div>
          <form onSubmit={submit}>
            <div className="field mt-5"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Full name</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field mt-5"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="field mt-5"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="field mt-5"><label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Confirm password</label><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <div className="field mt-5">
              <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Preferred language</label>
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                <option value="en">English</option><option value="hi">हिंदी</option><option value="mr">मराठी</option>
              </select>
            </div>
            {error && <div className="text-[12.5px] text-risk mt-2">{error}</div>}
            <button className="btn-primary w-full mt-6" type="submit">Create account</button>
          </form>
          <div className="mt-[22px] text-center text-[14px] text-inksoft">
            Already have an account? <Link to="/login" className="text-teal-700 font-semibold">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

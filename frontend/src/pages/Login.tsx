import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import Pill3D from '../components/Pill3D'

export default function Login() {
  const login = useStore((s) => s.login)
  const profileComplete = useStore((s) => s.profileComplete)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    login(email)
    navigate(profileComplete ? '/dashboard' : '/profile-setup')
  }

  const quickLogin = () => {
    login()
    navigate(profileComplete ? '/dashboard' : '/profile-setup')
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="bg-gradient-to-br from-teal-950 to-teal-700 flex items-center justify-center">
        <Pill3D progress={0} height={420} />
      </div>
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="text-[13px] text-inksoft font-semibold">← Back to MedCheck</Link>
          <h1 className="mt-[18px] text-[30px] font-medium text-teal-950">Welcome back</h1>
          <div className="mt-2 text-inksoft text-[14.5px]">Log in to continue managing your medications.</div>
          <form onSubmit={submit}>
            <div className="field mt-5">
              <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                style={touched && !email ? { borderColor: '#B5453B' } : {}} />
            </div>
            <div className="field mt-5">
              <label className="block text-[13px] font-semibold text-inksoft mb-[7px]">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                style={touched && !password ? { borderColor: '#B5453B' } : {}} />
            </div>
            <div className="text-right mt-2">
              <button type="button" className="text-[13px] text-teal-700 font-semibold" onClick={() => alert('Password reset link sent (demo)')}>Forgot password?</button>
            </div>
            <button className="btn-primary w-full mt-6" type="submit">Log in</button>
          </form>
          <button className="w-full mt-3 border-[1.5px] border-line py-[13px] rounded-[11px] font-semibold text-[14.5px]" onClick={quickLogin}>
            Continue with Google (demo)
          </button>
          <div className="mt-[22px] text-center text-[14px] text-inksoft">
            New to MedCheck? <Link to="/signup" className="text-teal-700 font-semibold">Create account</Link>
          </div>
          <div className="mt-1 text-center text-[14px] text-inksoft">
            Demo account: <b>ramesh@medcheck.demo</b> / any password
          </div>
        </div>
      </div>
    </div>
  )
}

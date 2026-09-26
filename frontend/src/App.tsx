import { Routes, Route } from 'react-router-dom'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import { HowItWorks, Features, SafetyMarketing, CaregiverMarketing, About } from './pages/SimpleMarketing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import Medications from './pages/Medications'
import Schedule from './pages/Schedule'

import Adherence from './pages/Adherence'
import Safety from './pages/Safety'
import CaregiverDashboard from './pages/CaregiverDashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

export default function App() {
  return (
    <>
      <Routes>
        {/* Marketing / public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/safety" element={<SafetyMarketing />} />
        <Route path="/caregiver" element={<CaregiverMarketing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated app */}
        <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/adherence" element={<ProtectedRoute><Adherence /></ProtectedRoute>} />
        <Route path="/safety-dashboard" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
        <Route path="/caregiver-dashboard" element={<ProtectedRoute><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
      <Toast />
    </>
  )
}

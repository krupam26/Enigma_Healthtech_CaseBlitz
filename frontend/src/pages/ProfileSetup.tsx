import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'
import { useT } from '../hooks/useT'
import { api } from '../services/api'
import { speakText } from '../utils/speech'
import LangSwitcher from '../components/LangSwitcher'

const COMMON_CONDITIONS = [
  'Type 2 Diabetes',
  'Hypertension (High BP)',
  'Thyroid (Hypo/Hyper)',
  'Cardiovascular Disease',
  'Chronic Kidney Disease',
  'Asthma / Respiratory',
  'High Cholesterol',
  'Arthritis / Joint Pain',
]

const COMMON_ALLERGIES = [
  'Penicillin / Amoxicillin',
  'Sulfa Drugs (Sulfonamides)',
  'Aspirin / NSAIDs (Ibuprofen)',
  'Codeine / Opioids',
  'Peanuts / Dairy',
  'No Known Allergies',
]

export default function ProfileSetup() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const user = useStore((s) => s.user)
  const saveProfile = useStore((s) => s.saveProfile)
  const completeProfile = useStore((s) => s.completeProfile)
  const navigate = useNavigate()

  // Form State initialized from user store
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    age: user.age || '67',
    dob: user.dob || '',
    gender: user.gender || 'Male',
    wake: user.wake || '06:30',
    sleep: user.sleep || '22:00',
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '20:30',
    conditions: user.conditions ? user.conditions.split(',').map((c) => c.trim()) : ['Type 2 Diabetes', 'Hypertension (High BP)'],
    otherCondition: '',
    allergies: user.allergies ? user.allergies.split(',').map((a) => a.trim()) : ['Penicillin / Amoxicillin'],
    otherAllergy: '',
    currentMeds: 'Metformin 500mg, Amlodipine 5mg, Aspirin 75mg',
    emergencyName: 'Priya Sharma (Daughter)',
    emergencyPhone: '+91 98765 43210',
    doctor: user.doctor || 'Dr. A. Patel (Cardiology)',
    hospital: 'Apex Heart & Multispeciality Hospital',
  })

  const [saving, setSaving] = useState(false)

  // Voice narration helper for seniors
  const speakSection = (sectionKey: string) => {
    let script = ''
    if (lang === 'hi') {
      if (sectionKey === 'personal') script = 'Kripya apna poora naam, umar, aur aapaat-kaaleen parivaar sadasya ka number darj karein.'
      else if (sectionKey === 'health') script = 'Aapko jo purani bimaariyan hain, jaise sugar, high BP ya heart ki bimari, unhe chun lijiye.'
      else if (sectionKey === 'allergies') script = 'Kisi dawa se allergy ho to yahan batayein taaki safety system aapko galat dawa se bacha sake.'
      else if (sectionKey === 'meds') script = 'Aap abhi jo niyamit dawaiyan le rahe hain unka naam yahan likhein.'
      else if (sectionKey === 'routine') script = 'Apne subah uthne, nashte, dopahar aur raat ke khane ka samay chuniye.'
      else if (sectionKey === 'doctor') script = 'Apne mukhya doctor aur hospital ka naam yahan likhein.'
    } else if (lang === 'mr') {
      if (sectionKey === 'personal') script = 'Krupaya aaple purna naav, vay aani aapat-kaleen sampark number nondava.'
      else if (sectionKey === 'health') script = 'Aaplyala aslele aajar jase madhumeh, raktadaab nivaada.'
      else if (sectionKey === 'allergies') script = 'Kahi aushadhanchi allergy aasel tar yethe nivaada, aamchi system surakshit thevel.'
      else if (sectionKey === 'meds') script = 'Aaple sadhya chalu aslele aushadh yethe liha.'
      else if (sectionKey === 'routine') script = 'Sakaali uthnyaachi, jevnaachi aani zhopnyaachi vel tharva.'
      else if (sectionKey === 'doctor') script = 'Aaplya pramukh doctor che naav aani davaakhana nondava.'
    } else {
      if (sectionKey === 'personal') script = 'Please enter your full name, age, gender, and family emergency contact number.'
      else if (sectionKey === 'health') script = 'Select any ongoing health conditions like diabetes, hypertension, or heart concerns.'
      else if (sectionKey === 'allergies') script = 'Select any known drug or food allergies so our clinical safety engine can protect you.'
      else if (sectionKey === 'meds') script = 'List your current everyday prescription medicines or notes.'
      else if (sectionKey === 'routine') script = 'Set your daily wake, meal, and sleep times to align your medication reminders.'
      else if (sectionKey === 'doctor') script = 'Provide your primary doctor and hospital details for clinical coordination.'
    }
    speakText(script, lang)
  }

  const toggleCondition = (c: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter((item) => item !== c)
        : [...prev.conditions, c],
    }))
  }

  const toggleAllergy = (a: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(a)
        ? prev.allergies.filter((item) => item !== a)
        : [...prev.allergies, a],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const combinedConditions = [...form.conditions, ...(form.otherCondition ? [form.otherCondition] : [])].join(', ')
    const combinedAllergies = [...form.allergies, ...(form.otherAllergy ? [form.otherAllergy] : [])].join(', ')
    const emergencyCombined = `${form.emergencyName} - ${form.emergencyPhone}`

    const patch = {
      name: form.name,
      email: form.email,
      age: form.age,
      dob: form.dob,
      gender: form.gender,
      wake: form.wake,
      sleep: form.sleep,
      conditions: combinedConditions,
      allergies: combinedAllergies,
      emergency: emergencyCombined,
      doctor: form.doctor,
    }

    try {
      await api.updateProfile({
        full_name: form.name,
        age: form.age,
        gender: form.gender,
        wake_time: form.wake,
        sleep_time: form.sleep,
        emergency_contact: emergencyCombined,
        primary_doctor: `${form.doctor} (${form.hospital})`,
        chronic_conditions: form.conditions,
        known_allergies: form.allergies,
      })
    } catch (e) {
      console.warn('Backend updateProfile fallback:', e)
    }

    saveProfile(patch)
    completeProfile()
    setSaving(false)
    navigate('/dashboard')
  }

  const handleSkip = () => {
    completeProfile()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Bar */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full uppercase tracking-wider">
              Health Safety Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-950 mt-2 tracking-tight">
              {t('onboarding.title')}
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-1.5 max-w-xl">
              {t('onboarding.subtitle')}
            </p>
          </div>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <LangSwitcher />
          </div>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: Personal Details */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  1
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  {t('onboarding.personalSection')}
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('personal')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('onboarding.fullName')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('onboarding.age')}
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('onboarding.gender')}
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Emergency Contact Name & Relation
                </label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                  placeholder="e.g. Priya Sharma (Daughter)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: Chronic Health Issues */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  2
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  {t('onboarding.healthSection')}
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('health')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              Select existing conditions to alert our safety checks when adding new prescription or OTC medicines:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              {COMMON_CONDITIONS.map((cond) => {
                const selected = form.conditions.includes(cond)
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`p-3 rounded-xl text-left border text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? 'border-teal-700 bg-teal-50/80 text-teal-950 ring-2 ring-teal-600'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{cond}</span>
                    {selected && <span className="text-teal-700 font-bold ml-1">✓</span>}
                  </button>
                )
              })}
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Other health condition (optional)"
                value={form.otherCondition}
                onChange={(e) => setForm({ ...form, otherCondition: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </section>

          {/* SECTION 3: Allergies & Drug Sensitivities */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  3
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  {t('onboarding.allergySection')}
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('allergies')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              Severe adverse reactions can occur if antibiotics or pain relievers conflict with known allergies:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
              {COMMON_ALLERGIES.map((allergy) => {
                const selected = form.allergies.includes(allergy)
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`p-3 rounded-xl text-left border text-sm font-semibold transition-all flex items-center justify-between ${
                      selected
                        ? 'border-amber-700 bg-amber-50/80 text-amber-950 ring-2 ring-amber-600'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{allergy}</span>
                    {selected && <span className="text-amber-800 font-bold ml-1">✓</span>}
                  </button>
                )
              })}
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Other specific drug or food allergy (e.g. Sulfa, Ciprofloxacin)"
                value={form.otherAllergy}
                onChange={(e) => setForm({ ...form, otherAllergy: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </section>

          {/* SECTION 4: Current Medicine Info */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  4
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  Current Everyday Medicines
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('meds')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              List the primary medications you currently take. You can also upload prescription photos later:
            </p>

            <div className="mt-4">
              <textarea
                rows={2}
                value={form.currentMeds}
                onChange={(e) => setForm({ ...form, currentMeds: e.target.value })}
                placeholder="e.g. Metformin 500mg (twice daily), Amlodipine 5mg (morning)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </section>

          {/* SECTION 5: Daily Routine & Schedule */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  5
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  {t('onboarding.routineSection')}
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('routine')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">
              MedCheck calculates exact reminder alarms around your natural wake and meal times:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  🌅 {t('onboarding.wake')}
                </label>
                <input
                  type="time"
                  value={form.wake}
                  onChange={(e) => setForm({ ...form, wake: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  🍳 Breakfast
                </label>
                <input
                  type="time"
                  value={form.breakfast}
                  onChange={(e) => setForm({ ...form, breakfast: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  🍲 Lunch
                </label>
                <input
                  type="time"
                  value={form.lunch}
                  onChange={(e) => setForm({ ...form, lunch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  🌙 {t('onboarding.sleep')}
                </label>
                <input
                  type="time"
                  value={form.sleep}
                  onChange={(e) => setForm({ ...form, sleep: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECTION 6: Primary Doctor & Hospital */}
          <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
                  6
                </span>
                <h2 className="text-xl font-bold text-teal-950">
                  {t('onboarding.doctorSection')}
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-semibold text-sm transition-colors border border-teal-200/60"
                onClick={() => speakSection('doctor')}
                title="Hear audio guidance"
              >
                🔊 {t('onboarding.listenGuide')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('onboarding.doctor')}
                </label>
                <input
                  type="text"
                  value={form.doctor}
                  onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                  placeholder="e.g. Dr. A. Patel (Cardiology)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  placeholder="e.g. Apollo / Apex Multispeciality Hospital"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
            <button
              type="button"
              className="btn-primary flex-1 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : `✓ ${t('onboarding.save')}`}
            </button>
            <button
              type="button"
              className="btn-ghost py-4 px-8 text-base font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 bg-white"
              onClick={handleSkip}
            >
              {t('onboarding.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

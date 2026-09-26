import { useState, useEffect } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useStore } from '../services/store'
import { useToast } from '../components/Toast'
import { api, type CaregiverFeedResponse } from '../services/api'

export default function CaregiverDashboard() {
  const events = useStore((s) => s.events)
  const markDose = useStore((s) => s.markDose)
  const show = useToast((s) => s.show)

  const [feed, setFeed] = useState<CaregiverFeedResponse | null>(null)
  const [shareMedDetails, setShareMedDetails] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  const todays = events.filter((e) => e.date === 'today')
  const hasMissed = todays.some((e) => e.status === 'Missed')
  const allTaken = todays.length > 0 && todays.every((e) => e.status === 'Taken')

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const data = await api.getCaregiverStatus()
      setFeed(data)
      setShareMedDetails(data.share_med_details)
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleConsent = async () => {
    const nextVal = !shareMedDetails
    setShareMedDetails(nextVal)
    await api.updateCaregiverConsent(nextVal)
    show(nextVal ? 'Medication details shared with caregiver' : 'Medication details masked for patient privacy')
    fetchFeed()
  }

  const handleProxyMark = (eventId: string) => {
    markDose(eventId, 'Taken')
    show('Dose marked as administered on behalf of Ramesh ji')
  }

  return (
    <AppLayout title="Caregiver Portal (Priya Sharma)" meta="Simple binary adherence monitoring & privacy-safe alerts">
      {/* 1. Primary Binary Status for Today (The Green Tick / Red Cross) */}
      <div className={`p-6 rounded-2xl mb-5 border shadow-sm ${
        hasMissed
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : allTaken
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wider opacity-80">Today's Quick Check (आज की स्थिति)</div>
            <div className="text-[28px] font-extrabold mt-1 flex items-center gap-3">
              <span>{hasMissed ? '❌' : allTaken ? '✅' : '⏳'}</span>
              <span>
                {hasMissed
                  ? 'Missed Dose Detected Today'
                  : allTaken
                  ? 'All Medications Taken Today'
                  : 'Doses Pending Today'}
              </span>
            </div>
            <p className="text-[14px] mt-1 opacity-90">
              {hasMissed
                ? 'Ramesh ji has not confirmed his scheduled evening medication. Please check in with him.'
                : allTaken
                ? 'Great news! All scheduled morning and evening doses are complete.'
                : 'Morning doses complete. Evening dose scheduled at 8:30 PM.'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-[12px] font-bold opacity-75">Weekly Adherence</div>
            <div className="text-[32px] font-black">{feed?.overall_adherence_pct || 75}%</div>
          </div>
        </div>
      </div>

      {/* 2. Urgent Consecutive Miss Alert Banner */}
      {feed?.active_alerts && feed.active_alerts.length > 0 && (
        <div className="alert-box alert-risk mb-5 p-4 rounded-xl border border-rose-400 bg-rose-100/80">
          <div className="flex items-center gap-2 font-bold text-[15px] text-rose-950">
            <span>🚨</span>
            <span>URGENT CAREGIVER ESCALATION</span>
          </div>
          <p className="text-[14px] text-rose-900 mt-1 leading-relaxed">
            {feed.active_alerts[0].message}
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="tel:+919876543210"
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold text-[13px] px-3.5 py-1.5 rounded-lg shadow-sm"
            >
              📞 Call Dad Now
            </a>
          </div>
        </div>
      )}

      {/* 3. Patient Dignity & Privacy Consent Section */}
      <div className="panel mb-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-[16px] font-semibold text-teal-950">Patient Privacy &amp; Dignity Consent</h3>
            <p className="text-[13px] text-inksoft">
              Controls whether private brand names are displayed or kept confidential.
            </p>
          </div>
          <button
            onClick={handleToggleConsent}
            className={`px-3 py-1.5 rounded-xl font-bold text-[13px] border transition-colors ${
              shareMedDetails
                ? 'bg-teal-700 text-white border-teal-800'
                : 'bg-gray-100 text-inksoft border-line'
            }`}
          >
            {shareMedDetails ? 'Drug Names: VISIBLE' : 'Drug Names: HIDDEN (Privacy Protected)'}
          </button>
        </div>

        {!shareMedDetails ? (
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-[13.5px] text-inksoft">
            🔒 <b>Privacy Active:</b> Specific medication names (e.g. blood pressure, psychiatric, or chronic meds) are hidden to protect Ramesh ji's medical dignity. You will still receive all adherence stats and missed dose emergency alerts.
          </div>
        ) : (
          <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl text-[13.5px] text-teal-900">
            👁️ <b>Full Details Visible:</b> Ramesh has consented to share complete medication names with you:
            <ul className="list-disc list-inside mt-2 font-semibold space-y-0.5">
              <li>Amlodipine 5mg (Morning - Cardiology)</li>
              <li>Metformin 500mg (Morning &amp; Evening - Diabetes)</li>
              <li>Aspirin 75mg (Morning - Blood thinner)</li>
            </ul>
          </div>
        )}
      </div>

      {/* 4. Proxy Administration Actions for Caregiver */}
      <div className="panel">
        <h3 className="text-[16px] font-semibold text-teal-950 mb-3">Today's Dose Logs &amp; Proxy Administration</h3>
        <p className="text-[13px] text-inksoft mb-4">
          Administering medicines for Ramesh ji in person? You can confirm doses on his behalf as his proxy caregiver.
        </p>

        <div className="space-y-3">
          {todays.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-paper">
              <div>
                <span className="text-[13px] font-bold text-teal-800">{ev.time}</span>
                <span className="text-[14px] font-semibold text-teal-950 ml-3">
                  {shareMedDetails ? 'Prescribed Dose' : 'Scheduled Medication'}
                </span>
                <span className={`ml-3 text-[11px] font-bold px-2 py-0.5 rounded ${
                  ev.status === 'Taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {ev.status}
                </span>
              </div>

              {ev.status !== 'Taken' && (
                <button
                  className="mini-btn-primary text-[12px]"
                  onClick={() => handleProxyMark(ev.id)}
                >
                  Confirm Given (Proxy)
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

import type { ReactNode } from 'react'
import MarketingLayout from '../layouts/MarketingLayout'
import { Link } from 'react-router-dom'

export function SimplePage({ title, body }: { title: string; body: ReactNode }) {
  return (
    <MarketingLayout>
      <section className="py-[120px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>{title}</h2>
          <div className="mt-7 text-inksoft max-w-[600px] leading-relaxed">{body}</div>
        </div>
      </section>
    </MarketingLayout>
  )
}

export function HowItWorks() {
  return <SimplePage title="How MedCheck works" body={<p>From uploading a prescription to coordinating with a caregiver, MedCheck turns scattered medication information into a routine you can follow. See the full walkthrough on the <Link to="/" className="text-teal-700 font-semibold">home page</Link>.</p>} />
}
export function Features() {
  return <SimplePage title="Features" body={<p>Prescription intelligence, medication management, smart reminders, safety checks, adherence tracking, caregiver coordination and an AI assistant. Full detail on the <Link to="/" className="text-teal-700 font-semibold">home page</Link>.</p>} />
}
export function SafetyMarketing() {
  return <SimplePage title="Medication Safety" body={<p>MedCheck checks interactions, duplicates and allergy conflicts across everything you take — and says so plainly when it doesn't know. Log in to see your own safety dashboard.</p>} />
}
export function CaregiverMarketing() {
  return <SimplePage title="Caregiver Coordination" body={<p>Invite a caregiver and choose exactly what they can see — adherence, alerts, schedule or details. Nothing is shared without your consent.</p>} />
}
export function About() {
  return <SimplePage title="About MedCheck" body={<p>MedCheck is a medication management prototype, designed especially for people managing multiple prescriptions and the caregivers helping them.</p>} />
}

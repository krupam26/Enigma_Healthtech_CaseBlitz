import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../layouts/MarketingLayout'
import Pill3D from '../components/Pill3D'
import { useT } from '../hooks/useT'

const PROBLEMS = [
  ['Multiple medications', 'Different strengths, timings and instructions from different visits pile up without a single view.'],
  ['Several doctors', "Each prescriber sees one part of the picture — not what else is already being taken."],
  ['OTC additions', 'A painkiller or antacid picked up without checking it against existing prescriptions.'],
  ['Missed doses', "A skipped dose raises a real question — take it now, wait, or skip — that's easy to get wrong."],
  ['Timing confusion', '"After food," "twice daily," "as needed" — instructions that are simple to misread when tired.'],
  ['Caregiver blind spots', "Family helping out often can't see what was actually taken versus skipped."],
]

const STEPS: [string, string, string][] = [
  ['01', 'Upload', 'Add a prescription photo, PDF, or enter medicines by hand.'],
  ['02', 'Understand', 'MedCheck reads and structures dose, frequency and timing.'],
  ['03', 'Verify', 'Low-confidence fields are flagged for you to confirm — never guessed.'],
  ['04', 'Personalize', 'Reminders align to your wake, sleep and meal times.'],
  ['05', 'Stay safe', "Every new medicine is checked against what you're already taking."],
  ['06', 'Track', 'Doses are logged taken, missed or late — adherence builds automatically.'],
  ['07', 'Coordinate', 'Share exactly what you choose with a trusted caregiver.'],
]

const FEATURES = [
  ['Prescription Intelligence', 'Extracts medicine, strength, dose and timing from photos or PDFs — flagged for review, never assumed.'],
  ['Medication Management', 'Add, edit, pause or discontinue medications, with a full history of changes.'],
  ['Smart Reminders', 'Timing built around your own wake, sleep and meal schedule.'],
  ['Medication Safety', 'Checks interactions, duplicates and allergy conflicts across every prescriber.'],
  ['OTC Safety', 'Anything self-added gets checked against your active medications before you take it.'],
  ['Missed-Dose Guidance', 'Structured, cautious guidance — never a blanket "take it now."'],
  ['Adherence Tracking', 'Daily, weekly and per-medication adherence, with patterns surfaced plainly.'],
  ['Caregiver Coordination', 'Invite a caregiver and choose exactly what they can see.'],
  ['AI Assistant', 'Ask about your medicines and schedule in your own language.'],
]

export default function Landing() {
  const t = useT()
  const heroRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      const vh = window.innerHeight
      let p = 1 - Math.max(0, Math.min(1, rect.bottom / (rect.height + vh * 0.4)))
      setProgress(Math.max(0, Math.min(1, p)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <MarketingLayout>
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="wrap grid gap-10 items-center" style={{ gridTemplateColumns: '1fr 480px' }}>
          <div>
            <div className="text-[13px] font-semibold text-teal-600 mb-[18px]">{t('hero.eyebrow')}</div>
            <h1 className="font-display font-medium leading-[1.03] tracking-tight text-teal-950" style={{ fontSize: 'clamp(40px,4.6vw,68px)' }}>
              {t('hero.title')}
            </h1>
            <p className="mt-[22px] text-[19px] leading-[1.55] text-inksoft max-w-[440px]">{t('hero.description')}</p>
            <div className="mt-[34px] flex gap-3.5">
              <Link to="/signup" className="btn-primary">{t('hero.getStarted')}</Link>
              <a href="#how" className="btn-ghost">{t('hero.explore')}</a>
            </div>
          </div>
          <Pill3D progress={progress} height={520} />
        </div>
      </section>

      <section className="py-[90px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>
            Most medication routines aren't planned. They accumulate.
          </h2>
          <p className="mt-3.5 text-[17px] text-inksoft max-w-[560px] leading-relaxed">
            A prescription here, an over-the-counter painkiller there, a dose taken an hour late — none of it feels risky on its own.
          </p>
          <div className="grid grid-cols-3 gap-5 mt-12">
            {PROBLEMS.map(([title, body], i) => (
              <div key={title} className="p-6 rounded-[18px] border border-line bg-paper">
                <div className="text-[13px] font-semibold text-teal-600 mb-2.5">{String(i + 1).padStart(2, '0')}</div>
                <p className="text-[15px] text-inksoft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-[220px] flex items-center justify-center overflow-hidden">
        <Pill3D progress={0.08} height={220} />
      </div>

      <section id="how" className="py-[90px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>How MedCheck works</h2>
          <p className="mt-3.5 text-[17px] text-inksoft max-w-[560px] leading-relaxed">Seven steps that turn a prescription into a routine you can actually follow.</p>
          <div className="grid grid-cols-4 mt-14 border-t border-line">
            {STEPS.map(([num, title, body]) => (
              <div key={num} className="pt-7 px-5 border-r border-line last:border-r-0">
                <div className="font-display text-[34px] text-mint-300 font-medium">{num}</div>
                <h4 className="mt-2 text-[16px] font-semibold text-teal-950">{title}</h4>
                <p className="mt-1.5 text-[14px] text-inksoft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-[90px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>Everything a routine needs, nothing it doesn't</h2>
          <div className="grid grid-cols-3 gap-5 mt-12">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="p-6 rounded-2xl border border-line bg-paper hover:border-teal-500 transition-colors">
                <h4 className="text-[16px] font-semibold text-teal-950">{title}</h4>
                <p className="mt-2 text-[14px] text-inksoft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-[220px] flex items-center justify-center overflow-hidden">
        <Pill3D progress={0.08} height={220} />
      </div>

      <section id="safety" className="py-[90px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>
            A safety engine that says "I don't know" when it means it
          </h2>
          <p className="mt-3.5 text-[17px] text-inksoft max-w-[560px] leading-relaxed">
            Unknown is never treated as safe. Every check ends in one of four plain statuses, with a reason attached.
          </p>
          <div className="grid grid-cols-2 gap-5 mt-12">
            <div className="card"><span className="badge badge-taken mb-2.5 inline-block">No flag identified</span><p className="text-inksoft text-[14.5px]">Nothing in the current combination raises a concern based on the available information.</p></div>
            <div className="card"><span className="badge badge-late mb-2.5 inline-block">Review</span><p className="text-inksoft text-[14.5px]">Worth a second look — for example, two medicines from different doctors with overlapping purposes.</p></div>
            <div className="card"><span className="badge badge-missed mb-2.5 inline-block">Potential risk</span><p className="text-inksoft text-[14.5px]">A known interaction or duplicate active ingredient was found.</p></div>
            <div className="card"><span className="badge badge-upcoming mb-2.5 inline-block">Urgent attention</span><p className="text-inksoft text-[14.5px]">Contact a healthcare professional before continuing with this combination.</p></div>
          </div>
        </div>
      </section>

      <section id="caregiver" className="py-[90px]">
        <div className="wrap">
          <h2 className="font-display font-medium tracking-tight text-teal-950" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>Caregivers see what you choose, nothing more</h2>
          <p className="mt-3.5 text-[17px] text-inksoft max-w-[560px] leading-relaxed">
            Invite a caregiver, and switch on only the categories you're comfortable sharing — adherence, missed-dose alerts, schedule, medication details. Revoke access anytime.
          </p>
        </div>
      </section>

      <section id="about" className="py-[90px]">
        <div className="wrap">
          <div className="bg-teal-950 rounded-[28px] px-14 py-[72px] flex items-center justify-between gap-10 text-white">
            <div>
              <h2 className="font-display font-medium text-white" style={{ fontSize: 'clamp(28px,3vw,42px)' }}>Bring your medication routine into one place.</h2>
              <p className="mt-3 text-white/70 max-w-[420px]">Built for people managing more than one medicine — and the people helping them.</p>
            </div>
            <Link to="/signup" className="btn-primary bg-white text-teal-950 hover:bg-white">{t('hero.getStarted')}</Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}

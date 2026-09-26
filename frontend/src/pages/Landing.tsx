import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../layouts/MarketingLayout'
import Pill3D from '../components/Pill3D'
import { useT } from '../hooks/useT'

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

  const problems = [
    { title: t('landing.p1_title'), desc: t('landing.p1_desc') },
    { title: t('landing.p2_title'), desc: t('landing.p2_desc') },
    { title: t('landing.p3_title'), desc: t('landing.p3_desc') },
    { title: t('landing.p4_title'), desc: t('landing.p4_desc') },
    { title: t('landing.p5_title'), desc: t('landing.p5_desc') },
    { title: t('landing.p6_title'), desc: t('landing.p6_desc') },
  ]

  const steps = [
    { num: '01', title: t('landing.s1_title'), desc: t('landing.s1_desc') },
    { num: '02', title: t('landing.s2_title'), desc: t('landing.s2_desc') },
    { num: '03', title: t('landing.s3_title'), desc: t('landing.s3_desc') },
    { num: '04', title: t('landing.s4_title'), desc: t('landing.s4_desc') },
    { num: '05', title: t('landing.s5_title'), desc: t('landing.s5_desc') },
  ]

  return (
    <MarketingLayout>
      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-white to-slate-50 overflow-hidden py-12">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block text-sm font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-4 py-1.5 rounded-full mb-5">
              {t('hero.eyebrow')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-teal-950 leading-[1.12] tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="mt-5 text-xl text-slate-700 leading-relaxed max-w-xl">
              {t('hero.description')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-lg shadow-lg hover:scale-105 transition-all"
              >
                {t('hero.getStarted')}
              </Link>
              <a
                href="#problems"
                className="px-7 py-4 rounded-2xl border-2 border-slate-300 hover:border-teal-700 font-bold text-lg text-slate-800 bg-white hover:bg-teal-50 transition-all"
              >
                {t('hero.explore')}
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <Pill3D progress={progress} height={460} />
          </div>
        </div>
      </section>

      {/* PROBLEMS SECTION */}
      <section id="problems" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-teal-950 tracking-tight">
              {t('landing.problemsTitle')}
            </h2>
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">
              {t('landing.problemsSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {problems.map((p, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-slate-50/50 hover:border-teal-400 hover:bg-white transition-all shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-900 font-black text-base flex items-center justify-center mb-4">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-bold text-teal-950 mb-2">{p.title}</h3>
                <p className="text-base text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / STEPS */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-teal-950 tracking-tight">
              {t('landing.stepsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-7 rounded-3xl bg-white border-2 border-teal-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-sm font-black text-teal-700 uppercase tracking-widest block mb-2">
                    Step {s.num}
                  </span>
                  <h3 className="text-2xl font-extrabold text-teal-950 mb-2">{s.title}</h3>
                  <p className="text-base text-slate-700 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 bg-teal-950 text-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mt-4 text-xl text-teal-200 max-w-2xl mx-auto">
            {t('landing.ctaSub')}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/signup"
              className="px-9 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-lg shadow-xl hover:scale-105 transition-all"
            >
              {t('landing.ctaButton')}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}

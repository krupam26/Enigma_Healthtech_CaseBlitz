import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      {children}
      <footer className="py-12 pb-20 text-inksoft text-[13.5px]">
        <div className="wrap">MedCheck — a medication management prototype. Not a substitute for professional medical advice.</div>
      </footer>
    </div>
  )
}

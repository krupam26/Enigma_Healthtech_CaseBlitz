import { create } from 'zustand'

interface ToastStore {
  message: string
  visible: boolean
  show: (msg: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  message: '',
  visible: false,
  show: (msg) => {
    set({ message: msg, visible: true })
    setTimeout(() => set({ visible: false }), 2200)
  },
}))

export default function Toast() {
  const { message, visible } = useToast()
  return (
    <div
      className={`fixed bottom-7 left-1/2 -translate-x-1/2 bg-teal-950 text-white px-[22px] py-[13px] rounded-xl text-[14px] font-medium z-[200] transition-all ${
        visible ? 'opacity-100 -translate-y-1.5' : 'opacity-0 pointer-events-none'
      }`}
      style={{ transform: `translateX(-50%) ${visible ? 'translateY(-6px)' : ''}` }}
    >
      {message}
    </div>
  )
}

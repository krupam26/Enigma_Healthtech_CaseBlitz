export default function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      <div className="knob" />
    </div>
  )
}

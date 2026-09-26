import React, { useEffect, useState } from 'react';

export default function MedicalCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop devices with fine pointer
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const onMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      const clickable = target.closest('button, a, input, select, textarea, .pill-btn, .clickable, [role="button"]');
      setIsPointer(!!clickable);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={`medical-cursor ${isPointer ? 'medical-cursor--hot' : ''}`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="cursor-reticle">
        <circle cx="16" cy="16" r="3" className="cursor-center-dot" />
        <path d="M16 2 L16 8 M16 24 L16 30 M2 16 L8 16 M24 16 L30 16" className="cursor-crosshairs" />
        <circle cx="16" cy="16" r="10" className="cursor-outer-ring" />
      </svg>
    </div>
  );
}

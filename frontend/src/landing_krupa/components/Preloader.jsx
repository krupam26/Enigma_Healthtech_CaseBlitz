import React, { useEffect, useState } from 'react';
import { Pill, Shield, Activity } from 'lucide-react';

export default function Preloader({ onComplete }) {
  const [lifted, setLifted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLifted(true);
    }, 1800);

    const timer2 = setTimeout(() => {
      setHidden(true);
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (hidden) return null;

  return (
    <div className={`preloader-overlay ${lifted ? 'preloader-lifted' : ''}`}>
      <div className="preloader-content">
        <div className="preloader-badge">
          <Shield size={12} className="text-emerald" />
          <span>CLINICAL PROTOCOL v2.4</span>
        </div>

        <h1 className="preloader-title">
          MEDI<span>CHECK</span>
        </h1>

        <div className="preloader-subtitle">
          <span>PRESCRIPTION</span>
          <span className="dot-sep">•</span>
          <span>PROTECTION</span>
          <span className="dot-sep">•</span>
          <span>COORDINATION</span>
        </div>

        <div className="preloader-progress-track">
          <div className="preloader-progress-fill" />
        </div>

        <div className="preloader-meta">
          <span>STANDALONE DETERMINISTIC SAFETY ENGINE</span>
          <span className="pulse-code">WHO PATIENT SAFETY COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}

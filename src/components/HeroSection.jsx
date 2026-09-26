import React from 'react';
import { ChevronRight, Shield, Cpu, Activity, Sparkles } from 'lucide-react';
import PillCanvas from './PillCanvas';

export default function HeroSection({ onOpenUpload, onScrollToSection }) {
  return (
    <section className="hero-showcase" id="overview">
      {/* Background glow and subtle medical grid */}
      <div className="hero-bg-glow" />
      <div className="hero-grid-lines" />

      <div className="site-container hero-grid-container">
        {/* Left Column: Mission & Actions */}
        <div className="hero-content-col">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            AI MEDICATION SAFETY + ADHERENCE PLATFORM
          </div>

          <h1 className="hero-headline">
            UNDERSTAND.<br />
            TAKE.<br />
            <span className="gradient-text">STAY SAFE.</span>
          </h1>

          <p className="hero-subtext">
            Existing reminder apps merely beep at 8 PM. <strong>MediCheck</strong> transforms complex prescriptions into verified schedules, executes deterministic safety checks against duplicate brands, and connects trusted caregivers only when needed.
          </p>

          <div className="hero-actions">
            <button 
              type="button" 
              className="hero-primary-btn"
              onClick={onOpenUpload}
            >
              <span>Upload Prescription</span>
              <ChevronRight size={16} />
            </button>
            <button 
              type="button" 
              className="hero-secondary-btn"
              onClick={() => onScrollToSection('regimen')}
            >
              <span>Explore Regimen</span>
            </button>
          </div>

          {/* Clinical Differentiator Badges */}
          <div className="hero-feature-pills">
            <div className="hero-pill-badge">
              <Shield size={14} className="text-emerald" />
              <div>
                <strong>Deterministic Safety</strong>
                <small>Zero dose hallucinations</small>
              </div>
            </div>
            <div className="hero-pill-badge">
              <Cpu size={14} className="text-cyan" />
              <div>
                <strong>98.6% OCR Precision</strong>
                <small>Confidence scored ingestion</small>
              </div>
            </div>
            <div className="hero-pill-badge">
              <Activity size={14} className="text-gold" />
              <div>
                <strong>360° Safety Radar</strong>
                <small>Cross-brand duplicate guard</small>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Capsule Lab */}
        <div className="hero-visual-col">
          <div className="hero-canvas-frame">
            <div className="canvas-header-tag">
              <Sparkles size={13} className="text-emerald" />
              <span>INTERACTIVE 3D FORMULATION LAB</span>
            </div>
            <div className="hero-canvas-wrapper">
              <PillCanvas scrollProgress={0.4} isInteractive={true} />
            </div>
            <div className="canvas-caption">
              Drag to rotate 360° · Use toolbar to inspect inner formulation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

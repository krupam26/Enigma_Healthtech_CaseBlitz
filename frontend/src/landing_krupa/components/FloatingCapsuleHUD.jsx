import React, { useState } from 'react';
import { Pill, ChevronUp, ChevronDown, Sparkles, Maximize2 } from 'lucide-react';
import PillCanvas from './PillCanvas';

export default function FloatingCapsuleHUD({ currentSection = 'overview', onJumpToLab }) {
  const [minimized, setMinimized] = useState(false);
  const [opened, setOpened] = useState(false);

  const sectionLabels = {
    overview: '3D Formulation Lab',
    dissection: 'Capsule Anatomy (Open)',
    regimen: 'Regimen Timings Active',
    prescriptions: 'OCR Optical Scanning',
    explainer: 'Plain Language Audio',
    radar: 'Safety Radar Monitoring',
    timeline: 'Adherence Diagnostics',
    caregiver: 'Trusted Circle Shield'
  };

  const sectionColors = {
    overview: 'emerald',
    dissection: 'emerald',
    regimen: 'cyan',
    prescriptions: 'cyan',
    explainer: 'emerald',
    radar: 'amber',
    timeline: 'emerald',
    caregiver: 'emerald'
  };

  return (
    <div className={`floating-capsule-hud ${minimized ? 'hud-minimized' : ''}`}>
      <div className="hud-header" onClick={() => setMinimized(!minimized)}>
        <div className="hud-title-group">
          <Pill size={14} className="hud-icon" />
          <span className="hud-label">
            {sectionLabels[currentSection] || 'Active Clinical Telemetry'}
          </span>
        </div>
        <button type="button" className="hud-toggle-btn" aria-label="Toggle HUD">
          {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!minimized && (
        <div className="hud-body">
          <div className="hud-canvas-wrap">
            <PillCanvas 
              openRatio={opened || currentSection === 'dissection' ? 0.9 : 0.1}
              autoRotate={true}
              isInteractive={true}
              showControls={false}
              activeColor={sectionColors[currentSection] || 'emerald'}
            />
          </div>

          <div className="hud-controls">
            <button
              type="button"
              className="hud-action-btn"
              onClick={() => setOpened(!opened)}
            >
              {opened ? 'Seal' : 'Split 3D'}
            </button>
            <button
              type="button"
              className="hud-action-btn"
              onClick={onJumpToLab}
            >
              <Maximize2 size={12} />
              <span>Full Lab</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

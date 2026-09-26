import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, ExternalLink, Activity } from 'lucide-react';
import { playChime, playWarningTone } from '../utils/soundEngine';

const RADAR_ITEMS = [
  {
    id: 'dup-1',
    category: 'DUPLICATE THERAPY',
    status: 'CLEARED',
    severity: 'safe',
    title: 'Active Ingredient Overlap Check',
    subtitle: 'Metformin HCl + Amlodipine + Atorvastatin',
    detail: 'Zero overlapping active pharmaceutical ingredients. No duplicate antidiabetic or statin agents found in patient cabinet.',
    source: 'National Library of Medicine (NLM RxNorm)',
    blipPos: { top: '32%', left: '42%' }
  },
  {
    id: 'int-1',
    category: 'DRUG-DRUG INTERACTIONS',
    status: 'VERIFIED COMPATIBLE',
    severity: 'safe',
    title: 'Metformin + Amlodipine Co-administration',
    subtitle: 'Class: Biguanide + DHP Calcium Channel Blocker',
    detail: 'No cytochrome P450 competitive inhibition. Compatible pharmacokinetics verified for simultaneous morning/evening co-administration.',
    source: 'FDA Orange Book / Micromedex Evidence Layer',
    blipPos: { top: '25%', left: '72%' }
  },
  {
    id: 'all-1',
    category: 'ALLERGY & HYPERSENSITIVITY',
    status: 'NO CROSS-REACTIVITY',
    severity: 'safe',
    title: 'Penicillin / Beta-Lactam Allergy Guard',
    subtitle: 'Patient Flag: Mild penicillin urticaria',
    detail: 'None of the active medications or excipients share cross-reactive beta-lactam rings. Patient safety clearance granted.',
    source: 'WHO Model List of Essential Medicines (2026)',
    blipPos: { top: '68%', left: '30%' }
  },
  {
    id: 'adh-1',
    category: 'BEHAVIORAL ADHERENCE',
    status: 'ATTENTION: EVENING DOSES',
    severity: 'attention',
    title: 'Chronotherapy Adherence Pattern',
    subtitle: '2 Late evening doses flagged in past 14 days',
    detail: 'Adherence drop detected at 8:30 PM compared to 94% morning consistency. System suggests evaluating dinner routine synchronization.',
    source: 'MediCheck Adaptive Behavioral Engine',
    blipPos: { top: '62%', left: '68%' }
  }
];

export default function SafetyRadar() {
  const [selectedBlip, setSelectedBlip] = useState(RADAR_ITEMS[0]);

  const handleSelectBlip = (item) => {
    setSelectedBlip(item);
    if (item.severity === 'attention') {
      playWarningTone();
    } else {
      playChime(620, 'sine', 0.1);
    }
  };

  return (
    <section className="section-padding radar-section" id="radar">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            360° DETERMINISTIC CLINICAL SHIELD
          </div>
          <h2 className="section-title">
            MEDICATION <span className="gradient-text">SAFETY RADAR</span>
          </h2>
          <p className="section-description">
            Never an unsupervised AI guess. Every safety signal is backed by deterministic pharmacopeia rules, evidence citations, and explainable logic.
          </p>
        </div>

        {/* Radar Workbench Grid */}
        <div className="radar-grid-layout">
          {/* Left: The Circular Sonar Radar Canvas */}
          <div className="radar-display-card">
            <div className="radar-toolbar">
              <span className="dot online"></span>
              <span className="radar-title">CONTINUOUS RECONCILIATION SWEEP</span>
              <span className="radar-badge">4 MONITORED NODES</span>
            </div>

            <div className="radar-screen">
              {/* Concentric Sonar Circles */}
              <div className="radar-circle circle-1"></div>
              <div className="radar-circle circle-2"></div>
              <div className="radar-circle circle-3"></div>
              
              {/* Radar Crosshairs */}
              <div className="radar-crosshair crosshair-h"></div>
              <div className="radar-crosshair crosshair-v"></div>

              {/* Rotating Sweep Beam */}
              <div className="radar-sweep-beam"></div>

              {/* Pulsing Interactive Blips */}
              {RADAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`radar-blip blip-${item.severity} ${selectedBlip.id === item.id ? 'active' : ''}`}
                  style={{ top: item.blipPos.top, left: item.blipPos.left }}
                  onClick={() => handleSelectBlip(item)}
                  title={item.title}
                >
                  <span className="blip-ring"></span>
                  <span className="blip-center"></span>
                  <span className="blip-label-tag">{item.category}</span>
                </button>
              ))}
            </div>

            <div className="radar-footer-status">
              <Shield size={14} className="text-emerald" />
              <span>OVERALL SYSTEM INTEGRITY: <strong>PASSED (0 HIGH-RISK CONFLICTS)</strong></span>
            </div>
          </div>

          {/* Right: Explainable Signal Detail Card */}
          <div className="radar-detail-panel">
            <div className="panel-subhead">EXPLAINABLE CLINICAL EVIDENCE</div>

            <div className="active-signal-card">
              <div className="signal-top">
                <div className="signal-cat-badge">
                  {selectedBlip.category}
                </div>
                <div className={`signal-status-tag tag-${selectedBlip.severity}`}>
                  {selectedBlip.severity === 'safe' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                  <span>{selectedBlip.status}</span>
                </div>
              </div>

              <h3 className="signal-title">{selectedBlip.title}</h3>
              <div className="signal-subtitle">{selectedBlip.subtitle}</div>

              <div className="signal-detail-box">
                <span className="detail-tag">CLINICAL EXPLANATION</span>
                <p>{selectedBlip.detail}</p>
              </div>

              <div className="signal-source-box">
                <span className="source-label">DATABASE EVIDENCE & PROTOCOL</span>
                <div className="source-name">
                  <ExternalLink size={12} className="inline-icon" />
                  <span>{selectedBlip.source}</span>
                </div>
              </div>

              <div className="signal-guardrail-notice">
                <Info size={13} className="text-gold" />
                <span>
                  <strong>Clinical Boundary:</strong> MediCheck flags potential interactions for human clinician verification. AI does not autonomously alter medical therapy.
                </span>
              </div>
            </div>

            {/* Quick Filter Pill List */}
            <div className="signals-quick-list">
              {RADAR_ITEMS.map((item) => (
                <div 
                  key={item.id}
                  className={`signal-row-item ${selectedBlip.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleSelectBlip(item)}
                >
                  <span className={`signal-dot ${item.severity}`}></span>
                  <span className="item-title">{item.title}</span>
                  <span className="item-cat">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

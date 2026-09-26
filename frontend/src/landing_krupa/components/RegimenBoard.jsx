import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, Filter, Sparkles } from 'lucide-react';
import { playDoseTaken, playChime } from '../utils/soundEngine';
import confetti from 'canvas-confetti';

const INITIAL_DOSES = [
  {
    id: 'd1',
    time: '08:30 AM',
    medicine: 'METFORMIN HCL',
    strength: '500 MG',
    dose: '1 TABLET',
    timing: 'AFTER BREAKFAST',
    purpose: 'Blood Sugar Regulation',
    status: 'TAKEN',
    takenAt: '08:34 AM',
    badgeClass: 'status-taken'
  },
  {
    id: 'd2',
    time: '01:00 PM',
    medicine: 'AMLODIPINE BESYLATE',
    strength: '5 MG',
    dose: '1 TABLET',
    timing: 'AFTER LUNCH',
    purpose: 'Blood Pressure Control',
    status: 'NEXT UP',
    takenAt: null,
    badgeClass: 'status-next'
  },
  {
    id: 'd3',
    time: '08:30 PM',
    medicine: 'ATORVASTATIN CALCIUM',
    strength: '10 MG',
    dose: '1 TABLET',
    timing: 'AT BEDTIME',
    purpose: 'Lipid & Heart Protection',
    status: 'SCHEDULED',
    takenAt: null,
    badgeClass: 'status-pending'
  },
  {
    id: 'd4',
    time: '08:30 PM',
    medicine: 'METFORMIN HCL',
    strength: '500 MG',
    dose: '1 TABLET',
    timing: 'AFTER DINNER',
    purpose: 'Blood Sugar Regulation',
    status: 'SCHEDULED',
    takenAt: null,
    badgeClass: 'status-pending'
  }
];

export default function RegimenBoard({ onSelectMedicine }) {
  const [doses, setDoses] = useState(INITIAL_DOSES);
  const [filter, setFilter] = useState('ALL');

  const handleTakeDose = (id, e) => {
    e.stopPropagation();
    playDoseTaken();

    // Trigger confetti at click point
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10e598', '#00f0ff', '#f59e0b', '#ffffff']
      });
    } catch {
      // fallback
    }

    setDoses(prev =>
      prev.map(d => {
        if (d.id === id) {
          return {
            ...d,
            status: 'TAKEN',
            takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            badgeClass: 'status-taken'
          };
        }
        return d;
      })
    );
  };

  const filteredDoses = doses.filter(d => {
    if (filter === 'TAKEN') return d.status === 'TAKEN';
    if (filter === 'PENDING') return d.status !== 'TAKEN';
    return true;
  });

  return (
    <section className="section-padding regimen-section" id="regimen">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            CHRONO-SYNCHRONIZED SCHEDULE
          </div>
          <h2 className="section-title">
            TODAY’S CLINICAL <span className="gradient-text">REGIMEN BOARD</span>
          </h2>
          <p className="section-description">
            Mechanical precision meets adaptive clinical scheduling. Transformed directly from Dr. Sharma's handwritten prescription into meal-synchronized adherence checkpoints.
          </p>
        </div>

        {/* Filter Bar & Regimen Stats */}
        <div className="board-toolbar">
          <div className="patient-pill">
            <span className="dot online"></span>
            <strong>PATIENT:</strong> Krupa Sharma · 64y · Prescribed: City General Hospital
          </div>

          <div className="filter-buttons">
            <button 
              type="button" 
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => { setFilter('ALL'); playChime(440, 'sine', 0.1); }}
            >
              All Checkpoints ({doses.length})
            </button>
            <button 
              type="button" 
              className={`filter-btn ${filter === 'TAKEN' ? 'active' : ''}`}
              onClick={() => { setFilter('TAKEN'); playChime(540, 'sine', 0.1); }}
            >
              Completed ({doses.filter(d => d.status === 'TAKEN').length})
            </button>
            <button 
              type="button" 
              className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
              onClick={() => { setFilter('PENDING'); playChime(380, 'sine', 0.1); }}
            >
              Remaining ({doses.filter(d => d.status !== 'TAKEN').length})
            </button>
          </div>
        </div>

        {/* Split-Flap Board Container */}
        <div className="regimen-board-wrapper">
          <div className="board-header-row">
            <span className="col-time">TIME</span>
            <span className="col-med">MEDICATION & STRENGTH</span>
            <span className="col-dose">DOSE</span>
            <span className="col-timing">INSTRUCTION</span>
            <span className="col-purpose">CLINICAL PURPOSE</span>
            <span className="col-action">TELEMETRY STATUS</span>
          </div>

          <div className="board-body">
            {filteredDoses.map((dose) => (
              <div 
                key={dose.id} 
                className="board-row clickable"
                onClick={() => onSelectMedicine && onSelectMedicine(dose.medicine)}
              >
                <div className="col-time mono-font">
                  <Clock size={13} className="inline-icon" />
                  <strong>{dose.time}</strong>
                </div>

                <div className="col-med">
                  <span className="med-name">{dose.medicine}</span>
                  <span className="med-strength mono-font">{dose.strength}</span>
                </div>

                <div className="col-dose mono-font">
                  {dose.dose}
                </div>

                <div className="col-timing">
                  <span className="timing-badge">{dose.timing}</span>
                </div>

                <div className="col-purpose">
                  <span className="purpose-text">{dose.purpose}</span>
                </div>

                <div className="col-action">
                  {dose.status === 'TAKEN' ? (
                    <div className="status-indicator taken">
                      <CheckCircle2 size={14} />
                      <span>TAKEN {dose.takenAt || '08:34'}</span>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="take-now-btn"
                      onClick={(e) => handleTakeDose(dose.id, e)}
                    >
                      <Sparkles size={12} />
                      <span>Take Dose</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Board Footer Summary */}
          <div className="board-footer-stats">
            <div className="footer-stat-item">
              <span className="stat-label">TODAY'S ADHERENCE</span>
              <strong className="stat-val emerald-glow">
                {Math.round((doses.filter(d => d.status === 'TAKEN').length / doses.length) * 100)}%
              </strong>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">NEXT DOSAGE WINDOW</span>
              <strong className="stat-val cyan-glow">01:00 PM (LUNCH)</strong>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">SAFETY RECONCILIATION</span>
              <strong className="stat-val gold-glow">PASSED (0 CONFLICTS)</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

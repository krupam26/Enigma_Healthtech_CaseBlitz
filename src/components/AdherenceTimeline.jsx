import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, AlertCircle, Sparkles, TrendingUp, BrainCircuit, ArrowRight } from 'lucide-react';
import { playDoseTaken, playChime } from '../utils/soundEngine';
import confetti from 'canvas-confetti';

const HEATMAP_DATA = [
  { day: 'Mon', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { day: 'Tue', morning: 'taken', afternoon: 'taken', night: 'missed' },
  { day: 'Wed', morning: 'taken', afternoon: 'late', night: 'taken' },
  { day: 'Thu', morning: 'taken', afternoon: 'taken', night: 'taken' },
  { day: 'Fri', morning: 'taken', afternoon: 'taken', night: 'missed' },
  { day: 'Sat', morning: 'taken', afternoon: 'late', night: 'missed' },
  { day: 'Sun', morning: 'taken', afternoon: 'taken', night: 'taken' }
];

export default function AdherenceTimeline() {
  const [currentDoseTaken, setCurrentDoseTaken] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [adaptationAccepted, setAdaptationAccepted] = useState(false);

  const handleTakeCurrent = () => {
    setCurrentDoseTaken(true);
    playDoseTaken();
    try {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#10e598', '#38bdf8', '#fbbf24']
      });
    } catch {
      // fallback
    }
  };

  const handleSelectReason = (reason) => {
    setSelectedReason(reason);
    playChime(480, 'sine', 0.1);
  };

  return (
    <section className="section-padding timeline-section" id="timeline">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            BEHAVIORAL ADHERENCE & HEATMAP
          </div>
          <h2 className="section-title">
            SMART TIMELINE & <span className="gradient-text">ROOT-CAUSE AI</span>
          </h2>
          <p className="section-description">
            Traditional apps only tell you when you missed. MediCheck investigates WHY doses were skipped, identifies lifestyle patterns, and gently realigns your routine.
          </p>
        </div>

        {/* Current Urgent Action Card: "What do I need to do right now?" */}
        <div className="now-action-banner">
          <div className="banner-left">
            <div className="now-badge">
              <span className="dot pulse"></span>
              IMMEDIATE MEDICATION WINDOW
            </div>
            <h3>Good Afternoon, Krupa 👋</h3>
            <p className="banner-desc">
              Your next scheduled dosage is <strong>Amlodipine 5 mg (1 Tablet)</strong> post-lunch.
            </p>
          </div>

          <div className="banner-right">
            {currentDoseTaken ? (
              <div className="dose-success-pill">
                <CheckCircle2 size={18} className="text-emerald" />
                <div>
                  <strong>Recorded as Taken</strong>
                  <small>Logged at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                className="banner-take-btn"
                onClick={handleTakeCurrent}
              >
                <Sparkles size={16} />
                <span>Mark Dose as Taken</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Adherence Heatmap + Root Cause Learning */}
        <div className="adherence-dashboard-grid">
          {/* Heatmap Card */}
          <div className="adherence-card heatmap-card">
            <div className="card-top">
              <Calendar size={16} className="text-emerald" />
              <h4>7-Day Adherence Matrix</h4>
            </div>

            <p className="card-subtext">
              Overall Weekly Adherence: <strong className="text-emerald">87%</strong> (Morning: 94%, Afternoon: 82%, Night: 71%)
            </p>

            <div className="heatmap-table">
              <div className="heatmap-header-row">
                <span className="slot-col">TIME</span>
                {HEATMAP_DATA.map((d, i) => (
                  <span key={i} className="day-col">{d.day}</span>
                ))}
              </div>

              {/* Morning Row */}
              <div className="heatmap-data-row">
                <span className="slot-col">Morning</span>
                {HEATMAP_DATA.map((d, i) => (
                  <div key={i} className="cell-col">
                    <span className={`heat-dot dot-${d.morning}`} title={`${d.day} Morning: ${d.morning}`} />
                  </div>
                ))}
              </div>

              {/* Afternoon Row */}
              <div className="heatmap-data-row">
                <span className="slot-col">Afternoon</span>
                {HEATMAP_DATA.map((d, i) => (
                  <div key={i} className="cell-col">
                    <span className={`heat-dot dot-${d.afternoon}`} title={`${d.day} Afternoon: ${d.afternoon}`} />
                  </div>
                ))}
              </div>

              {/* Night Row */}
              <div className="heatmap-data-row">
                <span className="slot-col">Night</span>
                {HEATMAP_DATA.map((d, i) => (
                  <div key={i} className="cell-col">
                    <span className={`heat-dot dot-${d.night}`} title={`${d.day} Night: ${d.night}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="heatmap-legend">
              <div className="legend-item">
                <span className="heat-dot dot-taken"></span>
                <span>Taken On Time</span>
              </div>
              <div className="legend-item">
                <span className="heat-dot dot-late"></span>
                <span>Taken Late</span>
              </div>
              <div className="legend-item">
                <span className="heat-dot dot-missed"></span>
                <span>Missed / Skipped</span>
              </div>
            </div>
          </div>

          {/* Root-Cause Learning Card */}
          <div className="adherence-card root-cause-card">
            <div className="card-top">
              <BrainCircuit size={16} className="text-cyan" />
              <h4>AI Root-Cause Diagnostics</h4>
            </div>

            <div className="diagnostic-bubble">
              <div className="bubble-header">
                <span className="pattern-badge">RECURRING PATTERN DETECTED</span>
              </div>
              <p>
                “Most missed doses occur between <strong>8:00 PM – 10:00 PM</strong> on weekdays when returning home late. AI flagged 3 evening disruptions this week.”
              </p>
            </div>

            {/* Why did you miss it survey options */}
            <div className="reason-survey-box">
              <span className="survey-label">WHY WERE RECENT DOSES MISSED?</span>
              <div className="survey-chips">
                {[
                  { id: 'college', label: '🧳 Late transit / Routine shift' },
                  { id: 'forgot', label: '😴 Plain forgot' },
                  { id: 'meals', label: '🍽️ Hadn’t eaten dinner yet' },
                  { id: 'supply', label: '💊 Ran out of tablets' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`reason-chip ${selectedReason === r.id ? 'active' : ''}`}
                    onClick={() => handleSelectReason(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adaptive Intervention suggestion */}
            <div className="adaptation-callout">
              <div className="callout-lead">
                <strong>Recommended Behavioral Adaptation:</strong>
              </div>
              <p>
                Would you like MediCheck to link your evening reminder to your <strong>7:30 PM dinner routine</strong> instead of arbitrary clock time?
              </p>

              {adaptationAccepted ? (
                <div className="accepted-notice">
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>Routine synchronization updated to 7:30 PM dinner window.</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="accept-adaptation-btn"
                  onClick={() => { setAdaptationAccepted(true); playChime(640, 'triangle', 0.2); }}
                >
                  <span>Sync to Dinner Routine</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

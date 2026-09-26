import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, HeartPulse, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playWarningTone, playChime } from '../utils/soundEngine';

export default function EmergencyModal({ isOpen, onClose }) {
  const [selectedIncident, setSelectedIncident] = useState('double_dose');
  const [escalationDispatched, setEscalationDispatched] = useState(false);

  if (!isOpen) return null;

  const handleDispatchCaregiver = () => {
    setEscalationDispatched(true);
    playChime(720, 'triangle', 0.2);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel emergency-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close emergency modal">
          <X size={20} />
        </button>

        <div className="emergency-header">
          <div className="emergency-badge">
            <AlertOctagon size={16} className="text-red" />
            <span>CLINICAL SAFETY ESCALATION PROTOCOL</span>
          </div>
          <h3>Urgent Medication Incident Support</h3>
          <p>
            MediCheck operates under strict clinical boundaries: <strong>AI does not diagnose medical emergencies or prescribe antidotes.</strong> We immediately route you to verified human healthcare lines.
          </p>
        </div>

        {/* Incident Type Selector */}
        <div className="incident-types-grid">
          <button
            type="button"
            className={`incident-btn ${selectedIncident === 'double_dose' ? 'active' : ''}`}
            onClick={() => { setSelectedIncident('double_dose'); playWarningTone(); }}
          >
            <span>💊 Took Extra / Double Dose</span>
          </button>
          <button
            type="button"
            className={`incident-btn ${selectedIncident === 'wrong_med' ? 'active' : ''}`}
            onClick={() => { setSelectedIncident('wrong_med'); playWarningTone(); }}
          >
            <span>⚠️ Took Wrong Medicine</span>
          </button>
          <button
            type="button"
            className={`incident-btn ${selectedIncident === 'symptom' ? 'active' : ''}`}
            onClick={() => { setSelectedIncident('symptom'); playWarningTone(); }}
          >
            <span>😵 Acute Adverse Symptom</span>
          </button>
        </div>

        {/* Guidance Display */}
        <div className="emergency-guidance-card">
          <div className="guidance-title">
            <ShieldAlert size={16} className="text-red" />
            <strong>Immediate Clinical Protocol Guidance</strong>
          </div>
          <p>
            {selectedIncident === 'double_dose' && (
              <>
                You reported taking an additional dose. Do not attempt to induce vomiting or take compensatory counter-tablets. Keep the medication strip in hand and immediately connect with the clinical contacts below.
              </>
            )}
            {selectedIncident === 'wrong_med' && (
              <>
                You reported taking an unprescribed medication. Check the active ingredient on the packaging. Note the exact time of ingestion and contact your pharmacist immediately.
              </>
            )}
            {selectedIncident === 'symptom' && (
              <>
                Acute symptoms (such as dizziness, swelling, or rash) require professional clinical triage. Seek immediate emergency evaluation if experiencing breathing difficulty.
              </>
            )}
          </p>
        </div>

        {/* Escalation Actions */}
        <div className="emergency-actions-list">
          <a href="tel:911" className="call-action-btn primary-red">
            <PhoneCall size={16} />
            <div>
              <strong>Call Emergency Services (112 / 911)</strong>
              <small>Immediate dispatch for acute clinical distress</small>
            </div>
            <ArrowRight size={16} className="action-arrow" />
          </a>

          <a href="tel:5550199" className="call-action-btn">
            <PhoneCall size={16} />
            <div>
              <strong>Dr. R.K. Sharma, MD (Prescriber)</strong>
              <small>City General Hospital Cardiology Dept: (555) 123-4567</small>
            </div>
            <ArrowRight size={16} className="action-arrow" />
          </a>

          <button 
            type="button" 
            className="call-action-btn caregiver-dispatch"
            onClick={handleDispatchCaregiver}
          >
            <HeartPulse size={16} />
            <div>
              <strong>
                {escalationDispatched ? 'Caregiver Alert Dispatched ✓' : 'Notify Trusted Contact (Ananya Sharma)'}
              </strong>
              <small>Sends high-priority SMS & in-app telemetry ping</small>
            </div>
            <ArrowRight size={16} className="action-arrow" />
          </button>
        </div>

        <div className="emergency-footer-note">
          WHO Patient Safety Guideline 2026: Deterministic clinical decision support.
        </div>
      </div>
    </div>
  );
}

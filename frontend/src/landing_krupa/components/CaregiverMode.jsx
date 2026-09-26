import React, { useState } from 'react';
import { Users, Shield, HeartHandshake, Bell, Lock, CheckSquare, Square, Check, MessageSquare, PhoneCall, AlertTriangle } from 'lucide-react';
import { playChime, playWarningTone } from '../utils/soundEngine';

export default function CaregiverMode({ onOpenEmergency }) {
  const [permissions, setPermissions] = useState({
    adherence: true,
    alerts: true,
    medNames: false,
    clinicalHistory: false
  });

  const [caregiverAcknowledged, setCaregiverAcknowledged] = useState(false);

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    playChime(520, 'sine', 0.1);
  };

  const handleAcknowledge = () => {
    setCaregiverAcknowledged(true);
    playChime(680, 'triangle', 0.2);
  };

  return (
    <section className="section-padding caregiver-section" id="caregiver">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            CONSENT-GATED FAMILY COORDINATION
          </div>
          <h2 className="section-title">
            TRUSTED CIRCLE & <span className="gradient-text">PRIVACY ESCALATION</span>
          </h2>
          <p className="section-description">
            Care coordination without 24/7 surveillance. Patients own their medical autonomy, while caregivers receive actionable safety alerts only when repeated patterns require support.
          </p>
        </div>

        {/* Patient Console Grid */}
        <div className="patient-console-grid">
            {/* Consent Controls */}
            <div className="console-card permissions-card">
              <div className="card-top">
                <Lock size={16} className="text-emerald" />
                <h4>Granular Caregiver Consent Controls</h4>
              </div>

              <p className="card-subtext">
                Primary Contact: <strong>Dr. Ananya Sharma (Daughter)</strong> · Relationship: Family Caregiver
              </p>

              <div className="permissions-checklist">
                <div 
                  className="permission-item clickable"
                  onClick={() => togglePermission('adherence')}
                >
                  {permissions.adherence ? (
                    <CheckSquare size={16} className="text-emerald" />
                  ) : (
                    <Square size={16} className="text-dim" />
                  )}
                  <div className="permission-text">
                    <strong>Share Daily Adherence Percentage</strong>
                    <span>Allows viewing completed vs pending doses (e.g. 90% today).</span>
                  </div>
                </div>

                <div 
                  className="permission-item clickable"
                  onClick={() => togglePermission('alerts')}
                >
                  {permissions.alerts ? (
                    <CheckSquare size={16} className="text-emerald" />
                  ) : (
                    <Square size={16} className="text-dim" />
                  )}
                  <div className="permission-text">
                    <strong>Escalate on 2+ Consecutive Missed Doses</strong>
                    <span>Sends urgent push notice only when repeated pattern emerges.</span>
                  </div>
                </div>

                <div 
                  className="permission-item clickable"
                  onClick={() => togglePermission('medNames')}
                >
                  {permissions.medNames ? (
                    <CheckSquare size={16} className="text-emerald" />
                  ) : (
                    <Square size={16} className="text-dim" />
                  )}
                  <div className="permission-text">
                    <strong>Disclose Exact Chemical Drug Names</strong>
                    <span>Currently kept confidential to preserve medical privacy.</span>
                  </div>
                </div>

                <div 
                  className="permission-item clickable"
                  onClick={() => togglePermission('clinicalHistory')}
                >
                  {permissions.clinicalHistory ? (
                    <CheckSquare size={16} className="text-emerald" />
                  ) : (
                    <Square size={16} className="text-dim" />
                  )}
                  <div className="permission-text">
                    <strong>Share Full EHR / Hospital Records</strong>
                    <span>Completely locked under FHIR patient-owned cryptographic consent.</span>
                  </div>
                </div>
              </div>

              <div className="privacy-badge">
                <Shield size={13} className="text-emerald" />
                <span>Zero unsolicited surveillance. Escalation occurs strictly by defined patient consent.</span>
              </div>
            </div>

            {/* Escalation Ladder */}
            <div className="console-card ladder-card">
              <div className="card-top">
                <HeartHandshake size={16} className="text-cyan" />
                <h4>4-Tier Escalation Ladder</h4>
              </div>

              <div className="ladder-steps">
                <div className="ladder-step step-1">
                  <div className="step-num">1</div>
                  <div className="step-body">
                    <strong>Normal Regimen</strong>
                    <p>Doses taken on schedule. Caregiver receives zero notification noise.</p>
                  </div>
                </div>

                <div className="ladder-step step-2">
                  <div className="step-num">2</div>
                  <div className="step-body">
                    <strong>Single Missed Dose</strong>
                    <p>Gentle in-app nudge to patient. Remains 100% private to patient.</p>
                  </div>
                </div>

                <div className="ladder-step step-3">
                  <div className="step-num">3</div>
                  <div className="step-body">
                    <strong>Recurring Adherence Drift</strong>
                    <p>AI investigates lifestyle friction & root cause (e.g. late dinner).</p>
                  </div>
                </div>

                <div className="ladder-step step-4 active">
                  <div className="step-num">4</div>
                  <div className="step-body">
                    <strong>Caregiver Escalation Dispatch</strong>
                    <p>After 3 missed doses, alert dispatched to Ananya with single-tap check-in.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Caregiver Coordination Brief Card */}
          <div className="caregiver-dashboard-view" style={{ marginTop: '2.5rem' }}>
            <div className="caregiver-brief-card">
              <div className="brief-header">
                <div className="brief-person">
                  <div className="avatar-circle">KS</div>
                  <div>
                    <h4>Krupa’s Daily Adherence Brief</h4>
                    <span>Last updated today at 08:34 AM</span>
                  </div>
                </div>

                <div className="adherence-gauge-pill">
                  <span className="dot online"></span>
                  <strong>90% ON-TRACK TODAY</strong>
                </div>
              </div>

              <div className="brief-timeline-grid">
                <div className="timeline-checkpoint taken">
                  <span className="check-time">08:30 AM</span>
                  <span className="check-status">✓ Morning Dose Taken</span>
                  <span className="check-detail">Logged by Krupa at 8:34 AM</span>
                </div>

                <div className="timeline-checkpoint pending">
                  <span className="check-time">01:00 PM</span>
                  <span className="check-status">⏱ Afternoon Window Open</span>
                  <span className="check-detail">Due after lunch</span>
                </div>

                <div className="timeline-checkpoint missed-flag">
                  <span className="check-time">YESTERDAY</span>
                  <span className="check-status">⚠️ Evening Dose Delayed</span>
                  <span className="check-detail">Patient confirmed routine travel</span>
                </div>
              </div>

              {/* Action loop */}
              <div className="caregiver-actions-bar">
                {caregiverAcknowledged ? (
                  <div className="ack-confirmation">
                    <Check size={16} className="text-emerald" />
                    <span>You acknowledged Krupa’s status. Closed-loop confirmed.</span>
                  </div>
                ) : (
                  <div className="action-buttons-row">
                    <button 
                      type="button" 
                      className="caregiver-ack-btn"
                      onClick={handleAcknowledge}
                    >
                      <Check size={14} />
                      <span>I’ve Checked On Her</span>
                    </button>

                    <button 
                      type="button" 
                      className="caregiver-msg-btn"
                      onClick={() => playChime(540, 'sine', 0.1)}
                    >
                      <MessageSquare size={14} />
                      <span>Send Gentle Reminder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </section>
  );
}

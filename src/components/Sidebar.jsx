import React from 'react';
import { 
  Pill, 
  Calendar, 
  ScanLine, 
  BrainCircuit, 
  ShieldCheck, 
  Activity, 
  Users, 
  AlertTriangle, 
  UploadCloud, 
  Volume2, 
  VolumeX,
  ChevronRight,
  Shield,
  HeartPulse
} from 'lucide-react';
import { toggleAmbientSound, playChime, isSoundEnabled } from '../utils/soundEngine';

export default function Sidebar({ 
  activeSection, 
  activeMode, 
  onToggleMode, 
  onOpenUpload, 
  onOpenEmergency,
  onNavigate
}) {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const next = toggleAmbientSound();
    setSoundOn(next);
    if (next) playChime(600, 'triangle', 0.15);
  };

  const navItems = [
    { id: 'overview', label: '3D Capsule Lab', icon: Pill, badge: 'Interactive' },
    { id: 'regimen', label: 'Regimen Board', icon: Calendar, badge: 'Live' },
    { id: 'prescriptions', label: 'OCR Scanner', icon: ScanLine, badge: 'AI Vision' },
    { id: 'explainer', label: 'Plain Language', icon: BrainCircuit, badge: 'Voice' },
    { id: 'radar', label: 'Safety Radar', icon: ShieldCheck, badge: '360°' },
    { id: 'timeline', label: 'Smart Timeline', icon: Activity, badge: '87%' },
    { id: 'caregiver', label: 'Trusted Circle', icon: Users, badge: 'Consent' }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-box">
          <Pill size={22} className="brand-icon" />
        </div>
        <div className="brand-meta">
          <span className="brand-name">MEDI<strong>CHECK</strong></span>
          <span className="brand-sub">AI CLINICAL INTELLIGENCE</span>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="sidebar-patient-card">
        <div className="patient-avatar">
          <HeartPulse size={16} />
        </div>
        <div className="patient-info">
          <strong className="patient-name">Krupa Sharma</strong>
          <span className="patient-status">
            <span className="live-dot"></span> 3 Prescriptions Active
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        <span className="nav-group-label">CLINICAL MODULES</span>
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={17} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mode Perspective Switcher */}
      <div className="sidebar-mode-switch">
        <span className="switch-label">CONSOLE PERSPECTIVE</span>
        <div className="mode-toggle-pills">
          <button
            type="button"
            className={`mode-toggle-btn ${activeMode === 'patient' ? 'active' : ''}`}
            onClick={() => { onToggleMode('patient'); playChime(500, 'sine', 0.1); }}
          >
            Patient
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${activeMode === 'caregiver' ? 'active' : ''}`}
            onClick={() => { onToggleMode('caregiver'); playChime(600, 'sine', 0.1); }}
          >
            Caregiver
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="sidebar-actions">
        <button
          type="button"
          className="sidebar-upload-btn"
          onClick={onOpenUpload}
        >
          <UploadCloud size={16} />
          <span>Upload Prescription</span>
        </button>

        <button
          type="button"
          className="sidebar-sos-btn"
          onClick={onOpenEmergency}
        >
          <AlertTriangle size={15} />
          <span>SOS Incident Protocol</span>
        </button>
      </div>

      {/* Bottom Footer with Soundscape Toggle */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className={`sidebar-sound-btn ${soundOn ? 'sound-active' : ''}`}
          onClick={handleSoundToggle}
          title="Toggle clinical ambient audio synthesizer"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{soundOn ? 'Soundscape On' : 'Soundscape Off'}</span>
          <div className="mini-eq">
            <span className="b1"></span>
            <span className="b2"></span>
            <span className="b3"></span>
          </div>
        </button>

        <div className="sidebar-fhir-badge">
          <Shield size={11} className="text-emerald" />
          <span>HL7 FHIR R4 Ready</span>
        </div>
      </div>
    </aside>
  );
}

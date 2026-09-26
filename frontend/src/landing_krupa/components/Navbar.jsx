import React, { useState, useEffect } from 'react';
import { Pill, Shield, Users, AlertTriangle, UploadCloud, Menu, X } from 'lucide-react';
import LiveStatusBadge from './LiveStatusBadge';

export default function Navbar({ onOpenUpload, onOpenEmergency }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`nav-header ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav-container">
        {/* Brand */}
        <a href="#overview" className="nav-brand">
          <div className="brand-icon-box">
            <Pill size={20} className="brand-pill-icon" />
          </div>
          <div className="brand-text">
            <span>MEDI<strong>CHECK</strong></span>
            <small>AI ADHERENCE INTELLIGENCE</small>
          </div>
        </a>

        {/* Desktop Links */}
        <nav className="nav-links">
          <a href="#regimen">Regimen Board</a>
          <a href="#radar">Safety Radar</a>
          <a href="#caregiver">Trusted Circle</a>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          {/* Dashboard / Login button */}
          <a href="/login" className="nav-cta-btn" style={{ background: 'transparent', border: '1px solid var(--emerald)', color: 'var(--emerald)' }}>
            Dashboard / Login
          </a>

          {/* SOS Emergency button */}
          <button 
            type="button" 
            className="nav-emergency-btn"
            onClick={onOpenEmergency}
            title="Medication Error & Emergency Escalation Protocol"
          >
            <AlertTriangle size={13} />
            <span>SOS</span>
          </button>

        {/* Mobile menu hamburger */}
          <button 
            type="button" 
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <a href="#regimen" onClick={() => setMobileMenuOpen(false)}>Regimen Board</a>
          <a href="#radar" onClick={() => setMobileMenuOpen(false)}>Safety Radar</a>
          <a href="#caregiver" onClick={() => setMobileMenuOpen(false)}>Trusted Circle</a>
          <div className="mobile-drawer-footer">
            <button type="button" className="btn-block" onClick={() => { setMobileMenuOpen(false); onOpenUpload(); }}>
              <UploadCloud size={14} /> Upload Prescription
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

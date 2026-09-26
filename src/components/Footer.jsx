import React from 'react';
import { Pill, CheckCircle2 } from 'lucide-react';

export default function Footer({ onOpenUpload }) {
  return (
    <footer className="site-footer">
      <div className="site-container">
        {/* Footer Main Grid */}
        <div className="footer-main-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <Pill size={22} className="text-emerald" />
              <span>MEDI<strong>CHECK</strong></span>
            </div>
            <p className="footer-tagline">
              Understand your medication. Stay on track. Stay connected.
            </p>
            <div className="standard-badges">
              <span className="badge-item">
                <CheckCircle2 size={12} className="text-emerald" /> HL7 FHIR Ready
              </span>
              <span className="badge-item">
                <CheckCircle2 size={12} className="text-cyan" /> WHO Patient Safety 2026
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-col">
            <h5>NAVIGATION</h5>
            <ul className="footer-links">
              <li><a href="#overview">Formulation Lab</a></li>
              <li><a href="#regimen">Regimen Board</a></li>
              <li><a href="#radar">Safety Radar</a></li>
              <li><a href="#caregiver">Trusted Circle</a></li>
            </ul>
          </div>

          {/* Clinical Differentiator */}
          <div className="footer-col">
            <h5>PATIENT SAFETY</h5>
            <ul className="footer-links">
              <li><a href="#radar">Deterministic Drug Safety</a></li>
              <li><a href="#radar">Active Ingredient Guard</a></li>
              <li><a href="#caregiver">Consent-Gated Caregiver Circle</a></li>
              <li><a href="#regimen">Meal-Synchronized Adherence</a></li>
            </ul>
          </div>

          {/* Quick Action */}
          <div className="footer-col pitch-col">
            <h5>PRESCRIPTION INGESTION</h5>
            <div className="pitch-quote-box">
              <p>
                Have a prescription paper or bottle? Ingest it now for instant verification.
              </p>
              <button 
                type="button" 
                className="footer-upload-btn"
                onClick={onOpenUpload}
              >
                Upload Prescription
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Disclaimer */}
        <div className="footer-bottom-bar">
          <div className="disclaimer-text">
            <strong>Clinical Notice:</strong> MediCheck provides medication organization, patient health literacy education, and deterministic safety support. It does not replace a licensed physician, registered pharmacist, or emergency medical dispatch.
          </div>
          <div className="copyright-text">
            © 2026 MediCheck Intelligence Systems. Built for Next-Generation Patient Safety.
          </div>
        </div>
      </div>
    </footer>
  );
}

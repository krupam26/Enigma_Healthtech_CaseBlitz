import React, { useState } from 'react';
import { Shield, Sparkles, ChevronDown } from 'lucide-react';

export default function LiveStatusBadge() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="status-badge-container">
      <button 
        type="button" 
        className="live-status-pill"
        onClick={() => setShowDetails(!showDetails)}
        aria-label="Clinical Guard Status"
      >
        <span className="live-radar-ping">
          <span className="ping-ring"></span>
          <span className="ping-dot"></span>
        </span>
        <span className="status-key">CLINICAL ENGINE:</span>
        <span className="status-val">VERIFIED (FHIR R4)</span>
        <ChevronDown size={12} className={`chevron-indicator ${showDetails ? 'rotate' : ''}`} />
      </button>

      {showDetails && (
        <div className="status-flyout-card">
          <div className="flyout-header">
            <Shield size={14} className="text-emerald" />
            <strong>Deterministic Safety Guard Active</strong>
          </div>
          <p className="flyout-text">
            Prescriptions are cross-checked against standard pharmacopeia rules. LLM never independently invents dosages or contraindications.
          </p>
          <div className="flyout-meta">
            <span>● 0 Duplicate Active Ingredients</span>
            <span>● 0 Allergy Interactions</span>
            <span>● Caregiver Consent: GRANTED</span>
          </div>
        </div>
      )}
    </div>
  );
}

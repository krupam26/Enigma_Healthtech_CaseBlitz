import React, { useState } from 'react';
import { ScanLine, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Cpu, Layers } from 'lucide-react';
import { playScannerLaser, playWarningTone, playChime } from '../utils/soundEngine';

const SAMPLES = [
  {
    id: 'sample-1',
    name: 'Dr. Sharma Multi-Drug Routine',
    category: 'Standard Clinical Routine',
    image: '/prescription_sample.jpg',
    description: 'Triple therapy: Metformin 500mg, Amlodipine 5mg, Atorvastatin 10mg with clean hospital stamp.',
    extracted: [
      {
        name: 'Metformin',
        strength: '500 mg',
        dose: '1 tablet',
        frequency: 'Twice daily (PO BID)',
        timing: 'After meals',
        confidence: 98,
        status: 'VERIFIED'
      },
      {
        name: 'Amlodipine',
        strength: '5 mg',
        dose: '1 tablet',
        frequency: 'Once daily (PO QD)',
        timing: 'Morning',
        confidence: 97,
        status: 'VERIFIED'
      },
      {
        name: 'Atorvastatin',
        strength: '10 mg',
        dose: '1 tablet',
        frequency: 'Once daily (PO QHS)',
        timing: 'Bedtime',
        confidence: 96,
        status: 'VERIFIED'
      }
    ],
    flags: [],
    diffDetected: null
  },
  {
    id: 'sample-2',
    name: 'Prescription Change Detected',
    category: 'Dosage Modification Diff',
    image: '/prescription_sample.jpg',
    description: 'Patient receives revised cardiologist note with titration: Amlodipine increased from 5mg to 10mg.',
    extracted: [
      {
        name: 'Amlodipine',
        strength: '10 mg',
        dose: '1 tablet',
        frequency: 'Once daily',
        timing: 'Morning',
        confidence: 96,
        status: 'TITRATED'
      },
      {
        name: 'Metformin',
        strength: '500 mg',
        dose: '1 tablet',
        frequency: 'Twice daily',
        timing: 'After meals',
        confidence: 98,
        status: 'UNCHANGED'
      }
    ],
    flags: [
      {
        type: 'DIFF',
        severity: 'attention',
        title: 'Prescription Change Detected',
        text: 'Amlodipine dose titrated: 5 mg → 10 mg. Previous 5mg scheduled regimen will be updated upon confirmation.'
      }
    ],
    diffDetected: {
      medicine: 'Amlodipine',
      oldDose: '5 mg daily',
      newDose: '10 mg daily',
      action: 'Dose Increased'
    }
  },
  {
    id: 'sample-3',
    name: 'Duplicate Active Ingredient',
    category: 'Safety Alert Trigger',
    image: '/prescription_sample.jpg',
    description: 'Patient enters Calpol 500mg while Panadol is already listed in their active medication cabinet.',
    extracted: [
      {
        name: 'Calpol',
        strength: '500 mg',
        dose: '1 tablet',
        frequency: 'As needed (PRN)',
        timing: 'Every 6 hours',
        confidence: 99,
        status: 'DUPLICATE_FLAGGED'
      }
    ],
    flags: [
      {
        type: 'DUPLICATE',
        severity: 'warning',
        title: 'Duplicate Therapy Signal Detected',
        text: 'Calpol contains Paracetamol (Acetaminophen). You already have Panadol (also Paracetamol) logged in your active plan. Total paracetamol may exceed 4,000 mg/day safe threshold. Verify with your pharmacist.'
      }
    ],
    diffDetected: null
  },
  {
    id: 'sample-4',
    name: 'Handwritten Ambiguity (Edge Case)',
    category: 'AI Guardrail / Refuses Hallucination',
    image: '/handwritten_rx.jpg',
    description: 'Messy doctor cursive with questionable notation "Metf 500? tid (??)". System halts and requests human verification.',
    extracted: [
      {
        name: 'Metf... 500?',
        strength: '500 mg (?)',
        dose: '1 tab (?)',
        frequency: 'tid (??)',
        timing: 'Uncertain',
        confidence: 63,
        status: 'UNVERIFIED'
      }
    ],
    flags: [
      {
        type: 'AMBIGUITY',
        severity: 'urgent',
        title: 'Prescription Could Not Be Confidently Identified',
        text: 'Optical character confidence is 63% on timing instruction. AI guardrails forbid guessing medical regimens. Did the clinician prescribe Metformin 500 mg twice daily? Please verify with your doctor or upload a clearer scan.'
      }
    ],
    diffDetected: null
  }
];

export default function PrescriptionScanner() {
  const [activeSample, setActiveSample] = useState(SAMPLES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('extracted');

  const handleSelectSample = (sample) => {
    setActiveSample(sample);
    setIsScanning(true);
    playScannerLaser();

    setTimeout(() => {
      setIsScanning(false);
      if (sample.flags.length > 0) {
        playWarningTone();
      } else {
        playChime(620, 'sine', 0.2);
      }
    }, 1100);
  };

  return (
    <section className="section-padding prescription-section" id="prescriptions">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            PRESCRIPTION INTELLIGENCE PIPELINE
          </div>
          <h2 className="section-title">
            MULTIMODAL OCR & <span className="gradient-text">SAFETY RECONCILIATION</span>
          </h2>
          <p className="section-description">
            Watch the clinical pipeline ingest real prescriptions, score OCR confidence per field, detect medication titrations, and halt if handwritten handwriting is ambiguous.
          </p>
        </div>

        {/* Sample Scenario Selector */}
        <div className="sample-selector-grid">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className={`sample-card ${activeSample.id === sample.id ? 'active' : ''}`}
              onClick={() => handleSelectSample(sample)}
            >
              <div className="sample-badge">{sample.category}</div>
              <h4>{sample.name}</h4>
              <p>{sample.description}</p>
            </button>
          ))}
        </div>

        {/* Scanner Workbench */}
        <div className="scanner-workbench">
          {/* Left: Interactive Prescription Image with Scanning Laser */}
          <div className="scanner-viewer-panel">
            <div className="panel-bar">
              <span className="dot online"></span>
              <span className="panel-title">INPUT ARTIFACT // OPTICAL SCANNER</span>
              <span className="panel-meta">CAMERA RESOLUTION: 4K UHD</span>
            </div>

            <div className="image-scan-stage">
              <img 
                src={activeSample.image} 
                alt={activeSample.name} 
                className="prescription-img"
              />

              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="scan-laser-line">
                  <div className="laser-beam"></div>
                  <div className="laser-particle-sparks"></div>
                </div>
              )}

              {/* Holographic Bounding Boxes */}
              <div className="bounding-box box-1">
                <span className="bbox-tag">RX_NAME_FIELD [98%]</span>
              </div>
              <div className="bounding-box box-2">
                <span className="bbox-tag">DOSAGE_FREQ [96%]</span>
              </div>
              <div className="bounding-box box-3">
                <span className="bbox-tag">CLINICIAN_STAMP [VERIFIED]</span>
              </div>
            </div>

            <div className="viewer-footer">
              <button 
                type="button" 
                className="rescan-btn"
                onClick={() => handleSelectSample(activeSample)}
                disabled={isScanning}
              >
                <RefreshCw size={13} className={isScanning ? 'spin-icon' : ''} />
                <span>{isScanning ? 'Processing OCR Pipeline...' : 'Re-Run Optical Scan'}</span>
              </button>
              <span className="engine-label">OCR ENGINE: TESSERACT + GEMINI VISION 2.5</span>
            </div>
          </div>

          {/* Right: Extracted Structured JSON & Safety Flags */}
          <div className="scanner-results-panel">
            <div className="panel-tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'extracted' ? 'active' : ''}`}
                onClick={() => setActiveTab('extracted')}
              >
                Extracted Regimen ({activeSample.extracted.length})
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
                onClick={() => setActiveTab('safety')}
              >
                Safety Flags ({activeSample.flags.length})
              </button>
              {activeSample.diffDetected && (
                <button 
                  type="button" 
                  className={`tab-btn tab-diff ${activeTab === 'diff' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diff')}
                >
                  Regimen Diff ⚡
                </button>
              )}
            </div>

            <div className="panel-content">
              {activeTab === 'extracted' && (
                <div className="extracted-list">
                  {activeSample.extracted.map((med, idx) => (
                    <div key={idx} className="extracted-card">
                      <div className="extracted-header">
                        <div className="med-title-group">
                          <strong>{med.name}</strong>
                          <span className="med-badge">{med.strength}</span>
                        </div>
                        <div className={`confidence-meter ${med.confidence < 70 ? 'low' : 'high'}`}>
                          <span>{med.confidence}% CONFIDENCE</span>
                        </div>
                      </div>

                      <div className="extracted-grid">
                        <div className="param-item">
                          <span className="param-k">DOSE:</span>
                          <span className="param-v">{med.dose}</span>
                        </div>
                        <div className="param-item">
                          <span className="param-k">FREQUENCY:</span>
                          <span className="param-v">{med.frequency}</span>
                        </div>
                        <div className="param-item">
                          <span className="param-k">TIMING:</span>
                          <span className="param-v">{med.timing}</span>
                        </div>
                        <div className="param-item">
                          <span className="param-k">RECONCILIATION:</span>
                          <span className={`param-v status-${med.status.toLowerCase()}`}>{med.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Edge Case Warning if confidence is low */}
                  {activeSample.extracted.some(m => m.confidence < 70) && (
                    <div className="edge-case-alert-box">
                      <AlertTriangle size={16} className="text-amber" />
                      <div>
                        <strong>OCR Ambiguity Guard Activated</strong>
                        <p>AI does not make guesswork of dosage instructions. The timing has been marked for patient/pharmacist sign-off.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="safety-flags-list">
                  {activeSample.flags.length === 0 ? (
                    <div className="no-flags-card">
                      <CheckCircle2 size={32} className="text-emerald" />
                      <h4>Zero Clinical Conflicts Identified</h4>
                      <p>All active molecules reconcile cleanly against the National Library of Medicine Formulary and patient history.</p>
                    </div>
                  ) : (
                    activeSample.flags.map((flag, idx) => (
                      <div key={idx} className={`flag-card flag-${flag.severity}`}>
                        <div className="flag-top">
                          <AlertTriangle size={16} />
                          <strong>{flag.title}</strong>
                        </div>
                        <p>{flag.text}</p>
                        <div className="flag-action-prompt">
                          <span>RECOMMENDED ACTION:</span>
                          <em>Confirm with prescribing doctor or licensed pharmacist.</em>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'diff' && activeSample.diffDetected && (
                <div className="diff-view-card">
                  <div className="diff-header">
                    <span className="diff-tag">PATIENT MEDICATION RECONCILIATION</span>
                    <h4>Titration Detected on {activeSample.diffDetected.medicine}</h4>
                  </div>

                  <div className="diff-comparison-table">
                    <div className="diff-col old-col">
                      <span className="col-label">PREVIOUS ACTIVE REGIMEN</span>
                      <strong className="dose-val">{activeSample.diffDetected.oldDose}</strong>
                      <span className="sub-note">Prescribed Oct 12</span>
                    </div>

                    <div className="diff-arrow">
                      <ArrowRight size={20} />
                    </div>

                    <div className="diff-col new-col">
                      <span className="col-label">NEW PRESCRIPTION</span>
                      <strong className="dose-val highlight">{activeSample.diffDetected.newDose}</strong>
                      <span className="sub-note">Prescribed Today</span>
                    </div>
                  </div>

                  <div className="diff-callout">
                    <p>
                      <strong>Automatic Safety Check:</strong> MediCheck prevents accidental double-dosing by asking whether the new 10mg replaces the 5mg tablet.
                    </p>
                    <button type="button" className="confirm-titration-btn" onClick={() => playChime(580, 'sine', 0.15)}>
                      Confirm & Replace 5mg Regimen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

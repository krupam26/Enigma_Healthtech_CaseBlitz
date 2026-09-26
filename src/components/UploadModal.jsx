import React, { useState } from 'react';
import { UploadCloud, FileText, Camera, Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { playScannerLaser, playChime } from '../utils/soundEngine';

export default function UploadModal({ isOpen, onClose, onApplyRegimen }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'success'

  if (!isOpen) return null;

  const handleSimulateUpload = (presetName) => {
    setSelectedFile(presetName);
    setStep('scanning');
    setIsProcessing(true);
    playScannerLaser();

    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      playChime(660, 'triangle', 0.2);
    }, 1400);
  };

  const handleFinish = () => {
    if (onApplyRegimen) onApplyRegimen();
    onClose();
    setStep('upload');
    setSelectedFile(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel upload-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {step === 'upload' && (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">STEP 1 // PRESCRIPTION INGESTION</span>
              <h3>Upload Doctor Prescription</h3>
              <p>Supported inputs: Camera photos (JPG/PNG), Hospital discharge PDFs, or handwritten clinic slips.</p>
            </div>

            {/* Drag & Drop Area */}
            <div 
              className={`dropzone-box ${dragOver ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleSimulateUpload('Uploaded_Prescription.pdf');
              }}
            >
              <UploadCloud size={38} className="dropzone-icon" />
              <div className="dropzone-text">
                <strong>Drag and drop prescription document</strong>
                <span>or click to browse local files</span>
              </div>
              <input 
                type="file" 
                className="file-input-hidden" 
                onChange={() => handleSimulateUpload('Scanned_Rx_Image.jpg')} 
              />
            </div>

            {/* Quick Demo Presets */}
            <div className="demo-presets-section">
              <span className="presets-label">OR TEST INSTANT CLINICAL PRESETS:</span>
              <div className="presets-list">
                <button 
                  type="button" 
                  className="preset-item-btn"
                  onClick={() => handleSimulateUpload('Dr. Sharma (Cardio / Diabetic)')}
                >
                  <FileText size={14} />
                  <span>Dr. Sharma Multi-Drug Routine</span>
                </button>
                <button 
                  type="button" 
                  className="preset-item-btn"
                  onClick={() => handleSimulateUpload('Duplicate Paracetamol (Calpol + Panadol)')}
                >
                  <FileText size={14} />
                  <span>Duplicate Therapy Conflict</span>
                </button>
                <button 
                  type="button" 
                  className="preset-item-btn"
                  onClick={() => handleSimulateUpload('Handwritten Slip (Dr. Chen)')}
                >
                  <FileText size={14} />
                  <span>Handwritten Cursive Slip</span>
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'scanning' && (
          <div className="scanning-state-view">
            <div className="scanning-radar-loader">
              <div className="radar-circle-pulse"></div>
              <Sparkles size={32} className="pulse-sparkle" />
            </div>

            <h4>Reconciling Clinical Regimen...</h4>
            <p>Scanning <strong>{selectedFile}</strong> with Gemini Vision 2.5 + NLM Pharmacopeia verification engine.</p>

            <div className="scan-progress-bar">
              <div className="progress-fill-animate"></div>
            </div>

            <div className="pipeline-steps-ticker">
              <span>● Ingesting Optical Boundaries</span>
              <span>● Extracting Dosages & Meals</span>
              <span>● Performing Cross-Brand Duplicate Checks</span>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-state-view">
            <div className="success-icon-badge">
              <Check size={36} className="text-emerald" />
            </div>

            <h4>Prescription Successfully Reconciled!</h4>
            <p>
              MediCheck has converted <strong>{selectedFile}</strong> into a structured schedule, verified 0 active conflicts, and populated your clinical regimen board.
            </p>

            <div className="success-summary-box">
              <div className="summary-item">
                <span>DETECTED DRUGS</span>
                <strong>3 Formulations</strong>
              </div>
              <div className="summary-item">
                <span>CONFIDENCE</span>
                <strong className="text-emerald">98.4% Verified</strong>
              </div>
              <div className="summary-item">
                <span>SAFETY RADAR</span>
                <strong className="text-cyan">Passed (0 Flags)</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="finish-cta-btn"
              onClick={handleFinish}
            >
              <span>View Reconciled Regimen Board</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

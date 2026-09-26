import React, { useState, useEffect } from 'react';
import RxTelemetryBar from './components/RxTelemetryBar';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import RegimenBoard from './components/RegimenBoard';
import SafetyRadar from './components/SafetyRadar';
import CaregiverMode from './components/CaregiverMode';
import MedicalCursor from './components/MedicalCursor';
import Preloader from './components/Preloader';
import UploadModal from './components/UploadModal';
import EmergencyModal from './components/EmergencyModal';
import Footer from './components/Footer';
import { UploadCloud } from 'lucide-react';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(1.0, Math.max(0, window.scrollY / scrollHeight));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="medicheck-app">
      {/* System Cinematic Preloader */}
      <Preloader />

      {/* Reticle Cursor for Precision Telemetry */}
      <MedicalCursor />

      {/* Top Clinical Progress Bar */}
      <RxTelemetryBar scrollProgress={scrollProgress} />

      {/* Sticky Main Navigation */}
      <Navbar 
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      <main>
        {/* 1. Hero Showcase with Interactive 3D Pill Stage */}
        <HeroSection 
          onOpenUpload={() => setUploadModalOpen(true)}
          onScrollToSection={scrollToSection}
        />

        {/* 2. Today's Regimen Split-Flap Board */}
        <RegimenBoard />

        {/* 3. 360° Deterministic Safety Radar */}
        <SafetyRadar />

        {/* 4. Trusted Circle & Consent-Gated Caregiver Escalation */}
        <CaregiverMode 
          onOpenEmergency={() => setEmergencyModalOpen(true)}
        />
      </main>

      {/* Footer & Technical Architecture */}
      <Footer onOpenUpload={() => setUploadModalOpen(true)} />

      {/* Ingestion & OCR Modal */}
      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)}
        onApplyRegimen={() => scrollToSection('regimen')}
      />

      {/* Clinical Safety Incident & Emergency Modal */}
      <EmergencyModal 
        isOpen={emergencyModalOpen} 
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  );
}

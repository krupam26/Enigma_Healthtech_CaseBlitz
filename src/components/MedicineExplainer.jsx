import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, HeartPulse, ShieldAlert, Check } from 'lucide-react';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speechEngine';
import { playChime } from '../utils/soundEngine';

const MEDICINES_DATA = {
  metformin: {
    name: 'Metformin 500 mg',
    generic: 'Metformin Hydrochloride (Extended Release)',
    class: 'Biguanide Antidiabetic',
    levels: {
      simple: {
        text: 'This medicine helps your body manage sugar in your blood. Think of insulin like a key that unlocks your cells so sugar can give you energy. Metformin makes that key work much better, so sugar does not get trapped in your blood.',
        takeTip: 'Always swallow with or right after food so your tummy stays happy.'
      },
      normal: {
        text: 'Metformin lowers high blood glucose levels by decreasing how much sugar your liver makes and helping your muscle tissue respond properly to natural insulin. It does not cause sudden low blood sugar (hypoglycemia) when taken alone.',
        takeTip: 'Take 1 tablet after breakfast and 1 tablet after dinner with plenty of water.'
      },
      detailed: {
        text: 'Activates AMP-activated protein kinase (AMPK), decreasing hepatic gluconeogenesis and intestinal absorption of glucose while enhancing peripheral glucose uptake and insulin sensitivity. Elimination half-life approx 6.2 hours; primarily excreted unchanged renally.',
        takeTip: 'Monitor eGFR periodically; discontinue prior to iodinated radiocontrast procedures.'
      }
    },
    translations: {
      en: 'Take one tablet after breakfast. Helps your body manage blood sugar.',
      hi: 'नाश्ते के बाद 1 गोली लें। यह दवा आपके खून में शुगर को नियंत्रित रखने में मदद करती है।',
      mr: 'नाश्त्यानंतर १ गोळी घ्या. हे औषध तुमच्या रक्तातील साखर नियंत्रित ठेवण्यास मदत करते.'
    }
  },
  amlodipine: {
    name: 'Amlodipine 5 mg',
    generic: 'Amlodipine Besylate',
    class: 'Dihydropyridine Calcium Channel Blocker',
    levels: {
      simple: {
        text: 'This pill helps your heart relax. Imagine your blood pipes were squeezed tight like a garden hose. Amlodipine gently loosens the pipes so your blood flows smoothly without making your heart work too hard.',
        takeTip: 'Take once every morning at roughly the same time.'
      },
      normal: {
        text: 'Amlodipine relaxes and widens your blood vessel walls. This lowers elevated blood pressure and decreases the strain on your heart muscle, significantly reducing long-term risk of strokes and heart attacks.',
        takeTip: 'Take 1 tablet every morning with or without food. Avoid grapefruit juice.'
      },
      detailed: {
        text: 'Inhibits transmembrane influx of extracellular calcium ions into vascular smooth muscle and cardiac muscle cells during depolarization. Produces peripheral arterial vasodilation with minimal reflex tachycardia. Terminal elimination half-life is 30–50 hours.',
        takeTip: 'Monitor for peripheral pedal edema; steady-state plasma concentration reached in 7–8 days.'
      }
    },
    translations: {
      en: 'Take one tablet every morning. Helps relax blood vessels and lower blood pressure.',
      hi: 'रोज सुबह 1 गोली लें। यह दवा रक्त वाहिकाओं को शिथिल कर रक्तचाप को नियंत्रित करती है।',
      mr: 'दररोज सकाळी १ गोळी घ्या. हे औषध रक्तवाहिन्या शिथिल करून रक्तदाब कमी करण्यास मदत करते.'
    }
  },
  atorvastatin: {
    name: 'Atorvastatin 10 mg',
    generic: 'Atorvastatin Calcium Trihydrate',
    class: 'HMG-CoA Reductase Inhibitor (Statin)',
    levels: {
      simple: {
        text: 'This pill acts like a quiet street sweeper inside your blood vessels. It sweeps away bad sticky cholesterol gunk before it can clog up the pipes that bring oxygen to your heart.',
        takeTip: 'Take this tablet at night before you go to sleep.'
      },
      normal: {
        text: 'Atorvastatin reduces LDL (“bad”) cholesterol and triglycerides while modestly raising HDL (“good”) cholesterol. It stabilizes arterial plaque so it cannot rupture and cause cardiovascular incidents.',
        takeTip: 'Take 1 tablet every night at bedtime. Report any unexplained muscle aches immediately.'
      },
      detailed: {
        text: 'Competitive inhibitor of HMG-CoA reductase, the rate-limiting enzyme in cholesterol biosynthesis. Increases hepatic LDL receptors, promoting LDL catabolism. Peak plasma levels within 1–2 hours; undergoes hepatic CYP3A4 metabolism.',
        takeTip: 'Avoid concurrent strong CYP3A4 inhibitors (clarithromycin, ketoconazole). Baseline LFTs recommended.'
      }
    },
    translations: {
      en: 'Take one tablet at night before sleep. Lowers bad cholesterol and protects your heart.',
      hi: 'रात को सोने से पहले 1 गोली लें। यह खराब कोलेस्ट्रॉल को कम करके दिल की रक्षा करती है।',
      mr: 'रात्री झोपण्यापूर्वी १ गोळी घ्या. हे खराब कोलेस्टेरॉल कमी करून हृदयाचे संरक्षण करते.'
    }
  }
};

export default function MedicineExplainer() {
  const [selectedMedKey, setSelectedMedKey] = useState('metformin');
  const [level, setLevel] = useState('simple'); // 'simple' | 'normal' | 'detailed'
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'mr'
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const med = MEDICINES_DATA[selectedMedKey];

  const handleSpeak = () => {
    if (isVoicePlaying) {
      stopSpeaking();
      setIsVoicePlaying(false);
      return;
    }

    const textToSpeak = language === 'en' ? med.levels[level].text : med.translations[language];
    setIsVoicePlaying(true);
    speakText(
      textToSpeak,
      language,
      () => setIsVoicePlaying(true),
      () => setIsVoicePlaying(false)
    );
  };

  const handleSelectMed = (key) => {
    stopSpeaking();
    setIsVoicePlaying(false);
    setSelectedMedKey(key);
    playChime(500, 'sine', 0.1);
  };

  const handleLevelChange = (lvl) => {
    stopSpeaking();
    setIsVoicePlaying(false);
    setLevel(lvl);
    playChime(600, 'triangle', 0.1);
  };

  const handleLangChange = (lang) => {
    stopSpeaking();
    setIsVoicePlaying(false);
    setLanguage(lang);
    playChime(560, 'sine', 0.1);
  };

  return (
    <section className="section-padding explainer-section" id="explainer">
      <div className="site-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <span className="eyebrow-line"></span>
            HEALTH LITERACY & PLAIN-LANGUAGE ENGINE
          </div>
          <h2 className="section-title">
            “WHY AM I <span className="gradient-text">TAKING THIS?”</span>
          </h2>
          <p className="section-description">
            WHO identifies low health literacy as a major factor in patient harm. MediCheck turns clinical jargon into crystal-clear explanations with 3 cognitive tiers and native multilingual voice playback.
          </p>
        </div>

        {/* Medicine Selector Tabs */}
        <div className="med-pills-row">
          {Object.keys(MEDICINES_DATA).map((key) => {
            const item = MEDICINES_DATA[key];
            return (
              <button
                key={key}
                type="button"
                className={`med-select-pill ${selectedMedKey === key ? 'active' : ''}`}
                onClick={() => handleSelectMed(key)}
              >
                <span className="med-dot"></span>
                <strong>{item.name}</strong>
              </button>
            );
          })}
        </div>

        {/* Main Explainer Card */}
        <div className="explainer-card">
          {/* Card Top Controls */}
          <div className="explainer-controls">
            {/* Level Selector */}
            <div className="level-btn-group">
              <span className="control-label">COMPREHENSION DEPTH:</span>
              <button
                type="button"
                className={`level-btn ${level === 'simple' ? 'active' : ''}`}
                onClick={() => handleLevelChange('simple')}
              >
                🧒 Explain Like I’m 10
              </button>
              <button
                type="button"
                className={`level-btn ${level === 'normal' ? 'active' : ''}`}
                onClick={() => handleLevelChange('normal')}
              >
                👨 Standard Patient
              </button>
              <button
                type="button"
                className={`level-btn ${level === 'detailed' ? 'active' : ''}`}
                onClick={() => handleLevelChange('detailed')}
              >
                🩺 Clinical Pharmacist
              </button>
            </div>

            {/* Language Selector */}
            <div className="lang-btn-group">
              <span className="control-label">LANGUAGE:</span>
              <button
                type="button"
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLangChange('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => handleLangChange('hi')}
              >
                हिंदी (Hindi)
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'mr' ? 'active' : ''}`}
                onClick={() => handleLangChange('mr')}
              >
                मराठी (Marathi)
              </button>
            </div>
          </div>

          {/* Explanation Body */}
          <div className="explainer-body">
            <div className="explainer-meta-banner">
              <div>
                <span className="banner-k">ACTIVE FORMULATION</span>
                <h4>{med.generic}</h4>
              </div>
              <div>
                <span className="banner-k">PHARMACOLOGICAL CLASS</span>
                <span className="class-badge">{med.class}</span>
              </div>
            </div>

            {/* Multilingual Highlight or Tier Narrative */}
            <div className="narrative-box">
              {language === 'en' ? (
                <p className="narrative-text">
                  {med.levels[level].text}
                </p>
              ) : (
                <div className="translated-box">
                  <div className="translated-tag">
                    {language === 'hi' ? 'हिंदी अनुवाद (HINDI AUDIO READY)' : 'मराठी अनुवाद (MARATHI AUDIO READY)'}
                  </div>
                  <p className="translated-text">
                    “{med.translations[language]}”
                  </p>
                  <small className="translated-note">
                    English translation: “{med.translations.en}”
                  </small>
                </div>
              )}
            </div>

            {/* Instructions & Timing Protocol */}
            <div className="clinical-tip-box">
              <span className="tip-tag">CHRONOTHERAPY INSTRUCTION</span>
              <p>{med.levels[level].takeTip}</p>
            </div>

            {/* Voice Read Aloud Action Bar */}
            <div className="voice-action-bar">
              <button
                type="button"
                className={`read-aloud-btn ${isVoicePlaying ? 'speaking' : ''}`}
                onClick={handleSpeak}
              >
                {isVoicePlaying ? (
                  <>
                    <VolumeX size={16} />
                    <span>Stop Voice Reading</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} />
                    <span>Read Aloud ({language.toUpperCase()})</span>
                  </>
                )}

                {isVoicePlaying && (
                  <div className="speech-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </button>

              <div className="disclaimer-badge">
                <ShieldAlert size={13} className="text-gold" />
                <span>Deterministic clinical guardrail: AI explains, never prescribes or changes doctor's dosage.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

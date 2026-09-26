// Browser Web Speech API helper for multilingual voice synthesis

let currentUtterance = null;

export function speakText(text, language = 'en', onStart, onEnd) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    return false;
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  if (!text) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  // Language mapping
  const langMap = {
    en: 'en-US',
    hi: 'hi-IN',
    mr: 'mr-IN'
  };

  utterance.lang = langMap[language] || 'en-US';
  utterance.rate = 0.95; // Clear, measured pace for medical clarity
  utterance.pitch = 1.0;

  // Try to find a natural sounding voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang === utterance.lang || v.lang.startsWith(language));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech error:', e);
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking() {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

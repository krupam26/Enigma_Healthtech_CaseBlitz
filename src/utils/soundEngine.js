// Pure Web Audio API Sound Synthesizer for MediCheck
// Self-contained sound effects and ambient medical drone

let audioCtx = null;
let ambientGain = null;
let ambientOsc = null;
let isAudioActive = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleAmbientSound(forceState) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const nextState = forceState !== undefined ? forceState : !isAudioActive;
  isAudioActive = nextState;

  if (isAudioActive) {
    startAmbientDrone();
  } else {
    stopAmbientDrone();
  }
  return isAudioActive;
}

export function isSoundEnabled() {
  return isAudioActive;
}

function startAmbientDrone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ambientOsc) {
      ambientOsc.stop();
      ambientOsc.disconnect();
    }

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 2);
    ambientGain.connect(ctx.destination);

    // Deep sub-bass soothing medical tone
    ambientOsc = ctx.createOscillator();
    ambientOsc.type = 'sine';
    ambientOsc.frequency.setValueAtTime(108, ctx.currentTime); // A2 / peaceful resonant
    ambientOsc.connect(ambientGain);
    ambientOsc.start();
  } catch (e) {
    console.warn('Audio start error:', e);
  }
}

function stopAmbientDrone() {
  if (ambientGain && audioCtx) {
    try {
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      setTimeout(() => {
        if (ambientOsc) {
          ambientOsc.stop();
          ambientOsc.disconnect();
          ambientOsc = null;
        }
      }, 700);
    } catch {
      if (ambientOsc) ambientOsc.stop();
      ambientOsc = null;
    }
  }
}

export function playChime(freq = 520, type = 'sine', duration = 0.3) {
  if (!isAudioActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn(e);
  }
}

export function playDoseTaken() {
  if (!isAudioActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Harmonic major triad chord (C5 - E5 - G5)
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8 + idx * 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + 0.9 + idx * 0.06);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playScannerLaser() {
  if (!isAudioActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.25);

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn(e);
  }
}

export function playWarningTone() {
  if (!isAudioActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(280, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn(e);
  }
}

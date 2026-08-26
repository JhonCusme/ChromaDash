/**
 * ChromaDash — Audio Manager
 * Procedurally generated SFX using Web Audio API (no external audio files needed)
 */

let ctx = null;
let masterGain = null;
let sfxEnabled = true;

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone({ frequency = 440, type = 'sine', duration = 0.12, volume = 0.4, attack = 0.005, decay = 0.1, detune = 0 }) {
  if (!sfxEnabled) return;
  try {
    ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch (e) { /* silent */ }
}

function playNoise({ duration = 0.1, volume = 0.2, lowpass = 800 }) {
  if (!sfxEnabled) return;
  try {
    ensureContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  } catch (e) { /* silent */ }
}

const AudioManager = {
  setSfxEnabled(v) { sfxEnabled = v; },

  /** Color changed — bright ding */
  colorChange() {
    playTone({ frequency: 660, type: 'triangle', duration: 0.12, volume: 0.35 });
  },

  /** Correct color match — success chord */
  colorMatch() {
    playTone({ frequency: 523, type: 'sine', duration: 0.08, volume: 0.3 });
    setTimeout(() => playTone({ frequency: 784, type: 'sine', duration: 0.12, volume: 0.3 }), 60);
  },

  /** Game over — descending thud */
  gameOver() {
    playTone({ frequency: 220, type: 'sawtooth', duration: 0.3, volume: 0.4 });
    setTimeout(() => playTone({ frequency: 110, type: 'square', duration: 0.4, volume: 0.35 }), 120);
    playNoise({ duration: 0.25, volume: 0.25, lowpass: 400 });
  },

  /** Coin collected */
  coin() {
    playTone({ frequency: 1047, type: 'sine', duration: 0.08, volume: 0.25 });
    setTimeout(() => playTone({ frequency: 1319, type: 'sine', duration: 0.08, volume: 0.2 }), 50);
  },

  /** Power-up collected */
  powerUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone({ frequency: f, type: 'triangle', duration: 0.1, volume: 0.3 }), i * 60);
    });
  },

  /** Button tap */
  tap() {
    playTone({ frequency: 880, type: 'sine', duration: 0.07, volume: 0.2 });
  },

  /** Revive sound — ascending sweep */
  revive() {
    [220, 330, 440, 660, 880].forEach((f, i) => {
      setTimeout(() => playTone({ frequency: f, type: 'sine', duration: 0.15, volume: 0.3 }), i * 70);
    });
  },
};

export default AudioManager;

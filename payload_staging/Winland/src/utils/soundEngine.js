// Real-Time Web Audio API Sound Engine & Frequency Spectrum Analyser

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.enabled = false; // Disabled all interaction sounds completely
    this.isPlayingSynthMusic = false;
    this.musicInterval = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Get real-time frequency data for visualizers (0 to 255 per bin)
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(16).fill(128);
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    return buffer;
  }

  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.setValueAtTime(1661.22, now + 0.1);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.analyser || this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  playAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + i * 0.15);

        gain.gain.setValueAtTime(0.12, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);

        osc.connect(gain);
        gain.connect(this.analyser || this.audioCtx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
      }
    } catch (e) {
      console.warn('Alarm error:', e);
    }
  }

  playRingtone() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.08, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.analyser || this.audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.25);
      });
    } catch (e) {
      console.warn('Ringtone error:', e);
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch (e) {
      console.warn('Click error:', e);
    }
  }

  // Synthesizes rhythm & beat notes with analyser routing
  startSynthMusic() {
    if (!this.enabled || this.isPlayingSynthMusic) return;
    this.init();
    if (!this.audioCtx) return;

    this.isPlayingSynthMusic = true;

    const playRhythmBeat = () => {
      if (!this.isPlayingSynthMusic) return;
      const now = this.audioCtx.currentTime;

      // Kick drum pulse for beat reactivity
      const kickOsc = this.audioCtx.createOscillator();
      const kickGain = this.audioCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      kickGain.gain.setValueAtTime(0.25, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      kickOsc.connect(kickGain);
      kickGain.connect(this.analyser || this.audioCtx.destination);

      kickOsc.start(now);
      kickOsc.stop(now + 0.15);

      // Ambient synth chords
      const chords = [
        [293.66, 369.99, 440.0, 554.37], // Dmaj7
        [277.18, 329.63, 415.3, 493.88], // C#m7
        [369.99, 440.0, 554.37, 659.25], // F#m7
        [220.0, 277.18, 329.63, 440.0],  // A
      ];
      const chord = chords[Math.floor((now / 1.2) % chords.length)];

      chord.forEach((freq) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.analyser || this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      });
    };

    playRhythmBeat();
    this.musicInterval = setInterval(playRhythmBeat, 600); // 100 BPM rhythm beat
  }

  stopSynthMusic() {
    this.isPlayingSynthMusic = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();

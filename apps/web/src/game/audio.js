// ─── audio.js ─── Sound effects & procedural ambient music ────────────────

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── SoundEngine — procedural SFX via Web Audio API ────────────────────────  */
/* ═══════════════════════════════════════════════════════════════════════════ */
export class SoundEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.muted = false;
  }

  /** Create AudioContext — call on first user interaction. */
  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Master Output & Reverb
        this.master = this.ctx.createGain();
        this.master.gain.value = 1.0;
        this.reverb = this.ctx.createConvolver();
        const len = this.ctx.sampleRate * 2.0;
        const imp = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
        for (let i = 0; i < 2; i++) {
          const ch = imp.getChannelData(i);
          for (let j = 0; j < len; j++) ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 3);
        }
        this.reverb.buffer = imp;
        this.revGain = this.ctx.createGain();
        this.revGain.gain.value = 0.4;
        this.master.connect(this.ctx.destination);
        this.master.connect(this.reverb);
        this.reverb.connect(this.revGain);
        this.revGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('SoundEngine.init failed:', e);
    }
  }

  /** Toggle mute, returns new muted state. */
  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }

  /* ── Internal helpers ──────────────────────────────────────────────────── */

  /** @private */
  _tone(type, freqStart, freqEnd, duration, vol = 0.12) {
    try {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + duration);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain).connect(this.master || this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) { /* swallow */ }
  }

  /** @private — Two-tone helper */
  _chord(type1, f1, type2, f2, dur, vol = 0.08) {
    this._tone(type1, f1, f1, dur, vol);
    this._tone(type2, f2, f2, dur, vol * 0.7);
  }

  /** @private — Noise burst helper */
  _noise(dur, filterFreq, vol = 0.1) {
    try {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const bufSize = this.ctx.sampleRate * dur;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(filterFreq/4, 1), now + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter).connect(gain).connect(this.master || this.ctx.destination);
      src.start(now);
    } catch(e) {}
  }

  /* ── SFX Methods ───────────────────────────────────────────────────────── */

  /** Footstep: low sine 80→40Hz + noise */
  step() { this._tone('sine', 80, 40, 0.08, 0.06); this._noise(0.08, 400, 0.03); }

  /** Attack hit: sawtooth 280→60Hz + impact noise */
  hit() { this._tone('sawtooth', 280, 60, 0.12, 0.1); this._noise(0.15, 1200, 0.25); }

  /** Critical hit: square 440 + sine 880 + heavy noise */
  crit() { this._chord('square', 440, 'sine', 880, 0.15, 0.1); this._noise(0.2, 2000, 0.3); }

  /** Miss: soft sine dip 180→120Hz */
  miss() { this._tone('sine', 180, 120, 0.1, 0.05); this._noise(0.1, 800, 0.02); }

  /** Sever: heavy sawtooth 120→30Hz + tearing noise */
  sever() { this._tone('sawtooth', 120, 30, 0.2, 0.14); this._noise(0.25, 800, 0.4); }

  /** Enemy death: descending sine 200→35Hz */
  death() { this._tone('sine', 200, 35, 0.7, 0.1); this._noise(0.5, 600, 0.15); }

  /** Item pickup: two-note ascending chime */
  pickup() {
    try {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      this._tone('sine', 660, 660, 0.1, 0.08);
      // second note delayed 0.1s
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain).connect(this.master || this.ctx.destination);
      osc.start(now + 0.1);
      osc.stop(now + 0.25);
    } catch (e) { /* swallow */ }
  }

  /** Stairs descent: sawtooth whoosh 140→28Hz, 0.45s */
  descend() { this._tone('sawtooth', 140, 28, 0.45, 0.09); }

  /** Level up: 4-note arpeggio C-E-G-C */
  levelUp() {
    try {
      if (!this.ctx || this.muted) return;
      const notes = [261, 329, 392, 523];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.09, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.22);
      });
    } catch (e) { /* swallow */ }
  }

  /** Trap spring: square 200 + 150Hz, 0.1s */
  trap() { this._chord('square', 200, 'square', 150, 0.1, 0.1); }

  /** Craft success: ascending 500→600→750Hz sine */
  craft() {
    try {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      osc.frequency.linearRampToValueAtTime(750, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) { /* swallow */ }
  }

  /** Boss reveal: 55Hz sawtooth growl, 0.8s */
  boss() { this._tone('sawtooth', 55, 55, 0.8, 0.13); }

  /** Event trigger: sine 330 + 220Hz, 0.3s */
  event() { this._chord('sine', 330, 'sine', 220, 0.3, 0.07); }

  /** Heal: major third 523→659Hz */
  heal() {
    try {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      this._tone('sine', 523, 523, 0.15, 0.07);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659, now + 0.12);
      gain.gain.setValueAtTime(0.07, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain).connect(this.master || this.ctx.destination);
      osc.start(now + 0.12);
      osc.stop(now + 0.3);
    } catch (e) { /* swallow */ }
  }

  /** NPC greeting: quick 500→600Hz sine */
  npc() { this._tone('sine', 500, 600, 0.1, 0.06); }

  /** Fear spike: detuned sine 440→438Hz for eerie warble */
  fear() { this._chord('sine', 440, 'sine', 438, 0.5, 0.05); }
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── MusicEngine — procedural dark ambient ─────────────────────────────────  */
/* ═══════════════════════════════════════════════════════════════════════════ */
export class MusicEngine {
  /**
   * @param {SoundEngine} soundEngine - Shared SoundEngine for AudioContext
   */
  constructor(soundEngine) {
    this.se = soundEngine;
    this.playing = false;
    this.floor = 1;

    // Audio nodes
    this._droneOsc = null;
    this._droneLfo = null;
    this._droneGain = null;
    this._harmOsc = null;
    this._harmGain = null;
    this._combatOsc = null;
    this._combatLfo = null;
    this._combatGain = null;
    this._bossOsc = null;
    this._bossGain = null;
  }

  /** @private */
  get _ctx() { return this.se?.ctx ?? null; }

  /** Begin ambient music. */
  start() {
    try {
      const ctx = this._ctx;
      if (!ctx || this.playing) return;
      this.playing = true;

      const now = ctx.currentTime;

      // ── Base drone: very low sine with LFO ──
      this._droneOsc = ctx.createOscillator();
      this._droneLfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      this._droneOsc.type = 'sine';
      this._droneOsc.frequency.setValueAtTime(40, now);

      this._droneLfo.type = 'sine';
      this._droneLfo.frequency.setValueAtTime(0.15, now);
      lfoGain.gain.setValueAtTime(8, now);

      this._droneLfo.connect(lfoGain);
      lfoGain.connect(this._droneOsc.frequency);

      this._droneGain = ctx.createGain();
      this._droneGain.gain.setValueAtTime(0.015, now);
      this._droneOsc.connect(this._droneGain).connect(this.se.master || ctx.destination);

      this._droneOsc.start(now);
      this._droneLfo.start(now);

      // ── Harmonic layer ──
      this._harmOsc = ctx.createOscillator();
      this._harmOsc.type = 'sine';
      this._harmOsc.frequency.setValueAtTime(this._harmFreq(), now);
      this._harmGain = ctx.createGain();
      this._harmGain.gain.setValueAtTime(0.008, now);
      this._harmOsc.connect(this._harmGain).connect(this.se.master || ctx.destination);
      this._harmOsc.start(now);
    } catch (e) {
      console.warn('MusicEngine.start failed:', e);
    }
  }

  /** Stop all music. */
  stop() {
    try {
      this.playing = false;
      const nodes = [
        this._droneOsc, this._droneLfo, this._harmOsc,
        this._combatOsc, this._combatLfo, this._bossOsc,
      ];
      for (const n of nodes) {
        if (n) { try { n.stop(); } catch (_) {} }
      }
      const gains = [this._droneGain, this._harmGain, this._combatGain, this._bossGain];
      for (const g of gains) {
        if (g) { try { g.disconnect(); } catch (_) {} }
      }
      this._droneOsc = this._droneLfo = this._droneGain = null;
      this._harmOsc = this._harmGain = null;
      this._combatOsc = this._combatLfo = this._combatGain = null;
      this._bossOsc = this._bossGain = null;
    } catch (e) { /* swallow */ }
  }

  /** @private Harmonic frequency based on floor depth */
  _harmFreq() {
    // Deeper floors → lower, more dissonant
    return 55 - Math.min(this.floor, 10) * 1;
  }

  /** Adjust mood based on floor depth (1-10). */
  setFloor(floor) {
    try {
      this.floor = floor;
      const ctx = this._ctx;
      if (!ctx || !this.playing) return;
      const now = ctx.currentTime;

      // Shift drone base lower for deeper floors
      const baseFr = 40 - Math.min(floor, 10) * 1.5;
      if (this._droneOsc) {
        this._droneOsc.frequency.linearRampToValueAtTime(Math.max(baseFr, 25), now + 1);
      }
      if (this._harmOsc) {
        this._harmOsc.frequency.linearRampToValueAtTime(this._harmFreq(), now + 1);
      }
    } catch (e) { /* swallow */ }
  }

  /** Add combat intensity layer. */
  enterCombat() {
    try {
      const ctx = this._ctx;
      if (!ctx || !this.playing || this._combatOsc) return;
      const now = ctx.currentTime;

      this._combatOsc = ctx.createOscillator();
      this._combatOsc.type = 'square';
      this._combatOsc.frequency.setValueAtTime(55, now);

      this._combatLfo = ctx.createOscillator();
      this._combatLfo.type = 'sine';
      this._combatLfo.frequency.setValueAtTime(0.4, now);
      const lfoG = ctx.createGain();
      lfoG.gain.setValueAtTime(12, now);
      this._combatLfo.connect(lfoG);
      lfoG.connect(this._combatOsc.frequency);

      this._combatGain = ctx.createGain();
      this._combatGain.gain.setValueAtTime(0, now);
      this._combatGain.gain.linearRampToValueAtTime(0.012, now + 0.5);
      this._combatOsc.connect(this._combatGain).connect(this.se.master || ctx.destination);
      this._combatOsc.start(now);
      this._combatLfo.start(now);
    } catch (e) { /* swallow */ }
  }

  /** Remove combat layer. */
  exitCombat() {
    try {
      const ctx = this._ctx;
      if (!ctx) return;
      const now = ctx.currentTime;
      if (this._combatGain) {
        this._combatGain.gain.linearRampToValueAtTime(0, now + 0.8);
      }
      // Delayed cleanup
      setTimeout(() => {
        try {
          if (this._combatOsc)  this._combatOsc.stop();
          if (this._combatLfo)  this._combatLfo.stop();
        } catch (_) {}
        this._combatOsc = this._combatLfo = this._combatGain = null;
      }, 1200);
    } catch (e) { /* swallow */ }
  }

  /** Switch to boss music: dissonant tritone, heavier gain. */
  enterBoss() {
    try {
      const ctx = this._ctx;
      if (!ctx || !this.playing || this._bossOsc) return;
      const now = ctx.currentTime;

      // Tritone dissonance
      this._bossOsc = ctx.createOscillator();
      this._bossOsc.type = 'sawtooth';
      // A tritone above the base drone (~56.57Hz ≈ 40 * 2^(6/12))
      this._bossOsc.frequency.setValueAtTime(56.57, now);

      this._bossGain = ctx.createGain();
      this._bossGain.gain.setValueAtTime(0, now);
      this._bossGain.gain.linearRampToValueAtTime(0.018, now + 1);
      this._bossOsc.connect(this._bossGain).connect(this.se.master || ctx.destination);
      this._bossOsc.start(now);

      // Also boost drone gain
      if (this._droneGain) {
        this._droneGain.gain.linearRampToValueAtTime(0.02, now + 0.5);
      }
    } catch (e) { /* swallow */ }
  }
}

/**
 * Musik und Klangeffekte - vollstaendig synthetisiert.
 *
 * Es werden keine Audiodateien geladen. Stattdessen erzeugt ein kleiner
 * Sequenzer die Regionsmusik aus Akkordfolgen und Melodiemustern, und die
 * Effekte entstehen aus Oszillatoren und Rauschen. Das ist lizenzrechtlich
 * unbedenklich, spart Ladezeit und passt zum Pixel-Look.
 *
 * Der AudioContext darf erst nach einer Nutzergeste starten (Browser-Regel),
 * deshalb wird er beim ersten Tippen im Hauptmenue entsperrt.
 */

import type { MusicTrackId } from '@/data/types';
import { SETTINGS_KEY } from '@/core/constants';

// ---------------------------------------------------------------------------
// Musiktheorie-Hilfen
// ---------------------------------------------------------------------------

/** MIDI-Notennummer -> Frequenz in Hz. */
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Halbtonabstaende der verwendeten Tonleitern. */
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  wholeTone: [0, 2, 4, 6, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
} as const;

type ScaleName = keyof typeof SCALES;

/** Wandelt einen Stufenindex (kann negativ sein) in eine MIDI-Note. */
function degreeToMidi(root: number, scale: ScaleName, degree: number): number {
  const steps = SCALES[scale];
  const len = steps.length;
  const octave = Math.floor(degree / len);
  const index = ((degree % len) + len) % len;
  return root + octave * 12 + steps[index]!;
}

type Wave = OscillatorType;

interface TrackVoice {
  wave: Wave;
  /** Lautstaerke relativ zum Musikkanal. */
  gain: number;
  /** Notenlaenge als Anteil des Schrittes. */
  sustain: number;
  /** Anschlag/Ausklang in Sekunden. */
  attack: number;
  release: number;
  /** Stimmung in Halbtoenen (fuer Oktavverdopplung). */
  detune?: number;
  /** Leichtes Vibrato fuer die Melodie. */
  vibrato?: number;
}

interface TrackDef {
  bpm: number;
  root: number;
  scale: ScaleName;
  /** Schritte pro Takt. */
  stepsPerBar: number;
  /** Akkordfolge als Grundstufen, ein Eintrag je Takt. */
  progression: number[];
  /** Melodie als Stufenversatz relativ zum Akkord; null = Pause. */
  melody: (number | null)[];
  /** Bassmuster. */
  bass: (number | null)[];
  /** Flaechenklang - liegt ueber dem ganzen Takt. */
  pad?: boolean;
  /** Perkussionsmuster: 0 = nichts, 1 = Kick, 2 = Hihat, 3 = Snare. */
  perc?: number[];
  voices: { melody: TrackVoice; bass: TrackVoice; pad?: TrackVoice };
  /** Gesamtlautstaerke des Stuecks. */
  volume: number;
}

// ---------------------------------------------------------------------------
// Die Stuecke
// ---------------------------------------------------------------------------

const softLead: TrackVoice = { wave: 'triangle', gain: 0.34, sustain: 0.8, attack: 0.02, release: 0.14, vibrato: 3 };
const chipLead: TrackVoice = { wave: 'square', gain: 0.2, sustain: 0.62, attack: 0.005, release: 0.08 };
const warmBass: TrackVoice = { wave: 'triangle', gain: 0.4, sustain: 0.9, attack: 0.01, release: 0.1 };
const deepBass: TrackVoice = { wave: 'sawtooth', gain: 0.24, sustain: 0.95, attack: 0.02, release: 0.14 };
const airyPad: TrackVoice = { wave: 'sine', gain: 0.16, sustain: 1, attack: 0.5, release: 0.9 };

const TRACKS: Record<MusicTrackId, TrackDef> = {
  title: {
    bpm: 82,
    root: 57, // A
    scale: 'minor',
    stepsPerBar: 8,
    progression: [0, 5, 3, 4],
    melody: [
      0, null, 2, 4, null, 2, 0, null,
      4, null, 3, 2, null, 0, null, null,
      2, null, 4, 5, null, 4, 2, null,
      4, 2, 0, null, -1, 0, null, null,
    ],
    bass: [0, null, null, 0, null, null, -3, null],
    pad: true,
    voices: { melody: softLead, bass: warmBass, pad: airyPad },
    volume: 0.7,
  },

  village: {
    bpm: 104,
    root: 60, // C
    scale: 'major',
    stepsPerBar: 8,
    progression: [0, 3, 4, 0],
    melody: [
      0, 2, 4, null, 4, 2, 0, 2,
      4, null, 5, 4, 2, null, 0, null,
      2, 4, 6, null, 4, null, 2, 0,
      0, 2, 4, 2, 0, null, null, null,
    ],
    bass: [0, null, 4, null, 2, null, 4, null],
    perc: [1, 0, 2, 0, 3, 0, 2, 0],
    voices: { melody: softLead, bass: warmBass },
    volume: 0.6,
  },

  forest: {
    bpm: 76,
    root: 55, // G
    scale: 'dorian',
    stepsPerBar: 8,
    progression: [0, 2, 5, 3],
    melody: [
      0, null, null, 3, null, 2, null, null,
      4, null, 3, null, 2, null, null, null,
      5, null, 4, 3, null, null, 2, null,
      0, null, -2, null, 0, null, null, null,
    ],
    bass: [0, null, null, null, 2, null, null, null],
    pad: true,
    voices: { melody: softLead, bass: warmBass, pad: airyPad },
    volume: 0.55,
  },

  mountain: {
    bpm: 96,
    root: 53, // F
    scale: 'minor',
    stepsPerBar: 8,
    progression: [0, 0, 5, 4],
    melody: [
      0, 0, null, 2, 2, null, 4, null,
      3, null, 2, null, 0, null, null, null,
      0, 0, null, 4, null, 5, null, 4,
      2, null, 0, null, null, null, null, null,
    ],
    bass: [0, 0, null, 0, -3, null, 0, null],
    perc: [1, 0, 0, 2, 1, 0, 3, 0],
    voices: { melody: chipLead, bass: deepBass },
    volume: 0.55,
  },

  harbor: {
    bpm: 118,
    root: 62, // D
    scale: 'major',
    stepsPerBar: 8,
    progression: [0, 4, 5, 3],
    melody: [
      4, null, 2, 0, null, 2, 4, null,
      5, 4, 2, null, 4, null, null, null,
      2, 4, 5, 7, null, 5, 4, null,
      2, null, 0, 2, 4, null, null, null,
    ],
    bass: [0, null, 4, 0, 2, null, 4, null],
    perc: [1, 2, 3, 2, 1, 2, 3, 2],
    voices: { melody: softLead, bass: warmBass },
    volume: 0.55,
  },

  lake: {
    bpm: 68,
    root: 59, // B
    scale: 'lydian',
    stepsPerBar: 8,
    progression: [0, 4, 2, 5],
    melody: [
      0, null, null, null, 4, null, null, 2,
      null, null, 5, null, 4, null, null, null,
      2, null, 4, null, null, 6, null, null,
      4, null, 2, null, 0, null, null, null,
    ],
    bass: [0, null, null, null, null, null, null, null],
    pad: true,
    voices: { melody: softLead, bass: warmBass, pad: airyPad },
    volume: 0.5,
  },

  shadow: {
    bpm: 72,
    root: 49, // C#
    scale: 'phrygian',
    stepsPerBar: 8,
    progression: [0, 1, 0, 6],
    melody: [
      0, null, 1, null, null, 0, null, null,
      -1, null, 0, null, null, null, null, null,
      3, null, 2, 1, null, 0, null, null,
      1, null, 0, null, -1, null, null, null,
    ],
    bass: [0, null, null, 0, null, null, 1, null],
    pad: true,
    voices: { melody: chipLead, bass: deepBass, pad: airyPad },
    volume: 0.5,
  },

  castle: {
    bpm: 88,
    root: 50, // D
    scale: 'minor',
    stepsPerBar: 8,
    progression: [0, 5, 3, 4],
    melody: [
      0, null, 4, null, 3, null, 2, null,
      4, null, 7, null, 5, null, 4, null,
      3, null, 2, null, 4, null, 3, null,
      2, null, 0, null, null, null, null, null,
    ],
    bass: [0, 0, null, 0, null, 0, -3, null],
    pad: true,
    perc: [1, 0, 0, 0, 3, 0, 0, 2],
    voices: { melody: softLead, bass: deepBass, pad: airyPad },
    volume: 0.55,
  },

  dungeon: {
    bpm: 84,
    root: 48, // C
    scale: 'minorPentatonic',
    stepsPerBar: 8,
    progression: [0, 0, 3, 2],
    melody: [
      0, null, null, 2, null, null, 1, null,
      null, null, 3, null, 2, null, null, null,
      0, null, 1, null, null, 2, null, null,
      1, null, 0, null, null, null, null, null,
    ],
    bass: [0, null, null, null, 0, null, null, null],
    pad: true,
    voices: { melody: chipLead, bass: deepBass, pad: airyPad },
    volume: 0.45,
  },

  boss: {
    bpm: 148,
    root: 45, // A
    scale: 'phrygian',
    stepsPerBar: 8,
    progression: [0, 1, 0, 6],
    melody: [
      0, 0, 1, 0, 3, 0, 1, 0,
      2, 2, 1, 0, -1, 0, 1, 2,
      0, 0, 3, 0, 4, 0, 3, 0,
      2, 1, 0, 1, 2, 3, 4, null,
    ],
    bass: [0, 0, 0, 0, 0, 0, 0, 0],
    perc: [1, 2, 3, 2, 1, 2, 3, 2],
    voices: { melody: chipLead, bass: deepBass },
    volume: 0.55,
  },

  finale: {
    bpm: 132,
    root: 52, // E
    scale: 'minor',
    stepsPerBar: 8,
    progression: [0, 5, 3, 4],
    melody: [
      0, 2, 4, 5, 7, null, 5, 4,
      5, null, 4, 2, 4, null, null, null,
      7, null, 5, 4, 2, null, 4, null,
      0, 2, 4, 7, null, null, null, null,
    ],
    bass: [0, 0, 4, null, 2, 2, 4, null],
    pad: true,
    perc: [1, 2, 3, 2, 1, 2, 3, 2],
    voices: { melody: softLead, bass: deepBass, pad: airyPad },
    volume: 0.6,
  },

  sad: {
    bpm: 60,
    root: 57,
    scale: 'minor',
    stepsPerBar: 8,
    progression: [0, 5, 3, 4],
    melody: [
      4, null, null, 3, null, null, 2, null,
      null, null, 0, null, null, null, null, null,
      2, null, null, 0, null, null, -1, null,
      0, null, null, null, null, null, null, null,
    ],
    bass: [0, null, null, null, null, null, null, null],
    pad: true,
    voices: { melody: softLead, bass: warmBass, pad: airyPad },
    volume: 0.5,
  },

  victory: {
    bpm: 128,
    root: 60,
    scale: 'major',
    stepsPerBar: 8,
    progression: [0, 4, 0, 0],
    melody: [
      0, 2, 4, 7, null, 7, null, null,
      4, 7, 9, 11, null, null, null, null,
      0, 2, 4, 7, null, 7, null, null,
      7, null, null, null, null, null, null, null,
    ],
    bass: [0, null, 4, null, 0, null, 4, null],
    perc: [1, 2, 3, 2, 1, 2, 3, 2],
    voices: { melody: softLead, bass: warmBass },
    volume: 0.6,
  },

  credits: {
    bpm: 92,
    root: 60,
    scale: 'major',
    stepsPerBar: 8,
    progression: [0, 5, 3, 4],
    melody: [
      0, null, 2, 4, null, 5, 4, 2,
      0, null, 2, null, 4, null, null, null,
      5, null, 4, 2, null, 0, 2, null,
      4, null, 2, 0, null, null, null, null,
    ],
    bass: [0, null, 4, null, 2, null, 4, null],
    pad: true,
    voices: { melody: softLead, bass: warmBass, pad: airyPad },
    volume: 0.55,
  },
};

// ---------------------------------------------------------------------------
// Klangeffekte
// ---------------------------------------------------------------------------

export type SfxName =
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'attack'
  | 'hit'
  | 'hurt'
  | 'dodge'
  | 'block'
  | 'die'
  | 'enemyDie'
  | 'pickup'
  | 'coin'
  | 'chest'
  | 'heal'
  | 'ability'
  | 'switch'
  | 'gate'
  | 'puzzle'
  | 'save'
  | 'quest'
  | 'levelUp'
  | 'step'
  | 'splash'
  | 'text'
  | 'bossHit'
  | 'warn'
  | 'shadowStep'
  | 'jump'
  | 'purr';

// ---------------------------------------------------------------------------
// Der Audio-Dienst
// ---------------------------------------------------------------------------

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  reducedEffects: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = { master: 0.8, music: 0.6, sfx: 0.8, reducedEffects: false };

/** Wie weit im Voraus Noten eingeplant werden (Sekunden). */
const SCHEDULE_AHEAD = 0.28;
const SCHEDULER_INTERVAL_MS = 90;

class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private current: MusicTrackId | null = null;
  private trackDef: TrackDef | null = null;
  private nextStepTime = 0;
  private step = 0;
  private timer: number | null = null;
  private activeNodes = new Set<AudioNode>();

  settings: AudioSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      /* Einstellungen sind nicht kritisch - Standardwerte reichen. */
    }
  }

  saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignorieren */
    }
  }

  /** Muss aus einer Nutzergeste heraus aufgerufen werden. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
      this.createNoiseBuffer();
    } catch (err) {
      console.warn('[Audio] Kein AudioContext verfuegbar - das Spiel laeuft ohne Ton.', err);
      this.ctx = null;
    }
  }

  get isReady(): boolean {
    return this.ctx !== null;
  }

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const length = Math.floor(this.ctx.sampleRate * 0.6);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  }

  applyVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain) return;
    this.masterGain.gain.value = this.settings.master;
    this.musicGain.gain.value = this.settings.music;
    this.sfxGain.gain.value = this.settings.sfx;
  }

  setVolume(kind: 'master' | 'music' | 'sfx', value: number): void {
    this.settings[kind] = Math.max(0, Math.min(1, value));
    this.applyVolumes();
    this.saveSettings();
  }

  // -------------------------------------------------------------------------
  // Musik
  // -------------------------------------------------------------------------

  playMusic(track: MusicTrackId | null, fadeMs = 600): void {
    if (track === this.current) return;
    this.current = track;

    if (!this.ctx || !this.musicGain) return;

    // Sanfter Wechsel: kurz ausblenden, dann neu starten.
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + fadeMs / 2000);

    window.setTimeout(() => {
      this.stopScheduler();
      if (!track || !this.ctx || !this.musicGain) return;
      this.trackDef = TRACKS[track];
      this.step = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(0, t);
      this.musicGain.gain.linearRampToValueAtTime(this.settings.music, t + fadeMs / 1000);
      this.startScheduler();
    }, fadeMs / 2);
  }

  stopMusic(): void {
    this.playMusic(null);
  }

  private startScheduler(): void {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => this.scheduleAhead(), SCHEDULER_INTERVAL_MS);
    this.scheduleAhead();
  }

  private stopScheduler(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.trackDef = null;
  }

  private scheduleAhead(): void {
    const ctx = this.ctx;
    const def = this.trackDef;
    if (!ctx || !def || !this.musicGain) return;

    const stepDuration = 60 / def.bpm / (def.stepsPerBar / 4);
    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleStep(def, this.step, this.nextStepTime, stepDuration);
      this.step++;
      this.nextStepTime += stepDuration;
    }
  }

  private scheduleStep(def: TrackDef, step: number, time: number, stepDuration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;

    const totalSteps = def.melody.length;
    const localStep = step % totalSteps;
    const bar = Math.floor(localStep / def.stepsPerBar) % def.progression.length;
    const chordRoot = def.progression[bar]!;
    const stepInBar = localStep % def.stepsPerBar;

    // Melodie
    const melodyDegree = def.melody[localStep];
    if (melodyDegree !== null && melodyDegree !== undefined) {
      const note = degreeToMidi(def.root + 12, def.scale, chordRoot + melodyDegree);
      this.scheduleNote(note, time, stepDuration, def.voices.melody, def.volume);
    }

    // Bass
    const bassDegree = def.bass[stepInBar];
    if (bassDegree !== null && bassDegree !== undefined) {
      const note = degreeToMidi(def.root - 12, def.scale, chordRoot + bassDegree);
      this.scheduleNote(note, time, stepDuration * 1.6, def.voices.bass, def.volume);
    }

    // Flaechenklang: einmal je Takt der Dreiklang
    if (def.pad && def.voices.pad && stepInBar === 0) {
      const barDuration = stepDuration * def.stepsPerBar;
      for (const interval of [0, 2, 4]) {
        const note = degreeToMidi(def.root, def.scale, chordRoot + interval);
        this.scheduleNote(note, time, barDuration, def.voices.pad, def.volume * 0.8);
      }
    }

    // Perkussion
    if (def.perc && !this.settings.reducedEffects) {
      const hit = def.perc[stepInBar % def.perc.length];
      if (hit) this.schedulePerc(hit, time, def.volume);
    }
  }

  private scheduleNote(
    midi: number,
    time: number,
    duration: number,
    voice: TrackVoice,
    trackVolume: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = voice.wave;
    osc.frequency.value = midiToFreq(midi);
    if (voice.detune) osc.detune.value = voice.detune * 100;

    const peak = voice.gain * trackVolume;
    const sustainTime = duration * voice.sustain;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + voice.attack);
    gain.gain.setValueAtTime(Math.max(0.0002, peak), time + Math.max(voice.attack, sustainTime));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + sustainTime + voice.release);

    osc.connect(gain);
    gain.connect(this.musicGain);

    // Leichtes Vibrato macht die Melodie weniger mechanisch.
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (voice.vibrato && !this.settings.reducedEffects) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.value = 5.2;
      lfoGain.gain.value = voice.vibrato;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(time);
      lfo.stop(time + sustainTime + voice.release + 0.05);
    }

    osc.start(time);
    osc.stop(time + sustainTime + voice.release + 0.05);

    this.track(osc);
    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
      lfo?.disconnect();
      lfoGain?.disconnect();
      this.activeNodes.delete(osc);
    };
  }

  private schedulePerc(kind: number, time: number, trackVolume: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || !this.noiseBuffer) return;

    if (kind === 1) {
      // Kick: schnell fallender Sinus
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.11);
      gain.gain.setValueAtTime(0.5 * trackVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.18);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } else {
      // Hihat und Snare aus gefiltertem Rauschen
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.value = kind === 2 ? 7000 : 1800;
      const length = kind === 2 ? 0.045 : 0.13;
      gain.gain.setValueAtTime((kind === 2 ? 0.14 : 0.26) * trackVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      source.start(time);
      source.stop(time + length + 0.02);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }

  private track(node: AudioNode): void {
    this.activeNodes.add(node);
    // Schutz gegen unbegrenztes Wachstum, falls onended nicht feuert.
    if (this.activeNodes.size > 240) {
      this.activeNodes.clear();
    }
  }

  // -------------------------------------------------------------------------
  // Klangeffekte
  // -------------------------------------------------------------------------

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    switch (name) {
      case 'select':
        this.blip(t, 880, 0.05, 'square', 0.12);
        break;
      case 'confirm':
        this.blip(t, 660, 0.06, 'square', 0.16);
        this.blip(t + 0.06, 990, 0.09, 'square', 0.16);
        break;
      case 'cancel':
        this.blip(t, 440, 0.06, 'square', 0.14);
        this.blip(t + 0.05, 300, 0.1, 'square', 0.14);
        break;
      case 'text':
        this.blip(t, 1400 + Math.random() * 300, 0.018, 'square', 0.045);
        break;

      case 'attack':
        this.swoosh(t, 0.13, 2400, 700, 0.2);
        break;
      case 'hit':
        this.noiseBurst(t, 0.09, 900, 0.3);
        this.sweep(t, 320, 120, 0.1, 'square', 0.16);
        break;
      case 'bossHit':
        this.noiseBurst(t, 0.14, 500, 0.34);
        this.sweep(t, 200, 70, 0.16, 'sawtooth', 0.2);
        break;
      case 'hurt':
        this.sweep(t, 480, 160, 0.22, 'sawtooth', 0.24);
        this.noiseBurst(t, 0.1, 1200, 0.18);
        break;
      case 'block':
        this.blip(t, 260, 0.07, 'square', 0.2);
        this.noiseBurst(t, 0.06, 2600, 0.16);
        break;
      case 'dodge':
        this.swoosh(t, 0.16, 1600, 400, 0.14);
        break;
      case 'jump':
        this.sweep(t, 420, 900, 0.14, 'square', 0.14);
        break;
      case 'shadowStep':
        this.sweep(t, 700, 180, 0.3, 'sine', 0.2);
        this.noiseBurst(t, 0.24, 400, 0.1);
        break;

      case 'die':
        this.sweep(t, 400, 80, 0.7, 'sawtooth', 0.26);
        this.blip(t + 0.2, 220, 0.3, 'triangle', 0.2);
        break;
      case 'enemyDie':
        this.sweep(t, 600, 120, 0.28, 'square', 0.2);
        this.noiseBurst(t, 0.18, 800, 0.2);
        break;

      case 'pickup':
        this.blip(t, 880, 0.05, 'triangle', 0.18);
        this.blip(t + 0.05, 1320, 0.09, 'triangle', 0.18);
        break;
      case 'coin':
        this.blip(t, 1180, 0.04, 'square', 0.14);
        this.blip(t + 0.04, 1760, 0.1, 'square', 0.14);
        break;
      case 'chest':
        this.noiseBurst(t, 0.12, 1400, 0.16);
        this.blip(t + 0.1, 660, 0.08, 'triangle', 0.18);
        this.blip(t + 0.18, 880, 0.08, 'triangle', 0.18);
        this.blip(t + 0.26, 1320, 0.16, 'triangle', 0.18);
        break;
      case 'heal':
        this.blip(t, 520, 0.1, 'sine', 0.2);
        this.blip(t + 0.08, 780, 0.12, 'sine', 0.2);
        this.blip(t + 0.16, 1040, 0.2, 'sine', 0.18);
        break;
      case 'ability':
        this.sweep(t, 300, 1200, 0.26, 'triangle', 0.2);
        this.noiseBurst(t + 0.05, 0.14, 2200, 0.1);
        break;
      case 'purr':
        this.sweep(t, 90, 70, 0.5, 'triangle', 0.14);
        break;

      case 'switch':
        this.blip(t, 520, 0.05, 'square', 0.2);
        this.blip(t + 0.05, 780, 0.06, 'square', 0.16);
        break;
      case 'gate':
        this.sweep(t, 140, 90, 0.6, 'sawtooth', 0.2);
        this.noiseBurst(t, 0.5, 300, 0.12);
        break;
      case 'puzzle':
        [660, 880, 1100, 1320].forEach((f, i) => this.blip(t + i * 0.09, f, 0.16, 'triangle', 0.18));
        break;
      case 'save':
        [880, 1100, 1320].forEach((f, i) => this.blip(t + i * 0.1, f, 0.22, 'sine', 0.16));
        break;
      case 'quest':
        [700, 900, 1200].forEach((f, i) => this.blip(t + i * 0.07, f, 0.14, 'square', 0.14));
        break;
      case 'levelUp':
        [523, 659, 784, 1047].forEach((f, i) => this.blip(t + i * 0.1, f, 0.26, 'triangle', 0.2));
        break;
      case 'warn':
        this.blip(t, 340, 0.12, 'square', 0.2);
        this.blip(t + 0.16, 340, 0.12, 'square', 0.2);
        break;

      case 'step':
        this.noiseBurst(t, 0.035, 1000, 0.05);
        break;
      case 'splash':
        this.noiseBurst(t, 0.2, 1600, 0.14);
        this.sweep(t, 800, 300, 0.2, 'sine', 0.1);
        break;
    }
  }

  private blip(time: number, freq: number, duration: number, wave: Wave, volume: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private sweep(
    time: number,
    from: number,
    to: number,
    duration: number,
    wave: Wave,
    volume: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private noiseBurst(time: number, duration: number, cutoff: number, volume: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(time);
    source.stop(time + duration + 0.02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private swoosh(time: number, duration: number, from: number, to: number, volume: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(from, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(time);
    source.stop(time + duration + 0.02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}

export const audio = new AudioSystem();

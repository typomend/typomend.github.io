// The sounds come from the Typomend intro film. Sound is on unless the viewer
// turned it off, and that choice is remembered across visits. Browsers only
// start audio after the viewer interacts with the page, so nothing plays
// until the first press, tap or key.

const VOLUME = {
  key_tap: 0.35,
  key_space: 0.4,
  tick_found: 0.6,
  chime_fix: 0.5,
  whoosh_soft: 0.5,
  whoosh_fast: 0.45,
  hit_word: 0.7,
  hit_stop: 0.7,
  reel_tick: 0.3,
  reel_stop: 0.6,
  clock_tick: 0.5,
  clock_tock: 0.5,
  paper_sweep: 0.6,
  logo_motif: 0.8,
  pop_soft: 0.5,
  click_ui: 0.5,
  swipe_up: 0.5,
} as const;

export type SoundName = keyof typeof VOLUME;

interface PlayOptions {
  volume?: number;
  rate?: number;
}

const STORAGE_KEY = "typomend:sound";

function remembered() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function remember(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage can be blocked; the choice then lasts for this visit only.
  }
}

let enabled = remembered();
let loading = false;
let context: AudioContext | null = null;
let lastTap = 0;
const buffers = new Map<SoundName, AudioBuffer>();
const elements = new Map<SoundName, HTMLAudioElement>();
const listeners = new Set<() => void>();

const url = (name: SoundName) => `${import.meta.env.BASE_URL}sfx/${name}.wav`;

function load() {
  if (loading) return;
  loading = true;
  context = new AudioContext();
  const ctx = context;
  for (const name of Object.keys(VOLUME) as SoundName[]) {
    fetch(url(name))
      .then((response) => {
        if (!response.ok) throw new Error(`${name}: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => buffers.set(name, buffer))
      .catch(() => {
        const audio = new Audio(url(name));
        audio.preload = "auto";
        elements.set(name, audio);
      });
  }
}

function play(name: SoundName, { volume = 1, rate = 1 }: PlayOptions = {}) {
  if (!enabled) return;
  const level = VOLUME[name] * volume;
  const buffer = buffers.get(name);
  if (buffer && context) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = context.createGain();
    gain.gain.value = level;
    source.connect(gain).connect(context.destination);
    source.start();
    return;
  }
  const element = elements.get(name);
  if (element) {
    const copy = element.cloneNode() as HTMLAudioElement;
    copy.volume = Math.min(1, level);
    copy.playbackRate = rate;
    copy.play().catch(() => undefined);
  }
}

/** A keystroke with a little variation in pitch and level, at most one every 45 ms. */
function tap(name: SoundName = "key_tap") {
  const now = performance.now();
  if (now - lastTap < 45) return;
  lastTap = now;
  play(name, {
    rate: 0.92 + Math.random() * 0.16,
    volume: 0.8 + Math.random() * 0.3,
  });
}

const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

/** Starts audio on the first gesture, if sound is on. */
function unlock() {
  if (!enabled) return;
  load();
  const ctx = context;
  if (!ctx) return;
  void ctx.resume().then(() => {
    GESTURES.forEach((g) => {
      window.removeEventListener(g, unlock);
    });
  });
}
GESTURES.forEach((g) => {
  window.addEventListener(g, unlock, { passive: true });
});

function setEnabled(on: boolean) {
  enabled = on;
  remember(on);
  if (on) {
    load();
    if (context?.state === "suspended") void context.resume();
  }
  listeners.forEach((listener) => {
    listener();
  });
}

export const sound = {
  play,
  tap,
  toggle: () => {
    setEnabled(!enabled);
  },
  isOn: () => enabled,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

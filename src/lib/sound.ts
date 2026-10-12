// The sounds come from the Typomend intro film. Sound is on unless the viewer
// turned it off with the switch in the top bar, a choice the browser keeps
// for later visits. Browsers start audio only after a click, a tap or a key
// press, so the sound begins with the viewer's first one; until then the
// switch shows a note.

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

/**
 * How late an effect may still start while its file is on the way, in ms.
 * Later than this it would no longer read as the answer to what caused it.
 */
const LATE = 300;

const STORAGE_KEY = "typomend:sound";

/** Sound is on unless the viewer turned it off on an earlier visit. */
function remembered() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function remember(on: boolean) {
  try {
    if (on) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, "off");
  } catch {
    // Storage can be blocked; the choice then lasts for this visit only.
  }
}

let enabled = remembered();
/** True once the browser has let the audio start. */
let live = false;
/** True while something else, such as the intro film, has the sound. */
let held = false;
let context: AudioContext | null = null;
/** True while the page scrolls fast; effects are skipped meanwhile. */
let rushing = false;
let lastTap = 0;
let downloads: Map<SoundName, Promise<ArrayBuffer | null>> | null = null;
const pending = new Map<SoundName, Promise<AudioBuffer | null>>();
const buffers = new Map<SoundName, AudioBuffer>();
const readyListeners = new Set<(ctx: AudioContext) => void>();
let ducker: (() => void) | null = null;
/** Accents the music steps back for, as a broadcast mix ducks under a voice. */
const DUCK = new Set<SoundName>([
  "chime_fix",
  "hit_word",
  "hit_stop",
  "logo_motif",
]);
const elements = new Map<SoundName, HTMLAudioElement>();
const listeners = new Set<() => void>();

const url = (name: SoundName) => `${import.meta.env.BASE_URL}sfx/${name}.wav`;

/** Starts downloading the effects ahead of need. */
function prefetch() {
  downloads ??= new Map(
    (Object.keys(VOLUME) as SoundName[]).map((name) => [
      name,
      fetch(url(name))
        .then((response) => {
          if (!response.ok) throw new Error(`${name}: ${response.status}`);
          return response.arrayBuffer();
        })
        .catch(() => null),
    ]),
  );
  return downloads;
}

function load() {
  if (context) return;
  context = new AudioContext();
  const ctx = context;
  for (const [name, download] of prefetch()) {
    const decoded = download
      .then((data) => {
        if (!data) throw new Error(`${name}: not downloaded`);
        return ctx.decodeAudioData(data);
      })
      .then((buffer) => {
        buffers.set(name, buffer);
        return buffer;
      })
      .catch(() => {
        const audio = new Audio(url(name));
        audio.preload = "auto";
        elements.set(name, audio);
        return null;
      });
    pending.set(name, decoded);
  }
}

function start(buffer: AudioBuffer, level: number, rate: number) {
  const ctx = context;
  if (!ctx) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = level;
  source.connect(gain).connect(ctx.destination);
  source.start();
}

function play(name: SoundName, { volume = 1, rate = 1 }: PlayOptions = {}) {
  // A held context is suspended, and sounds started on it would all go off
  // together when it resumes. While the page scrolls fast, only the music
  // plays.
  if (!enabled || held || rushing) return;
  if (DUCK.has(name)) ducker?.();
  const level = VOLUME[name] * volume;
  const buffer = buffers.get(name);
  if (buffer) {
    start(buffer, level, rate);
    return;
  }
  const element = elements.get(name);
  if (element) {
    const copy = element.cloneNode() as HTMLAudioElement;
    copy.volume = Math.min(1, level);
    copy.playbackRate = rate;
    copy.play().catch(() => undefined);
    return;
  }
  // The file is still on its way, as for the click that turns sound on: it
  // plays if it arrives soon enough to still answer that click.
  const asked = performance.now();
  void pending.get(name)?.then((late) => {
    if (late && enabled && !held && performance.now() - asked < LATE)
      start(late, level, rate);
  });
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

/**
 * Browsers let a page start audio only after a click, a tap or a key press;
 * scrolling and moving the pointer do not count. Every such gesture tries to
 * start the audio until it runs, because some browsers accept a tap only
 * when the finger lifts.
 */
const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

/** Resumes the audio context and tells whoever waits for it, the music. */
function wake() {
  const ctx = context;
  if (!ctx || held) return;
  void ctx.resume().then(() => {
    if (ctx.state !== "running") return;
    GESTURES.forEach((g) => {
      window.removeEventListener(g, unlock);
    });
    if (!live) {
      live = true;
      notify();
    }
    readyListeners.forEach((listener) => {
      listener(ctx);
    });
  });
}

/** Starts audio on a gesture, if sound is on. */
function unlock() {
  if (!enabled) return;
  load();
  wake();
}

function settle() {
  const ctx = context;
  if (!ctx) return;
  if (document.hidden || held) void ctx.suspend();
  else if (enabled) void ctx.resume();
}

function notify() {
  listeners.forEach((listener) => {
    listener();
  });
}

function setEnabled(on: boolean) {
  enabled = on;
  remember(on);
  if (on) {
    load();
    wake();
  }
  notify();
}

// Nothing here runs while the pages are rendered to HTML at build time.
if (typeof window !== "undefined") {
  GESTURES.forEach((g) => {
    window.addEventListener(g, unlock, { passive: true });
  });
  // Nothing plays while the tab is in the background.
  document.addEventListener("visibilitychange", settle);
  // With sound on, the effects download once the page has loaded and
  // settled, so they do not hold up the first paint and the first click is
  // still answered at once. A visitor who asked the browser to save data
  // downloads them only when the sound starts.
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData === true;
  if (enabled && !saveData) {
    const later = () => window.setTimeout(prefetch, 1200);
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
  }
}

export const sound = {
  play,
  tap,
  toggle: () => {
    // Before the audio has started, a press on the switch starts it rather
    // than turning sound off.
    if (enabled && !live) {
      unlock();
      return;
    }
    setEnabled(!enabled);
  },
  isOn: () => enabled,
  /** True while sound is on but the browser still waits for a gesture. */
  isWaiting: () => enabled && !live,
  /**
   * What the HTML written at build time shows: sound on, waiting for the
   * first gesture. A viewer who turned sound off sees the switch change once
   * the page starts.
   */
  isOnAtBuild: () => true,
  isWaitingAtBuild: () => true,
  /** Pauses the site's sound while true, for example during the intro film. */
  hold: (on: boolean) => {
    held = on;
    settle();
  },
  /** Skips effects while true, for fast scrolling. */
  setRushing: (on: boolean) => {
    rushing = on;
  },
  /** Calls back with the audio context once it is running. */
  onReady: (listener: (ctx: AudioContext) => void) => {
    readyListeners.add(listener);
    if (context?.state === "running") listener(context);
    return () => {
      readyListeners.delete(listener);
    };
  },
  /** Registers what to do when an accent wants the music out of the way. */
  setDucker: (fn: (() => void) | null) => {
    ducker = fn;
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

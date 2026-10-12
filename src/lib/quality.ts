// How much visual effect this device can carry. At "full" everything is
// drawn. At "lite" the effects that cost the most on a weak phone go: blurred
// glass turns solid, the glass stops refracting, the first screen's
// transitions lose their blur, the big soft glow goes, wheel scrolling is no
// longer smoothed and the marquee no longer leans. The layout, the story and
// every movement stay the same.
//
// The level starts from what the device reports about itself, the way
// Chrome's team and Facebook group devices for adaptive loading. It drops to
// lite for the rest of the visit if the page then struggles: when the frame
// rate while scrolling stays low, after the pattern of pmndrs'
// PerformanceMonitor, or when the system reports serious CPU pressure through
// the Compute Pressure API. It never climbs back, so it cannot flip back and
// forth.

import { BROWSER } from "./motion";

export type Quality = "full" | "lite";

const STORAGE_KEY = "typomend:quality";

/** A level chosen by hand, from `?quality=lite` or localStorage, for testing. */
function chosen(): Quality | null {
  try {
    const value =
      new URLSearchParams(location.search).get("quality") ??
      localStorage.getItem(STORAGE_KEY);
    return value === "full" || value === "lite" ? value : null;
  } catch {
    return null;
  }
}

/**
 * What the device says about itself. Chrome reports memory in GB, rounded
 * and capped at 8; Safari and Firefox report none, so those devices start at
 * full and rely on the frame rate.
 */
function fromDevice(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory ?? 8;
  if (cores <= 2 || memory <= 2) return "lite";
  if (cores <= 4 && memory <= 4) return "lite";
  return "full";
}

const fixed = BROWSER ? chosen() : null;
let level: Quality = BROWSER ? (fixed ?? fromDevice()) : "full";
const listeners = new Set<(level: Quality) => void>();

function apply() {
  document.documentElement.dataset.quality = level;
}

function lower(reason: string) {
  if (level === "lite" || fixed) return;
  level = "lite";
  apply();
  console.info(`Typomend: lighter effects for this device (${reason}).`);
  listeners.forEach((listener) => {
    listener(level);
  });
}

// Set before the first frame the scripts draw, so a weak device never pays
// for the full effects.
if (BROWSER) apply();

export const quality = {
  get: () => level,
  isFull: () => level === "full",
  /** Calls back when the level drops. Returns a function that stops listening. */
  onChange: (listener: (level: Quality) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Frames per second below which a stretch of scrolling counts as slow. */
const SLOW_FPS = 45;
/** Each sample averages this long a stretch of scrolling, in ms. */
const SAMPLE_MS = 250;
/** The level drops when this share of the last samples were slow. */
const SAMPLES = 12;
const SHARE = 0.75;
/** Scrolling counts as ongoing for this long after the last scroll event, in ms. */
const SETTLE_MS = 200;

/**
 * Watches the frame rate, only while the page scrolls, since that is when
 * the scenes do their work and when a dropped frame shows.
 */
function watchFrames() {
  const samples: boolean[] = [];
  let frame = 0;
  let lastScroll = 0;
  let windowStart = 0;
  let frames = 0;
  let previous = 0;

  const tick = (now: number) => {
    frame = 0;
    if (now - lastScroll > SETTLE_MS) {
      windowStart = 0;
      return;
    }
    if (!windowStart) {
      windowStart = now;
      frames = 0;
    } else if (now - previous < 1000) {
      frames += 1;
    }
    previous = now;
    const span = now - windowStart;
    if (span >= SAMPLE_MS) {
      samples.push((frames * 1000) / span < SLOW_FPS);
      if (samples.length > SAMPLES) samples.shift();
      windowStart = now;
      frames = 0;
      const slow = samples.filter(Boolean).length;
      if (samples.length === SAMPLES && slow >= SAMPLES * SHARE) {
        lower(
          `${Math.round((slow / SAMPLES) * 100)}% of scrolling below ${SLOW_FPS} fps`,
        );
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    lastScroll = performance.now();
    if (!frame && level === "full") frame = requestAnimationFrame(tick);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
  };
}

/** The parts of the Compute Pressure API used here, which TypeScript does not describe yet. */
interface PressureRecord {
  state: "nominal" | "fair" | "serious" | "critical";
}
interface PressureObserverLike {
  observe(source: "cpu", options?: { sampleInterval?: number }): Promise<void>;
  disconnect(): void;
}
type PressureObserverClass = new (
  callback: (records: PressureRecord[]) => void,
) => PressureObserverLike;

/**
 * Watches the system's CPU pressure where the browser reports it. One busy
 * moment is normal while the page starts, so the level drops only when two
 * readings in a row are serious or worse.
 */
function watchPressure() {
  const Observer = (
    window as Window & { PressureObserver?: PressureObserverClass }
  ).PressureObserver;
  if (!Observer) return () => undefined;
  let strained = 0;
  const observer = new Observer((records) => {
    for (const record of records) {
      strained =
        record.state === "serious" || record.state === "critical"
          ? strained + 1
          : 0;
      if (strained >= 2) lower(`CPU pressure ${record.state}`);
    }
  });
  observer.observe("cpu", { sampleInterval: 2000 }).catch(() => undefined);
  return () => {
    observer.disconnect();
  };
}

/** Starts watching how the page runs. Returns a function that stops watching. */
export function startQuality() {
  if (fixed || level === "lite") return () => undefined;
  const stops = [watchFrames(), watchPressure()];
  const stopOnLite = quality.onChange(() => {
    stops.forEach((stop) => {
      stop();
    });
  });
  return () => {
    stopOnLite();
    stops.forEach((stop) => {
      stop();
    });
  };
}

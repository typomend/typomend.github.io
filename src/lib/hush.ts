// Effects are skipped while the page scrolls fast, and only the music plays:
// rushed through, the cues of several scenes go off together and turn into
// noise. The speed is read in screen heights per second. Measured with the
// smooth scrolling on, a steady wheel runs at about 0.5, quick bursts of
// notches reach 1.6, and a flick, a drag of the scrollbar or a jump from the
// menu goes past 4.

import { sound } from "./sound";

/** Above this speed, in screen heights per second, effects are skipped. */
const RUSH = 2.5;
/** Effects return once the speed falls below this. */
const CALM = 1.5;
/**
 * Time constants of the speed reading, in seconds. It settles more slowly
 * than it rises, because scrubbed timelines keep playing for a moment after
 * the page stops.
 */
const RISE = 0.12;
const SETTLE = 0.3;

/** Starts following the scrolling speed. Returns a cleanup function. */
export function startHush() {
  const root = document.documentElement;
  let frame = 0;
  let lastY = window.scrollY;
  let lastTime = 0;
  let speed = 0;
  let rushing = false;

  const report = (on: boolean) => {
    rushing = on;
    sound.setRushing(on);
    root.dataset.effects = on ? "skip" : "play";
  };

  const step = (now: number) => {
    const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const y = window.scrollY;
    const v = Math.abs(y - lastY) / window.innerHeight / dt;
    lastY = y;
    speed += (v - speed) * (1 - Math.exp(-dt / (v > speed ? RISE : SETTLE)));
    if (!rushing && speed > RUSH) report(true);
    else if (rushing && speed < CALM) report(false);
    if (speed < 0.01 && !rushing) {
      speed = 0;
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(step);
  };

  const wake = () => {
    if (frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(step);
  };

  report(false);
  window.addEventListener("scroll", wake, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", wake);
  };
}

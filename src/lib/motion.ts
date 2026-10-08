import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

/** False when the viewer asked for reduced motion; every section then renders its final state. */
export const MOTION = document.documentElement.classList.contains("motion");

let ready = false;
window.addEventListener("load", () => {
  window.setTimeout(() => {
    ready = true;
  }, 600);
});

/** Scroll-driven sounds stay quiet until the page has settled, so restoring a scroll position is silent. */
export const isReady = () => ready;

export const vh = (n: number) => (window.innerHeight * n) / 100;

export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Missing ${what}`);
  }
  return value;
}

/** A scrubbed timeline that pins the section's `.stage` for `lengthVh` of scrolling. */
export function pinnedTimeline(
  section: HTMLElement,
  lengthVh: number,
  id?: string,
) {
  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id,
      trigger: section,
      start: "top top",
      end: () => `+=${vh(lengthVh)}`,
      pin: must(section.querySelector<HTMLElement>(".stage"), "stage"),
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

export function isForward(tl: gsap.core.Timeline) {
  return ready && (tl.scrollTrigger?.direction ?? 1) > 0;
}

/** Runs `fn` when the playhead passes `at` while the viewer scrolls down. */
export function cue(tl: gsap.core.Timeline, at: number, fn: () => void) {
  tl.call(
    () => {
      if (isForward(tl)) fn();
    },
    undefined,
    at,
  );
}

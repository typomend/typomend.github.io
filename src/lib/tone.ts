import { BROWSER, ScrollTrigger } from "./motion";

export type Tone = "light" | "dark";

// Where each section and the footer sit in the document. The top bar, the
// timeline and the music ask which section is on screen on every scroll
// frame. Reading positions from the layout each time would make the browser
// lay the page out again whenever something earlier in the frame changed a
// style, so they are measured once and measured again only when they can
// have moved: when ScrollTrigger refreshes its pins, when the window resizes
// and when the page changes height, as it does while someone types in the
// try-it pad.

interface Range {
  el: HTMLElement;
  top: number;
  bottom: number;
}

let ranges: Range[] = [];
let footTop = Infinity;
let maxScroll = 1;
let stale = true;
let watching = false;

function invalidate() {
  stale = true;
}

function measure() {
  if (!watching) {
    watching = true;
    ScrollTrigger.addEventListener("refresh", invalidate);
    window.addEventListener("resize", invalidate);
    const main = document.querySelector("main");
    if (main) new ResizeObserver(invalidate).observe(main);
  }
  const y = window.scrollY;
  ranges = [...document.querySelectorAll<HTMLElement>("main > section")].map(
    (el) => {
      const rect = el.getBoundingClientRect();
      return { el, top: rect.top + y, bottom: rect.bottom + y };
    },
  );
  const foot = document.querySelector(".foot");
  footTop = foot ? foot.getBoundingClientRect().top + y : Infinity;
  maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  stale = false;
}

function current() {
  if (BROWSER && stale) measure();
  return ranges;
}

/**
 * The section showing at viewport height `y`. Later sections win, because a
 * section that scrolls over a pinned one sits on top of it.
 */
export function sectionAt(y: number) {
  const list = current();
  const at = window.scrollY + y;
  for (let i = list.length - 1; i >= 0; i--) {
    const range = list[i];
    if (range && range.top <= at && range.bottom > at) return range.el;
  }
  return null;
}

export function toneAt(y: number): Tone {
  return sectionAt(y)?.dataset.tone === "dark" ? "dark" : "light";
}

/** True once the footer has come into view. */
export function footInView() {
  current();
  return footTop - window.scrollY < window.innerHeight;
}

/** How far the page scrolls, in px. */
export function scrollRange() {
  current();
  return maxScroll;
}

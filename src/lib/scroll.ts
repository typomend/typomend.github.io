import Lenis from "lenis";
import type { MouseEvent } from "react";
import { gsap, MOTION, ScrollTrigger } from "./motion";
import { quality } from "./quality";

let lenis: Lenis | null = null;

/**
 * Weighted smooth scrolling, kept in step with ScrollTrigger. Touch scrolling
 * stays native either way. At lite quality the wheel scrolls natively too,
 * since smoothing it means one more pass over the page on every frame.
 * Returns a cleanup function.
 */
export function startSmoothScroll() {
  if (!MOTION || !quality.isFull()) return () => undefined;
  const instance = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis = instance;
  instance.on("scroll", () => {
    ScrollTrigger.update();
  });
  const tick = (time: number) => {
    instance.raf(time * 1000);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const stop = () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
  const stopOnLite = quality.onChange(stop);
  return () => {
    stopOnLite();
    stop();
  };
}

/** Stops and restarts the page's scrolling, for a dialog on top of it. */
export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
}

export function scrollToY(y: number) {
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.6 });
  } else {
    window.scrollTo({ top: y, behavior: MOTION ? "smooth" : "auto" });
  }
}

export function scrollToTarget(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY);
}

/** Click handler for in-page links, so they scroll with the same easing as the wheel. */
export function jump(event: MouseEvent<HTMLAnchorElement>) {
  const href = event.currentTarget.getAttribute("href");
  if (!href?.startsWith("#")) return;
  event.preventDefault();
  scrollToTarget(href === "#top" ? "#hero" : href);
}

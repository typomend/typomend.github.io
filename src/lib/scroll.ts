import Lenis from "lenis";
import type { MouseEvent } from "react";
import { gsap, MOTION, ScrollTrigger } from "./motion";

let lenis: Lenis | null = null;

/** Weighted smooth scrolling, kept in step with ScrollTrigger. Returns a cleanup function. */
export function startSmoothScroll() {
  if (!MOTION) return () => undefined;
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
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    lenis = null;
  };
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

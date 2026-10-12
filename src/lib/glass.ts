// Liquid Glass controls with a reveal light.
//
// Apple describes the material's feedback this way: "the material
// illuminates from within ... Starting right under your fingertips, the glow
// spreads throughout the element and onto any Liquid Glass elements nearby",
// and its highlights "move in space, causing light to travel around the
// material, defining its silhouette" (Meet Liquid Glass, WWDC25). This module
// only tracks the pointer and marks which glass is near it; the material and
// the light are drawn in CSS.

import { quality } from "./quality";

export const GLASS_SELECTOR = ".glass";

/** How close the pointer must be for a control's rim to catch the light, in px. */
const REACH = 110;
/** How long the glow lingers on the glass around a pressed control, in ms. */
const ECHO_MS = 450;

function distanceToRect(x: number, y: number, r: DOMRect) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * True where the browser can bend the backdrop with an SVG filter. Only
 * Chromium does; elsewhere the glass stays frosted without refraction. The
 * filter is redrawn for every glass control on every frame the page moves
 * under it, which a phone pays for dearly, so it is kept to computers with a
 * mouse and to full quality.
 */
function canRefract() {
  return (
    quality.isFull() &&
    matchMedia(FINE_POINTER).matches &&
    "userAgentData" in navigator &&
    CSS.supports("backdrop-filter", "url(#glass-lens)")
  );
}

/** Starts the pointer light on every glass control. Returns a cleanup function. */
export function startGlass() {
  const root = document.documentElement;
  if (canRefract()) root.classList.add("glass-lens");
  const stopLens = quality.onChange(() => {
    root.classList.remove("glass-lens");
  });
  if (!matchMedia(FINE_POINTER).matches) {
    return stopLens;
  }

  let x = -1000;
  let y = -1000;
  let frame = 0;
  const echoes = new Map<HTMLElement, number>();

  const update = () => {
    frame = 0;
    const all = [...document.querySelectorAll<HTMLElement>(GLASS_SELECTOR)];
    // With the pointer off the page nothing is near, and nothing needs measuring.
    if (x < -999) {
      all.forEach((el) => {
        if (el.dataset.near !== undefined) delete el.dataset.near;
      });
      return;
    }
    // Every position is read before any style is written; reading after a
    // write would make the browser lay the page out again for each control.
    const rects = all.map((el) => el.getBoundingClientRect());
    all.forEach((el, i) => {
      const r = rects[i];
      if (r && distanceToRect(x, y, r) <= REACH) {
        el.style.setProperty("--lx", `${x - r.left}px`);
        el.style.setProperty("--ly", `${y - r.top}px`);
        el.dataset.near = "";
      } else if (el.dataset.near !== undefined) {
        delete el.dataset.near;
      }
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    x = event.clientX;
    y = event.clientY;
    schedule();
  };
  const leave = () => {
    x = -1000;
    y = -1000;
    schedule();
  };
  // Pressing one control sends a brief glow onto the glass around it.
  const press = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pressed = target.closest<HTMLElement>(GLASS_SELECTOR);
    if (!pressed) return;
    document
      .querySelectorAll<HTMLElement>(`${GLASS_SELECTOR}[data-near]`)
      .forEach((el) => {
        if (el === pressed) return;
        window.clearTimeout(echoes.get(el));
        el.dataset.echo = "";
        echoes.set(
          el,
          window.setTimeout(() => {
            delete el.dataset.echo;
            echoes.delete(el);
          }, ECHO_MS),
        );
      });
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerdown", press, { passive: true });
  window.addEventListener("scroll", schedule, { passive: true });
  root.addEventListener("mouseleave", leave);
  return () => {
    stopLens();
    cancelAnimationFrame(frame);
    echoes.forEach((timer) => {
      window.clearTimeout(timer);
    });
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerdown", press);
    window.removeEventListener("scroll", schedule);
    root.removeEventListener("mouseleave", leave);
  };
}

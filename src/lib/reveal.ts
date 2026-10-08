// Reveal light, after Fluent Design's Reveal Highlight: a light that follows
// the pointer lights the edges of the buttons near it, and the face of the
// one under it.

export const REVEAL_SELECTOR =
  ".btn, .hud-download, .hud-icon, .chip, .hud-nav a";

/** Starts the pointer light. Returns a cleanup function. */
export function startRevealLight() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return () => undefined;
  }
  const root = document.documentElement;
  let x = -1000;
  let y = -1000;
  let frame = 0;

  const update = () => {
    frame = 0;
    document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -160 || r.top > window.innerHeight + 160) return;
      el.style.setProperty("--rx", `${x - r.left}px`);
      el.style.setProperty("--ry", `${y - r.top}px`);
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    x = event.clientX;
    y = event.clientY;
    root.dataset.reveal = "on";
    schedule();
  };
  const leave = () => {
    root.dataset.reveal = "off";
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("scroll", schedule, { passive: true });
  root.addEventListener("mouseleave", leave);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("scroll", schedule);
    root.removeEventListener("mouseleave", leave);
  };
}

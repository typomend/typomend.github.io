import { useRef, useState } from "react";
import { gsap, MOTION, must, ScrollTrigger, useGSAP } from "../lib/motion";
import { createRenderer, playTape, Tape } from "../lib/tape";

function heroTape() {
  return new Tape()
    .type("明天")
    .commit()
    .type("我")
    .commit()
    .type("因該")
    .commit()
    .hold(1)
    .type("會準時到")
    .commit()
    .type("。")
    .commit()
    .hold(3)
    .mend("因該", "應該");
}

/** S1 Hook: the sentence types itself and the typo is mended in place. */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const [badge, setBadge] = useState(!MOTION);
  const replay = useRef<() => void>(() => undefined);

  useGSAP(
    () => {
      const root = must(section.current, "hero");
      const el = must(line.current, "hero line");
      const tape = heroTape();
      const renderer = createRenderer(el);
      const fixAt = tape.find("fix");
      let stop: () => void = () => undefined;
      let again = 0;

      // The demo loops like a product film, but only while the first screen is in view.
      const loop = () => {
        if (window.scrollY < window.innerHeight * 0.4) play();
        else again = window.setTimeout(loop, 1000);
      };
      const play = () => {
        stop();
        window.clearTimeout(again);
        stop = playTape(tape, renderer, (i) => {
          if (i === fixAt) setBadge(true);
          if (i === tape.last) again = window.setTimeout(loop, 4200);
        });
      };
      replay.current = play;

      const last = tape.frames[tape.last];
      if (!MOTION) {
        if (last) renderer.draw(last);
        renderer.caret(false);
        return;
      }

      const start = window.setTimeout(play, 700);

      // The dark problem panel slides over the hero, which stays pinned and recedes.
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
      });
      gsap.to(".hero-inner", {
        scale: 0.92,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Cursor-reactive type: characters near the pointer grow heavier.
      const weight = (event: PointerEvent) => {
        el.querySelectorAll<HTMLElement>(".tk").forEach((tk) => {
          const r = tk.getBoundingClientRect();
          const d = Math.hypot(
            event.clientX - (r.left + r.width / 2),
            event.clientY - (r.top + r.height / 2),
          );
          tk.style.setProperty(
            "--w",
            String(Math.round(700 + 200 * Math.max(0, 1 - d / 320))),
          );
        });
      };
      root.addEventListener("pointermove", weight);

      return () => {
        window.clearTimeout(start);
        window.clearTimeout(again);
        stop();
        root.removeEventListener("pointermove", weight);
      };
    },
    { scope: section },
  );

  return (
    <section className="hero" id="hero" ref={section} data-tone="light">
      <div className="hero-inner">
        <button
          type="button"
          className="hero-line"
          aria-label="明天我因該會準時到。Typomend 把「因該」改成「應該」。按一下再打一次。"
          onClick={() => {
            replay.current();
          }}
        >
          <span ref={line} aria-hidden="true" />
        </button>
        <h1 className={`hero-tag${badge ? "" : " is-hidden"}`}>
          照常輸入，原地修正。
        </h1>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span className="cue-line" />
        往下捲動
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { exampleDeck, firstExample } from "../lib/examples";
import { gsap, MOTION, must, ScrollTrigger, useGSAP } from "../lib/motion";
import { createRenderer, playTape, type Tape } from "../lib/tape";

/** How long a mended sentence stays up before the next one, in ms. */
const READ_TIME = 2600;
const FADE_TIME = 450;

/** S1 Hook: sentences type themselves and their typos are mended in place, one after another. */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const [tagline, setTagline] = useState(!MOTION);
  const skip = useRef<() => void>(() => undefined);

  useGSAP(
    () => {
      const root = must(section.current, "hero");
      const el = must(line.current, "hero line");
      const btn = must(button.current, "hero button");
      const renderer = createRenderer(el);

      if (!MOTION) {
        const last = firstExample.frames[firstExample.last];
        if (last) renderer.draw(last);
        renderer.caret(false);
        return;
      }

      const next = exampleDeck();
      let stop: () => void = () => undefined;
      let timer = 0;
      let paused = false;

      const play = (tape: Tape) => {
        stop();
        btn.classList.remove("is-out");
        const fixAt = tape.find("fix");
        stop = playTape(tape, renderer, (i) => {
          if (i === fixAt) setTagline(true);
          if (i === tape.last) timer = window.setTimeout(advance, READ_TIME);
        });
      };
      // Fade the mended sentence out and type the next one.
      const advance = () => {
        window.clearTimeout(timer);
        if (paused) return;
        btn.classList.add("is-out");
        timer = window.setTimeout(() => {
          play(next());
        }, FADE_TIME);
      };
      // Scrolled off the first screen, the demo and its sounds stop at once;
      // back on it, a new sentence starts.
      const pause = () => {
        paused = true;
        window.clearTimeout(timer);
        stop();
      };
      const resume = () => {
        if (!paused) return;
        paused = false;
        advance();
      };
      skip.current = advance;
      timer = window.setTimeout(() => {
        play(next());
      }, 700);
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => `+=${window.innerHeight * 0.4}`,
        onLeave: pause,
        onEnterBack: resume,
      });

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
        window.clearTimeout(timer);
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
          ref={button}
          aria-label="示範：在你打字的同時，Typomend 把選錯的同音字原地改好。按一下換下一句。"
          onClick={() => {
            skip.current();
          }}
        >
          <span ref={line} aria-hidden="true" />
        </button>
        <h1 className={`hero-tag${tagline ? "" : " is-hidden"}`}>
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

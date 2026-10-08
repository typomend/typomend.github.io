import { useRef } from "react";
import { Lockup } from "../components/Lockup";
import {
  cue,
  gsap,
  MOTION,
  must,
  pinnedTimeline,
  useGSAP,
} from "../lib/motion";
import { sound } from "../lib/sound";

const LETTERS = ["T", "y", "p", "o", "m", "e", "n", "d"].map(
  (l) => `#ma-letter-${l}`,
);

/** S3 Meet: a folded page sweeps the dark away and reveals the mark. */
export function Meet() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!MOTION) return;
      const root = must(section.current, "meet");
      root.dataset.tone = "dark";
      const tl = pinnedTimeline(root, 220);

      gsap.set(".sweep-band", { xPercent: -100 });
      gsap.set(["#ma-symbol", ...LETTERS, ".meet-logo .cap"], { autoAlpha: 0 });

      tl.to(".sweep-band", { xPercent: 0, duration: 1, ease: "power2.in" }, 0);
      tl.set(".meet-ink", { autoAlpha: 0 }, 1);
      tl.call(
        () => {
          root.dataset.tone =
            (tl.scrollTrigger?.direction ?? 1) > 0 ? "light" : "dark";
        },
        undefined,
        1,
      );
      tl.to(
        ".sweep-band",
        { xPercent: 100, duration: 1, ease: "power2.out" },
        1,
      );
      cue(tl, 0.2, () => {
        sound.play("paper_sweep");
      });

      tl.fromTo(
        "#ma-symbol",
        { autoAlpha: 0, scale: 0.6, transformOrigin: "50% 50%" },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" },
        1.4,
      );
      tl.fromTo(
        LETTERS,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.07,
          ease: "power3.out",
        },
        1.7,
      );
      tl.to(".meet-logo .cap", { autoAlpha: 1, duration: 0.4 }, 2.4);
      tl.from(".meet-logo .cap", { y: 24, duration: 0.4 }, 2.4);
      cue(tl, 1.4, () => {
        sound.play("pop_soft");
      });
      tl.to({}, { duration: 0.8 }, 2.8);
    },
    { scope: section },
  );

  return (
    <section className="meet" id="meet" ref={section} data-tone="light">
      <div className="stage">
        <div className="meet-ink" aria-hidden="true" />
        <div className="sweep" aria-hidden="true">
          <div className="sweep-band">
            <span className="sweep-fold" />
          </div>
        </div>
        <div className="meet-logo">
          <Lockup prefix="ma" />
          <h2 className="cap">
            錯字，就在原地修好。
            <span className="en">
              Typos, mended right where you typed them.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}

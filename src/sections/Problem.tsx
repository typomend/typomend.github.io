import { useRef } from "react";
import {
  cue,
  gsap,
  MOTION,
  must,
  pinnedTimeline,
  useGSAP,
} from "../lib/motion";
import { sound } from "../lib/sound";
import { graphemes } from "../lib/text";

const REEL_A = ["音", "陰", "應", "英", "因"];
const REEL_B = ["概", "蓋", "改", "該"];
const LAPS = 4;

const PAIRS: [string, string, number][] = [
  ["因該", "應該", 0],
  ["在見", "再見", 0],
  ["以經", "已經", 0],
  ["一但", "一旦", 1],
  ["既使", "即使", 0],
  ["由其", "尤其", 0],
  ["做業", "作業", 0],
  ["在一次", "再一次", 0],
];

function strip(chars: string[]) {
  const all = Array.from({ length: LAPS }, () => chars).flat();
  return all.map((ch, i) => <span key={i}>{ch}</span>);
}

/** S2 Problem: a slot reel stops on the wrong 因, the typo slams, the board flips. */
export function Problem() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!MOTION) return;
      const root = must(section.current, "problem");
      const tl = pinnedTimeline(root, 420);
      const lenA = REEL_A.length * LAPS;
      const lenB = REEL_B.length * LAPS;

      gsap.set([".slam-layer", ".board-layer"], { autoAlpha: 0 });
      gsap.set(".board li:not(:first-child)", { rotateX: -92, autoAlpha: 0 });

      // The right reel stops on 該 first; the left one passes the right 應 and lands on 因.
      tl.fromTo(
        "#reel-b .strip",
        { yPercent: 0 },
        {
          yPercent: (-(lenB - 1) / lenB) * 100,
          duration: 2.4,
          ease: "back.out(1.2)",
        },
        0,
      );
      tl.fromTo(
        "#reel-a .strip",
        { yPercent: 0 },
        {
          yPercent: (-(lenA - 1) / lenA) * 100,
          duration: 3,
          ease: "back.out(1.4)",
        },
        0,
      );
      for (let t = 0.1; t < 2.6; t += 0.18)
        cue(tl, t, () => {
          sound.play("reel_tick");
        });
      cue(tl, 2.4, () => {
        sound.play("reel_stop");
      });
      cue(tl, 3, () => {
        sound.play("reel_stop");
      });

      // Slam: 因該 fills the frame and the brackets close in; one corner is the brand fold.
      tl.to(".reel-layer", { autoAlpha: 0, scale: 1.3, duration: 0.3 }, 3.4);
      tl.set(".slam-layer", { autoAlpha: 1 }, 3.5);
      tl.from(".slam", { scale: 0.3, duration: 0.45, ease: "expo.out" }, 3.5);
      tl.from(
        ".c-tl",
        { x: -80, y: -80, autoAlpha: 0, duration: 0.4, ease: "power3.out" },
        3.7,
      );
      tl.from(
        ".c-tr",
        { x: 80, y: -80, autoAlpha: 0, duration: 0.4, ease: "power3.out" },
        3.7,
      );
      tl.from(
        ".c-bl",
        { x: -80, y: 80, autoAlpha: 0, duration: 0.4, ease: "power3.out" },
        3.7,
      );
      tl.from(
        ".c-br",
        { x: 80, y: 80, autoAlpha: 0, duration: 0.4, ease: "power3.out" },
        3.7,
      );
      tl.from(
        ".slam-bar",
        {
          scaleX: 0,
          transformOrigin: "0 50%",
          duration: 0.4,
          ease: "power3.out",
        },
        3.9,
      );
      tl.from(".slam-layer .cap", { y: 30, autoAlpha: 0, duration: 0.35 }, 4.1);
      cue(tl, 3.5, () => {
        sound.play("hit_word");
      });

      // The slammed word shrinks into the first square of the board, and the rest flip in.
      tl.to(".slam-layer .cap", { autoAlpha: 0, duration: 0.2 }, 5.2);
      tl.to(
        ".slam",
        {
          scale: 0.16,
          xPercent: -150,
          yPercent: -120,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.inOut",
        },
        5.3,
      );
      tl.to(".board-layer", { autoAlpha: 1, duration: 0.3 }, 5.6);
      tl.to(
        ".board li:not(:first-child)",
        {
          rotateX: 0,
          autoAlpha: 1,
          duration: 0.4,
          stagger: 0.16,
          ease: "back.out(1.6)",
        },
        5.8,
      );
      for (let i = 0; i < 7; i++)
        cue(tl, 5.8 + i * 0.16, () => {
          sound.play("reel_tick", { rate: 0.7 });
        });
      tl.from(".board-layer .cap", { y: 24, autoAlpha: 0, duration: 0.4 }, 7.1);
      tl.to({}, { duration: 0.8 }, 7.6);
    },
    { scope: section },
  );

  return (
    <section
      className="problem dark"
      id="problem"
      ref={section}
      data-tone="dark"
    >
      <div className="stage">
        <div className="grid-lines" aria-hidden="true" />

        <div className="layer reel-layer">
          <div className="reel" aria-hidden="true">
            <div className="reel-col" id="reel-a">
              <div className="strip">{strip(REEL_A)}</div>
            </div>
            <div className="reel-col" id="reel-b">
              <div className="strip">{strip(REEL_B)}</div>
            </div>
          </div>
          <p className="reel-note">
            打字很快，選錯字也很快。
            <span className="en">Typing is fast. So are typos.</span>
          </p>
        </div>

        <div className="layer slam-layer">
          <div className="slam">
            <span className="corner c-tl" />
            <span className="corner c-tr" />
            <span className="corner c-bl" />
            <span className="corner c-br" />
            <p className="slam-word">
              <span className="wrong">因</span>
              <span>該</span>
            </p>
            <span className="slam-bar" />
          </div>
          <h2 className="cap">
            音對了，字錯了。
            <span className="en">Right sound. Wrong character.</span>
          </h2>
        </div>

        <div className="layer board-layer">
          <ul className="board">
            {PAIRS.map(([wrong, right, at]) => (
              <li key={wrong}>
                <b>
                  {graphemes(wrong).map((ch, i) => (
                    <span key={i} className={i === at ? "wrong" : undefined}>
                      {ch}
                    </span>
                  ))}
                </b>
                <small>→ {right}</small>
              </li>
            ))}
          </ul>
          <h2 className="cap">
            同音字選錯，是打字最常見的錯誤。
            <span className="en">
              The wrong homophone is the most common typing mistake.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}

import { useRef } from "react";
import { GitHubMark } from "../components/GitHubMark";
import { Lockup } from "../components/Lockup";
import {
  cue,
  gsap,
  MOTION,
  must,
  pinnedTimeline,
  useGSAP,
} from "../lib/motion";
import { RELEASES_URL, REPO_URL } from "../lib/links";
import { jump } from "../lib/scroll";
import { sound } from "../lib/sound";

const BASE = import.meta.env.BASE_URL;
const LETTERS = ["T", "y", "p", "o", "m", "e", "n", "d"].map(
  (l) => `#fn-letter-${l}`,
);

/** S7 Finale: the T assembles, the fold flips once and lands, the wordmark rises. */
export function Finale() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!MOTION) return;
      const root = must(section.current, "finale");
      const tl = pinnedTimeline(root, 170);

      gsap.set(
        [
          "#fn-symbol-ink-top",
          "#fn-symbol-ink-stem",
          "#fn-fold-surfaces",
          ...LETTERS,
          ".finale-tag",
          ".finale-cta",
        ],
        {
          autoAlpha: 0,
        },
      );
      tl.fromTo(
        "#fn-symbol-ink-top",
        { autoAlpha: 0, x: -40 },
        { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out" },
        0,
      );
      tl.fromTo(
        "#fn-symbol-ink-stem",
        { autoAlpha: 0, scaleY: 0, transformOrigin: "50% 0%" },
        { autoAlpha: 1, scaleY: 1, duration: 0.4, ease: "power3.out" },
        0.3,
      );
      tl.fromTo(
        "#fn-fold-surfaces",
        { autoAlpha: 0, scaleX: -0.2, transformOrigin: "0% 50%" },
        { autoAlpha: 1, scaleX: 1, duration: 0.6, ease: "back.out(1.8)" },
        0.7,
      );
      cue(tl, 0.7, () => {
        sound.play("logo_motif");
      });
      tl.fromTo(
        LETTERS,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.06,
          ease: "power3.out",
        },
        1.3,
      );
      tl.fromTo(
        ".finale-tag",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        1.9,
      );
      tl.fromTo(
        ".finale-cta",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        2.2,
      );
      tl.to({}, { duration: 0.7 }, 2.6);
    },
    { scope: section },
  );

  return (
    <section className="finale" id="finale" ref={section} data-tone="light">
      <div className="stage">
        <div className="finale-logo">
          <Lockup prefix="fn" />
          <p className="finale-tag">
            照常輸入，原地修正。
            <span className="en">Keep typing. Mend in place.</span>
          </p>
          <div className="cta-row finale-cta">
            <a
              className="btn btn-primary glass glass-tint"
              href={RELEASES_URL}
              target="_blank"
              rel="noreferrer"
            >
              下載最新版本
            </a>
            <a
              className="btn btn-ghost glass"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              <GitHubMark />在 GitHub 查看
            </a>
          </div>
        </div>
      </div>
      <footer className="foot">
        <img
          src={`${BASE}logo/Typomend-lockup-color.svg`}
          alt="Typomend"
          width="120"
          height="27"
        />
        <p>網站的音效取自 Typomend 介紹影片。</p>
        <nav className="foot-links" aria-label="連結">
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">
            下載
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <GitHubMark size={14} />
            GitHub
          </a>
          <a href="#top" onClick={jump}>
            回到頂端 ↑
          </a>
        </nav>
      </footer>
    </section>
  );
}

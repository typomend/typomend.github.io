import { useRef } from "react";
import { gsap, MOTION, must, ScrollTrigger, useGSAP } from "../lib/motion";
import { quality } from "../lib/quality";

const ROW_A = [
  "記事本",
  "Chrome",
  "Edge",
  "檔案總管",
  "VS Code",
  "Terminal",
  "PowerShell",
  "Claude Code",
];
const ROW_B = [
  "LINE",
  "Word",
  "Teams",
  "Notion",
  "Outlook",
  "cmd",
  "Slack",
  "Discord",
];

/** The apps people type in, moving with the scroll and leaning into its speed. */
export function Apps() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!MOTION) return;
      const root = must(section.current, "apps");
      const range = {
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.4,
      };
      gsap.fromTo(
        "#mq-a",
        { xPercent: 0 },
        { xPercent: -28, ease: "none", scrollTrigger: range },
      );
      const back = gsap.fromTo(
        "#mq-b",
        { xPercent: -28 },
        { xPercent: 0, ease: "none", scrollTrigger: range },
      );
      // The rows lean into the scrolling speed. The lean is read every frame
      // only while the marquee is on screen, and set only when it changes,
      // so the rows are left alone the rest of the time.
      const skew = gsap.quickTo(".mq-row", "skewX", {
        duration: 0.5,
        ease: "power3.out",
      });
      const trigger = back.scrollTrigger;
      let lean = 0;
      const tick = () => {
        const v = trigger?.getVelocity() ?? 0;
        const next = Math.round(gsap.utils.clamp(-12, 12, v / -300) * 10) / 10;
        if (next === lean) return;
        lean = next;
        skew(next);
      };
      const stopTicking = () => {
        gsap.ticker.remove(tick);
        lean = 0;
        skew(0);
      };
      const watch = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive && quality.isFull()) gsap.ticker.add(tick);
          else stopTicking();
        },
      });
      // At lite quality the rows stay upright.
      const stopOnLite = quality.onChange(stopTicking);
      return () => {
        stopOnLite();
        watch.kill();
        gsap.ticker.remove(tick);
      };
    },
    { scope: section },
  );

  return (
    <section
      className="apps"
      id="apps"
      ref={section}
      data-tone="light"
      aria-labelledby="apps-title"
    >
      <h2 className="visually-hidden" id="apps-title">
        支援的程式
      </h2>
      <div className="marquee" aria-hidden="true">
        <div className="mq-row" id="mq-a">
          {[...ROW_A, ...ROW_A].map((name, i) => (
            <span key={i}>{name}</span>
          ))}
        </div>
        <div className="mq-row alt" id="mq-b">
          {[...ROW_B, ...ROW_B].map((name, i) => (
            <span key={i}>{name}</span>
          ))}
        </div>
      </div>
      <p className="apps-note">
        瀏覽器、記事本、VS Code、終端機，以及在終端機裡執行的 AI
        程式助理，都能修正。密碼欄位與以系統管理員身分執行的程式一律略過。
        <a className="more" href="/how-it-works/">
          看 Typomend 怎麼在任何程式裡修正
        </a>
      </p>
    </section>
  );
}

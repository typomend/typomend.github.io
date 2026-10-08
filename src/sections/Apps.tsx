import { useRef } from "react";
import { gsap, MOTION, must, useGSAP } from "../lib/motion";

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
      const skew = gsap.quickTo(".mq-row", "skewX", {
        duration: 0.5,
        ease: "power3.out",
      });
      const trigger = back.scrollTrigger;
      const tick = () => {
        const v = trigger?.getVelocity() ?? 0;
        skew(gsap.utils.clamp(-12, 12, v / -300));
      };
      gsap.ticker.add(tick);
      return () => {
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
        Typomend 透過 UI Automation 讀取目前的文字欄位，所以瀏覽器、記事本、VS
        Code、終端機，以及在終端機裡執行的 AI
        程式助理都能修正。密碼欄位與以系統管理員身分執行的程式一律略過。
      </p>
    </section>
  );
}

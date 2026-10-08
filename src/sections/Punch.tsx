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

const ROWS = [
  ["換一套更聰明的輸入法", "重新適應、重建詞庫，公司電腦還不一定准你安裝"],
  ["打完再校對", "複製、貼到檢查工具、看建議、再貼回去"],
  ["送出前按一個鍵檢查", "每次都要記得按，文字也常常要送到雲端 API"],
];

/** Thirteen keys down to none. */
export function Punch() {
  const section = useRef<HTMLElement>(null);
  const number = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!MOTION) return;
      const root = must(section.current, "punch");
      const n = must(number.current, "punch number");
      const tl = pinnedTimeline(root, 170);
      const proxy = { v: 13 };
      n.textContent = "13";

      gsap.set(".pl-b", { yPercent: 100, autoAlpha: 0 });
      tl.from(
        ".punch-num",
        { scale: 0.86, autoAlpha: 0, duration: 0.5, ease: "power3.out" },
        0,
      );
      tl.to(".pl-a", { yPercent: -100, autoAlpha: 0, duration: 0.3 }, 0.9);
      tl.to(".pl-b", { yPercent: 0, autoAlpha: 1, duration: 0.3 }, 0.9);
      tl.to(
        proxy,
        {
          v: 0,
          duration: 1.3,
          ease: "power2.in",
          onUpdate: () => {
            n.textContent = String(Math.round(proxy.v));
          },
        },
        0.9,
      );
      tl.fromTo(
        ".punch-num span",
        { color: "#93c5fd" },
        { color: "#ffffff", duration: 0.3 },
        2,
      );
      tl.from(".punch-sub", { y: 20, autoAlpha: 0, duration: 0.4 }, 2.2);
      cue(tl, 2.2, () => {
        sound.play("chime_fix");
      });
      tl.to({}, { duration: 0.6 }, 2.6);

      gsap.from(".compare tbody tr", {
        y: 24,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: ".compare", start: "top 75%" },
      });
    },
    { scope: section },
  );

  return (
    <section className="punch dark" id="punch" ref={section} data-tone="dark">
      <div className="stage">
        <div className="grid-lines" aria-hidden="true" />
        <div className="punch-inner">
          <p className="punch-label">
            <span className="pl-a">手動改一個字</span>
            <span className="pl-b">用 Typomend</span>
          </p>
          <p className="punch-num">
            <span ref={number}>0</span>
            <small>次按鍵</small>
          </p>
          <p className="punch-sub">你只要繼續打字，回頭看時錯字已經不見了。</p>
        </div>
      </div>
      <div className="compare">
        <h2>常見的解法，都要你改變習慣。</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">做法</th>
                <th scope="col">你要付出的代價</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([how, cost]) => (
                <tr key={how}>
                  <th scope="row">{how}</th>
                  <td>{cost}</td>
                </tr>
              ))}
              <tr className="us">
                <th scope="row">Typomend</th>
                <td>什麼都不用做。照常打字，回頭看時錯字已經不見了</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

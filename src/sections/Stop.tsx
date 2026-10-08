import { useRef } from "react";
import {
  cue,
  gsap,
  isForward,
  MOTION,
  must,
  pinnedTimeline,
  useGSAP,
  vh,
} from "../lib/motion";
import { sound } from "../lib/sound";
import { graphemes } from "../lib/text";

const SENTENCE = graphemes("明天我因該會準時到。");
const TYPO = 3;
const KEYS = [
  "←",
  "←",
  "←",
  "←",
  "←",
  "←",
  "Shift ←",
  "ㄧ",
  "ㄥ",
  "Space",
  "↓",
  "Enter",
  "End",
];
/** When each key lands, in seconds: 13 keys over 4.5 seconds. */
const AT = [0.2, 0.4, 0.6, 0.85, 1.05, 1.3, 1.8, 2.2, 2.5, 2.8, 3.5, 4.0, 4.5];
const CANDIDATES = ["英", "應", "鷹", "營", "影"];

/** The sentence after `k` keys of the manual fix. */
function state(k: number) {
  const chars = [...SENTENCE];
  let caret = SENTENCE.length - Math.min(k, 6);
  let select = false;
  let compose = false;
  let list = -1;
  if (k >= 7) {
    caret = TYPO;
    select = true;
  }
  if (k >= 8) {
    select = false;
    compose = true;
    chars[TYPO] = k >= 10 ? "英" : k >= 9 ? "ㄧㄥ" : "ㄧ";
    caret = TYPO + 1;
  }
  if (k >= 11) list = 1;
  if (k >= 12) {
    chars[TYPO] = "應";
    compose = false;
    list = -1;
  }
  if (k >= 13) caret = SENTENCE.length;
  return { chars, caret, select, compose, list };
}

function draw(line: HTMLElement, k: number) {
  const s = state(k);
  const parts = s.chars.map((ch, i) => {
    const span = document.createElement("span");
    span.className = "tk";
    if (i === TYPO && s.select) span.classList.add("s-k");
    if (i === TYPO && s.compose) span.classList.add("s-c");
    span.textContent = ch;
    return span;
  });
  const caret = document.createElement("span");
  caret.className = "caret hold";
  parts.splice(s.caret, 0, caret);
  line.replaceChildren(...parts);
  if (s.list >= 0) {
    const list = document.createElement("div");
    list.className = "cand";
    CANDIDATES.forEach((ch, i) => {
      const item = document.createElement("span");
      item.className = i === s.list ? "on" : "";
      const n = document.createElement("small");
      n.textContent = String(i + 1);
      item.append(n, ch);
      list.append(item);
    });
    const typo = parts[TYPO];
    if (typo) list.style.left = `${typo.offsetLeft}px`;
    line.append(list);
  }
}

/** S2 Stop: 要改它，就得停下來。Then thirteen keys, replayed one by one. */
export function Stop() {
  const section = useRef<HTMLElement>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const count = useRef<HTMLElement>(null);
  const clock = useRef<HTMLParagraphElement>(null);
  const keys = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const el = must(line.current, "manual line");
      const keyEls = [...must(keys.current, "keys").children];
      const countEl = must(count.current, "count");
      const clockEl = must(clock.current, "clock");
      let shown = -1;

      const render = (t: number, forward: boolean) => {
        const k = AT.filter((a) => a <= t).length;
        clockEl.textContent = `${Math.min(t, 4.5).toFixed(1)} 秒`;
        if (k === shown) return;
        if (forward && k > shown && shown >= 0) {
          sound.play(k % 2 ? "clock_tick" : "clock_tock");
          sound.tap();
        }
        shown = k;
        draw(el, k);
        countEl.textContent = String(k);
        keyEls.forEach((key, i) => {
          key.classList.toggle("on", i < k);
          key.classList.toggle("now", i === k - 1);
        });
      };

      if (!MOTION) {
        render(4.5, false);
        return;
      }
      render(0, false);

      const root = must(section.current, "stop");
      const tl = pinnedTimeline(root, 380);
      gsap.set(".manual", { autoAlpha: 0 });
      gsap.set(".stop-words", { yPercent: -50 });

      tl.from(
        ".stop-words span:nth-child(1)",
        { scale: 1.8, autoAlpha: 0, duration: 0.3, ease: "expo.out" },
        0,
      );
      tl.from(
        ".stop-words span:nth-child(2)",
        { scale: 1.8, autoAlpha: 0, duration: 0.3, ease: "expo.out" },
        0.5,
      );
      tl.from(
        ".stop-words span:nth-child(3)",
        { scale: 2.2, autoAlpha: 0, duration: 0.3, ease: "expo.out" },
        1,
      );
      cue(tl, 0, () => {
        sound.play("hit_word", { volume: 0.7 });
      });
      cue(tl, 0.5, () => {
        sound.play("hit_word", { volume: 0.7 });
      });
      cue(tl, 1, () => {
        sound.play("hit_stop");
      });

      // The freeze: nothing moves for a beat.
      const words = must(
        root.querySelector<HTMLElement>(".stop-words"),
        "stop words",
      );
      tl.to(
        words,
        {
          y: () => 92 - vh(50) + words.offsetHeight / 2,
          scale: 0.36,
          duration: 0.6,
          ease: "power3.inOut",
        },
        2.2,
      );
      tl.to(".manual", { autoAlpha: 1, duration: 0.4 }, 2.6);

      const proxy = { t: 0 };
      tl.to(
        proxy,
        {
          t: 4.6,
          duration: 5,
          onUpdate: () => {
            render(proxy.t, isForward(tl));
          },
        },
        3,
      );
      tl.from(".manual-cap", { y: 24, autoAlpha: 0, duration: 0.4 }, 8.2);
      tl.to({}, { duration: 0.8 }, 8.6);
    },
    { scope: section },
  );

  return (
    <section className="stop dark" id="stop" ref={section} data-tone="dark">
      <div className="stage">
        <div className="grid-lines" aria-hidden="true" />
        <h2 className="stop-words">
          <span>要改它，</span>
          <span>就得</span>
          <span className="hl">停下來。</span>
        </h2>

        <div className="manual">
          <div className="counter">
            <p>
              <b ref={count}>13</b>
              <span>
                次按鍵
                <br />
                <em>keystrokes</em>
              </span>
            </p>
            <p className="sec" ref={clock}>
              4.5 秒
            </p>
          </div>
          <p
            className="manual-line"
            ref={line}
            aria-label="明天我因該會準時到。手動把「因」改成「應」。"
          />
          <ol className="keys" ref={keys} aria-label="手動改字要按的鍵">
            {KEYS.map((key, i) => (
              <li key={i} className={key.length > 2 ? "wide" : undefined}>
                {key}
              </li>
            ))}
          </ol>
          <p className="cap manual-cap">
            只改一個字，就要按 13 下。
            <span className="en">One character. Thirteen keys.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

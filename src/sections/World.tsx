import { useRef, type ReactNode } from "react";
import {
  cue,
  gsap,
  isForward,
  MOTION,
  must,
  pinnedTimeline,
  ScrollTrigger,
  useGSAP,
} from "../lib/motion";
import { WORLD_S5_AT } from "../lib/scenes";
import { sound } from "../lib/sound";
import { createRenderer, scrubber, Tape, type Renderer } from "../lib/tape";

const BASE = import.meta.env.BASE_URL;
const LENGTH_VH = 1150;
const NAMES = ["記事本", "瀏覽器", "終端機", "聊天"];

interface Size {
  w: number;
  h: number;
  gap: number;
}

/**
 * Desktop size in design pixels: tall on phones held upright, wide and flat
 * on short screens such as a phone held sideways, 16:10 otherwise.
 */
function deskSize(): Size {
  const portrait =
    window.innerWidth <= 900 && window.innerWidth / window.innerHeight < 0.8;
  if (portrait) return { w: 760, h: 1180, gap: 90 };
  if (window.innerHeight < 560) return { w: 1400, h: 720, gap: 140 };
  return { w: 1600, h: 1000, gap: 160 };
}

/** Room kept clear above and below a desktop for the bars, in px. */
const deskMargin = () => (window.innerHeight < 560 ? 96 : 140);

const tapes = {
  np1: () =>
    new Tape()
      .type("明天的會議")
      .commit()
      .type("我")
      .commit()
      .type("因該")
      .commit()
      .hold(2)
      .mend("因該", "應該")
      .type("會晚")
      .commit()
      .type("十分鐘")
      .commit()
      .type("到。")
      .commit(),
  np2: () =>
    new Tape()
      .type("資料")
      .commit()
      .type("我")
      .commit()
      .type("以經")
      .commit()
      .hold(2)
      .mend("以經", "已經")
      .type("寄到")
      .commit()
      .type("你的信箱")
      .commit()
      .type("了。")
      .commit(),
  br: () =>
    new Tape()
      .type("下次")
      .commit()
      .type("一定會")
      .commit()
      .type("在來")
      .commit()
      .hold(2)
      .mend("在來", "再來"),
  tm: () =>
    new Tape()
      .type("修正")
      .commit()
      .type("以經")
      .commit()
      .hold(2)
      .retype("以經", "已經")
      .type("過期的連結")
      .commit(),
  ch: () =>
    new Tape()
      .type("好")
      .commit()
      .type("，明天")
      .commit()
      .type("在見")
      .commit()
      .hold(2)
      .mend("在見", "再見")
      .hold(2)
      .clear(),
};

function Desk({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <article className="desk" data-desk={index} aria-label={label}>
      <div className="wall" aria-hidden="true" />
      {children}
      <div className="taskbar" aria-hidden="true">
        <span className="tb-start" />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`tb-app${index === i ? " on" : ""}`} />
        ))}
        <span className="tb-tray">
          <img
            src={`${BASE}logo/Typomend-symbol-color.svg`}
            alt=""
            width="12"
            height="13"
          />{" "}
          下午 3:4{2 + Math.min(index, 2)}
        </span>
      </div>
    </article>
  );
}

function WinBar({ title }: { title: string }) {
  return (
    <div className="win-bar">
      <span className="win-title">{title}</span>
      <span className="win-ctl" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/** S4 and S5: one continuous camera, from a single editor out to four desktops. */
export function World() {
  const section = useRef<HTMLElement>(null);
  const cam = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = must(section.current, "world");
      const camera = must(cam.current, "camera");
      const q = (sel: string) =>
        must(root.querySelector<HTMLElement>(sel), sel);

      const lines = {
        np1: createRenderer(q("#np-1")),
        np2: createRenderer(q("#np-2")),
        br: createRenderer(q("#br-1")),
        tm: createRenderer(q("#tm-1")),
        ch: createRenderer(q("#ch-1")),
      };
      const built = {
        np1: tapes.np1(),
        np2: tapes.np2(),
        br: tapes.br(),
        tm: tapes.tm(),
        ch: tapes.ch(),
      };

      if (!MOTION) {
        (Object.keys(lines) as (keyof typeof lines)[]).forEach((key) => {
          const tape = built[key];
          const frame =
            key === "ch"
              ? tape.frames[tape.find("settle")]
              : tape.frames[tape.last];
          if (frame) lines[key].draw(frame);
          lines[key].caret(false);
        });
        return;
      }

      // Camera: `cx`/`cy` is the design-pixel point at the centre of the screen, `z` the log of the scale.
      let size = deskSize();
      const C = { cx: 0, cy: 0, z: 0 };
      const labels = [...camera.querySelectorAll<HTMLElement>(".desk-label")];

      const fit = (i: number) => ({
        cx: i * (size.w + size.gap) + size.w / 2,
        cy: size.h / 2,
        z: Math.log(
          Math.min(
            (window.innerWidth * 0.94) / size.w,
            (window.innerHeight - deskMargin()) / size.h,
          ),
        ),
      });
      const overview = () => {
        const total = 4 * size.w + 3 * size.gap;
        return {
          cx: total / 2,
          cy: size.h / 2,
          z: Math.log(
            Math.min(
              (window.innerWidth * 0.9) / total,
              (window.innerHeight * 0.42) / size.h,
            ),
          ),
        };
      };
      const apply = () => {
        const s = Math.exp(C.z);
        camera.style.transform = `translate3d(${window.innerWidth / 2 - C.cx * s}px, ${window.innerHeight / 2 - C.cy * s}px, 0) scale(${s})`;
      };
      const layout = () => {
        size = deskSize();
        camera.style.setProperty("--desk-w", `${size.w}px`);
        camera.style.setProperty("--desk-h", `${size.h}px`);
        camera.style.setProperty("--desk-gap", `${size.gap}px`);
        const s = Math.exp(overview().z);
        labels.forEach((label, i) => {
          label.style.left = `${i * (size.w + size.gap) + size.w / 2}px`;
          label.style.top = `${size.h + 18 / s}px`;
          label.style.fontSize = `${14 / s}px`;
        });
      };
      layout();
      Object.assign(C, fit(0));
      apply();
      ScrollTrigger.addEventListener("refreshInit", layout);

      const tl = pinnedTimeline(root, LENGTH_VH, "world");
      tl.eventCallback("onUpdate", apply);

      const typing = (
        key: keyof typeof lines,
        at: number,
        duration: number,
        onFrame?: (i: number) => void,
      ) => {
        const tape = built[key];
        const renderer: Renderer = lines[key];
        const play = scrubber(tape, renderer, onFrame);
        const proxy = { p: 0 };
        play(0, false);
        tl.to(
          proxy,
          {
            p: 1,
            duration,
            onUpdate: () => {
              play(proxy.p, isForward(tl));
            },
          },
          at,
        );
        return (frame: number) => at + (duration * frame) / tape.last;
      };
      const badge = (sel: string, tape: Tape) => {
        const el = q(sel);
        const fix = tape.find("fix");
        return (i: number) => {
          el.classList.toggle("is-hidden", i < fix);
        };
      };
      const camTo = (
        target: () => typeof C,
        at: number,
        duration: number,
        ease = "power2.inOut",
      ) =>
        tl.to(
          C,
          {
            cx: () => target().cx,
            cy: () => target().cy,
            z: () => target().z,
            duration,
            ease,
          },
          at,
        );
      const whip = (to: number, at: number) => {
        tl.to(
          C,
          {
            cx: () => fit(to).cx,
            cy: () => fit(to).cy,
            duration: 0.8,
            ease: "power3.inOut",
          },
          at,
        );
        tl.to(
          C,
          { z: () => fit(to).z - 0.22, duration: 0.4, ease: "sine.out" },
          at,
        );
        tl.to(
          C,
          { z: () => fit(to).z, duration: 0.4, ease: "sine.in" },
          at + 0.4,
        );
        cue(tl, at, () => {
          sound.play("whoosh_fast");
        });
      };

      gsap.set(
        [
          ".steps li",
          ".world-note",
          ".world-cap",
          "#flyout",
          "#ch-sent",
          ".desk-label",
        ],
        { autoAlpha: 0 },
      );
      ["#np-badge", "#br-badge", "#tm-badge", "#ch-badge"].forEach((sel) => {
        q(sel).classList.add("is-hidden");
      });
      lines.np2.caret(false);

      // S4: the notepad. The fix happens while the typing carries on.
      const steps = root.querySelectorAll(".steps li");
      tl.to(steps[0] ?? {}, { autoAlpha: 1, duration: 0.3 }, 0);
      const np1At = typing("np1", 0.2, 4, badge("#np-badge", built.np1));
      tl.to(
        steps[1] ?? {},
        { autoAlpha: 1, duration: 0.3 },
        np1At(built.np1.find("found")),
      );
      tl.to(
        steps[2] ?? {},
        { autoAlpha: 1, duration: 0.3 },
        np1At(built.np1.find("fix")),
      );
      tl.to(".steps li", { autoAlpha: 0, duration: 0.3 }, 4.3);
      const np2Badge = badge("#np-badge", built.np2);
      typing("np2", 4.5, 3, (i) => {
        lines.np1.caret(i === 0);
        lines.np2.caret(i > 0);
        if (i > 0) np2Badge(i);
        q("#np-badge").textContent =
          i >= built.np2.find("fix") ? "以經 → 已經" : "因該 → 應該";
      });
      tl.to(".world-note", { autoAlpha: 1, duration: 0.3 }, 5.4);
      tl.to(".world-note", { autoAlpha: 0, duration: 0.3 }, 7.5);
      tl.fromTo(
        "#flyout",
        { autoAlpha: 0, y: 30, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" },
        7.6,
      );
      cue(tl, 7.6, () => {
        sound.play("pop_soft");
      });
      tl.to("#flyout", { autoAlpha: 0, duration: 0.3 }, 8.3);

      // S5: the camera pulls back to four desktops, Powers of Ten style.
      camTo(overview, 8.6, 1.2);
      cue(tl, 8.6, () => {
        sound.play("whoosh_soft");
      });
      tl.to(".desk-label", { autoAlpha: 1, duration: 0.3, stagger: 0.08 }, 9.4);
      tl.fromTo(
        "#cap-any",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        9.5,
      );
      tl.to(["#cap-any", ".desk-label"], { autoAlpha: 0, duration: 0.3 }, 10.6);

      camTo(() => fit(1), 10.7, 1);
      cue(tl, 10.7, () => {
        sound.play("whoosh_soft");
      });
      typing("br", 11.7, 2.4, badge("#br-badge", built.br));

      whip(2, 14.3);
      typing("tm", 15.1, 2.6, badge("#tm-badge", built.tm));

      whip(3, 17.9);
      const chBadge = badge("#ch-badge", built.ch);
      const chAt = typing("ch", 18.7, 2.6, (i) => {
        chBadge(i);
        lines.ch.caret(i < built.ch.last);
      });
      tl.fromTo(
        "#ch-sent",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "back.out(2)" },
        chAt(built.ch.last),
      );

      camTo(overview, 21.5, 1.2);
      cue(tl, 21.5, () => {
        sound.play("whoosh_soft");
      });
      tl.to(
        ".desk-label",
        { autoAlpha: 1, duration: 0.3, stagger: 0.08 },
        22.3,
      );
      tl.fromTo(
        "#cap-where",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        22.4,
      );
      tl.to({}, { duration: 1.2 }, 22.8);

      if (Math.abs(8.6 / tl.duration() - WORLD_S5_AT) > 0.02) {
        console.warn(
          "WORLD_S5_AT is out of step with the World timeline",
          8.6 / tl.duration(),
        );
      }

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", layout);
      };
    },
    { scope: section },
  );

  return (
    <section className="world" id="world" ref={section} data-tone="light">
      <div className="stage world-stage">
        <div className="world-bg" aria-hidden="true" />
        <div className="world-cam" ref={cam}>
          <Desk index={0} label="記事本示範">
            <div className="win">
              <WinBar title="會議筆記.txt - 記事本" />
              <div className="win-menu" aria-hidden="true">
                <span>檔案</span>
                <span>編輯</span>
                <span>檢視</span>
              </div>
              <div className="win-body">
                <p
                  className="tline"
                  id="np-1"
                  aria-label="明天的會議我應該會晚十分鐘到。"
                />
                <p
                  className="tline"
                  id="np-2"
                  aria-label="資料我已經寄到你的信箱了。"
                />
              </div>
              <p className="win-badge" id="np-badge">
                因該 → 應該
              </p>
            </div>
            <div className="flyout" id="flyout">
              <p className="fly-head">
                <img
                  src={`${BASE}logo/Typomend-symbol-color.svg`}
                  alt=""
                  width="18"
                  height="19"
                />{" "}
                自動修正錯字
                <span className="switch" aria-hidden="true" />
              </p>
              <p>Typomend 正在留意你輸入的文字。</p>
              <p>
                啟動以來的修正次數：<b>2</b>
              </p>
            </div>
          </Desk>

          <Desk index={1} label="瀏覽器示範">
            <div className="win">
              <WinBar title="留下評論 - 瀏覽器" />
              <div className="win-url" aria-hidden="true">
                shop.example.com/review
              </div>
              <div className="win-body review">
                <p className="review-q">這次的購物體驗如何？</p>
                <p className="stars" aria-hidden="true">
                  ★★★★★
                </p>
                <div className="field">
                  <p className="tline" id="br-1" aria-label="下次一定會再來" />
                </div>
                <span className="send-btn" aria-hidden="true">
                  送出評論
                </span>
              </div>
              <p className="win-badge" id="br-badge">
                在來 → 再來
              </p>
            </div>
          </Desk>

          <Desk index={2} label="終端機示範">
            <div className="win term">
              <WinBar title="PowerShell" />
              <div className="win-body">
                <p className="mono dim">
                  PS C:\work\site&gt; git status --short
                </p>
                <p className="mono dim"> M src/links.ts</p>
                <p className="mono dim">PS C:\work\site&gt; git add .</p>
                <p className="mono prompt">
                  <span>PS C:\work\site&gt; git commit -m &quot;</span>
                  <span
                    className="tline"
                    id="tm-1"
                    aria-label="修正已經過期的連結"
                  />
                </p>
              </div>
              <p className="win-badge" id="tm-badge">
                {"終端機模式\u3000以經 → 已經"}
              </p>
            </div>
          </Desk>

          <Desk index={3} label="聊天示範">
            <div className="win">
              <WinBar title="專案小組 - 聊天" />
              <div className="win-body chat">
                <p className="bubble">明天的簡報準備好了嗎？</p>
                <p className="bubble">那我們明天對一次？</p>
                <p className="bubble me" id="ch-sent">
                  好，明天再見！
                </p>
                <div className="field chat-input">
                  <p className="tline" id="ch-1" aria-label="好，明天再見" />
                </div>
              </div>
              <p className="win-badge" id="ch-badge">
                在見 → 再見
              </p>
            </div>
          </Desk>

          {NAMES.map((name) => (
            <span key={name} className="desk-label" aria-hidden="true">
              {name}
            </span>
          ))}
        </div>

        <div className="world-ui">
          <ol className="steps">
            <li>
              <b>1</b>
              <span>
                照常用你的輸入法打字<em>Type as usual, in your own IME</em>
              </span>
            </li>
            <li>
              <b>2</b>
              <span>
                送出後稍停，檢查游標前的字
                <em>After you commit, it checks the text before the caret</em>
              </span>
            </li>
            <li>
              <b>3</b>
              <span>
                選取、取代、讀回確認<em>Select, replace, read back</em>
              </span>
            </li>
          </ol>
          <p className="world-note">
            你不必停下來。<em>You never stop typing.</em>
          </p>
          <h2 className="world-cap" id="cap-any">
            在任何程式裡，都能原地修正。
            <span className="en">Works in any app.</span>
          </h2>
          <h2 className="world-cap" id="cap-where">
            在哪裡打字，就在哪裡修好。
            <span className="en">
              Wherever you type, it&apos;s mended right there.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, MOTION, must, ScrollTrigger, useGSAP } from "../lib/motion";
import { sound } from "../lib/sound";
import { createRenderer, playTape, Tape } from "../lib/tape";

const BASE = import.meta.env.BASE_URL;

type Tab = "rules" | "model" | "apps" | "history";

const TABS: { label: string; tab?: Tab; wide?: boolean }[] = [
  { label: "總覽" },
  { label: "規則", tab: "rules" },
  { label: "語言模型", tab: "model" },
  { label: "效能", wide: true },
  { label: "應用程式", tab: "apps" },
  { label: "紀錄", tab: "history" },
  { label: "設定", wide: true },
  { label: "關於", wide: true },
];

const BENCH = [
  { set: "繁體中文", fixed: 0.81, changed: "0%" },
  { set: "簡體中文", fixed: 0.83, changed: "0%" },
  { set: "中英混打", fixed: 0.7, changed: "2%" },
];

const APPS = [
  { app: "記事本", mode: "自動", state: "支援" },
  { app: "Terminal", mode: "終端機", state: "支援（終端機模式）" },
  { app: "Chrome", mode: "標準", state: "支援" },
];

const HISTORY = [
  ["15:42", "記事本", "因該 → 應該"],
  ["15:42", "記事本", "以經 → 已經"],
  ["15:43", "Chrome", "在來 → 再來"],
  ["15:43", "Terminal", "以經 → 已經"],
  ["15:44", "專案小組", "在見 → 再見"],
];

interface PaneBodyProps {
  name: Tab;
  flip: boolean;
}

/** The contents of one settings tab. */
function PaneBody({ name, flip }: PaneBodyProps) {
  switch (name) {
    case "rules":
      return (
        <>
          <p className="p-lead">修正引擎：規則清單＋語言模型</p>
          <table className="ptable">
            <thead>
              <tr>
                <th scope="col">錯字</th>
                <th scope="col">修正為</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["因該", "應該"],
                ["在見", "再見"],
                ["以經", "已經"],
                ["一但", "一旦"],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
              <tr className="new-rule">
                <td>既使</td>
                <td>即使</td>
              </tr>
            </tbody>
          </table>
          <p className="p-foot">
            <span>已在 下午 3:43 載入 5 條規則。存檔後會立即套用。</span>
            <span className="pbtn blue">編輯規則</span>
          </p>
        </>
      );
    case "model":
      return (
        <>
          <p className="p-lead">用本機的語言模型依上下文找出選錯的同音字。</p>
          <dl className="pfields">
            <div>
              <dt>模型</dt>
              <dd>
                <span className="select">
                  macbert4csc-base-chinese (Apache-2.0)
                </span>
              </dd>
            </div>
            <div>
              <dt>模式</dt>
              <dd>
                <span className="select">精準：逐字檢查新輸入的字</span>
              </dd>
            </div>
          </dl>
          <p className="ready">
            <i />
            模型已就緒。規則清單仍會優先套用。
          </p>
          <p className="p-sub">精準模式，以每次 2 個字模擬輸入內建測試集：</p>
          <ul className="bars">
            {BENCH.map((b) => (
              <li key={b.set}>
                <span>{b.set}</span>
                <span className="bar">
                  <i style={{ "--v": b.fixed } as CSSProperties} />
                </span>
                <b>{Math.round(b.fixed * 100)}%</b>
                <em>誤改 {b.changed}</em>
              </li>
            ))}
          </ul>
          <p className="p-foot">
            <span>模型下載自 Hugging Face。</span>
            <span className="pbtn">評測</span>
          </p>
        </>
      );
    case "apps":
      return (
        <>
          <p className="p-lead">選取一個程式來變更它的修正方式。</p>
          <table className="ptable">
            <thead>
              <tr>
                <th scope="col">程式</th>
                <th scope="col">模式</th>
                <th scope="col" className="hide-sm">
                  狀態
                </th>
              </tr>
            </thead>
            <tbody>
              {APPS.map((a) => (
                <tr key={a.app}>
                  <td>{a.app}</td>
                  <td>{a.mode}</td>
                  <td className="hide-sm">{a.state}</td>
                </tr>
              ))}
              <tr className="pick">
                <td>Code</td>
                <td>
                  <span className="mode-flip">
                    <span>盲改</span>
                    <span>關閉</span>
                  </span>
                </td>
                <td className="hide-sm">
                  {flip ? "已由你關閉" : "支援（盲改模式）"}
                </td>
              </tr>
              <tr className="muted">
                <td>工作管理員</td>
                <td>自動</td>
                <td className="hide-sm">略過：以系統管理員身分執行</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    case "history":
      return (
        <>
          <p className="p-lead">
            最近的修正。紀錄只存在記憶體中，結束 Typomend 後就會清除。
          </p>
          <table className="ptable hist">
            <thead>
              <tr>
                <th scope="col">時間</th>
                <th scope="col">程式</th>
                <th scope="col">修正內容</th>
                <th scope="col">結果</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map(([time, app, what]) => (
                <tr key={`${time}${what}`}>
                  <td>{time}</td>
                  <td>{app}</td>
                  <td>{what}</td>
                  <td className="ok">完成</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
  }
}

const LABEL: Record<Tab, string> = {
  rules: "規則",
  model: "語言模型",
  apps: "應用程式",
  history: "紀錄",
};

/** On phones each chapter carries its own copy of the tab, in place of the sticky window. */
function PaneCard({ name }: { name: Tab }) {
  return (
    <div
      className="pane-card"
      role="group"
      aria-label={`Typomend 設定：${LABEL[name]}分頁示意`}
    >
      <p className="pane-card-bar">
        <img
          src={`${BASE}logo/Typomend-symbol-color.svg`}
          alt=""
          width="14"
          height="15"
        />
        Typomend · {LABEL[name]}
      </p>
      <div className="pane-card-body">
        <PaneBody name={name} flip />
      </div>
    </div>
  );
}

/** S6 Control: the T opens into the settings window, and each chapter turns a tab. */
export function Control() {
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLElement>(null);
  const ctx = useRef<HTMLSpanElement>(null);
  const [tab, setTab] = useState<Tab>("rules");
  const current = useRef<Tab>("rules");
  const [prev, setPrev] = useState<Tab | null>(null);
  const [flip, setFlip] = useState(!MOTION);

  // Slide the tab underline to the active tab.
  useLayoutEffect(() => {
    const place = () => {
      const el = tabs.current?.querySelector<HTMLElement>(
        `[data-tab="${tab}"]`,
      );
      if (!el || !ink.current) return;
      ink.current.style.width = `${el.offsetWidth}px`;
      ink.current.style.transform = `translateX(${el.offsetLeft - (tabs.current?.scrollLeft ?? 0)}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
    };
  }, [tab]);

  // The Apps tab switches Code from 盲改 to 關閉 a moment after it opens.
  useLayoutEffect(() => {
    if (!MOTION || tab !== "apps") return;
    const timer = window.setTimeout(() => {
      setFlip(true);
      sound.play("click_ui");
    }, 900);
    return () => {
      window.clearTimeout(timer);
      setFlip(false);
    };
  }, [tab]);

  useGSAP(
    () => {
      const root = must(section.current, "control");
      const fix = must(ctx.current, "context fix");

      // 明天在討論。 → 明天再討論。, played when the model chapter comes into view.
      const tape = new Tape().type("在").commit().hold(2).mend("在", "再");
      const renderer = createRenderer(fix);
      renderer.caret(false);
      const lastFrame = tape.frames[tape.last];
      if (!MOTION) {
        if (lastFrame) renderer.draw(lastFrame);
        return;
      }
      const firstFrame = tape.frames[tape.find("commit")];
      if (firstFrame) renderer.draw(firstFrame);
      let stop: () => void = () => undefined;
      ScrollTrigger.create({
        trigger: ".ctx",
        start: "top 70%",
        once: true,
        onEnter: () => {
          stop = playTape(tape, renderer, undefined, tape.find("commit"));
        },
      });

      root.querySelectorAll<HTMLElement>(".chapter").forEach((chapter) => {
        const next = chapter.dataset.tab as Tab;
        ScrollTrigger.create({
          trigger: chapter,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (!self.isActive || current.current === next) return;
            setPrev(current.current);
            setTab(next);
            current.current = next;
            sound.play("click_ui");
          },
        });
      });

      // The window grows out of the T in the tray.
      gsap.fromTo(
        ".sheet",
        { clipPath: "inset(38% 38% 38% 38% round 40px)", scale: 0.86 },
        {
          clipPath: "inset(0% 0% 0% 0% round 16px)",
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".control-body",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.6,
          },
        },
      );
      gsap.fromTo(
        ".sheet-t",
        { autoAlpha: 1, scale: 1 },
        {
          autoAlpha: 0,
          scale: 1.6,
          ease: "power2.in",
          scrollTrigger: {
            trigger: ".control-body",
            start: "top 85%",
            end: "top 55%",
            scrub: 0.6,
          },
        },
      );

      return () => {
        stop();
      };
    },
    { scope: section },
  );

  const pane = (name: Tab) =>
    `pane${tab === name ? " is-on" : ""}${prev === name && tab !== name ? " was-on" : ""}${name === "apps" && flip ? " flip" : ""}`;

  return (
    <section className="control" id="control" ref={section} data-tone="light">
      <div className="control-head">
        <p className="eyebrow">設定</p>
        <h2>規則、模型、每個程式的修正方式，都由你決定。</h2>
      </div>
      <div className="control-body">
        <div className="chapters">
          <article className="chapter" data-tab="rules">
            <p className="ch-num">規則</p>
            <h3>
              規則由你決定<span className="en">Your rules, your words.</span>
            </h3>
            <p>
              規則存在一個純文字檔，一行一條「錯字 =
              修正文字」，存檔的瞬間就會套用，不需要重新啟動。團隊可以共用一份產品名稱、人名和專有名詞的清單。
            </p>
            <pre className="code" aria-label="rules.txt 範例">
              <span className="c"># 以 # 開頭的行會被忽略</span>
              {"\n因該 = 應該\n在見 = 再見\n既使 = 即使"}
            </pre>
            <p className="fact">
              <b>20 萬條</b>規則編譯成一個 Aho-Corasick 自動機，存檔後約 0.25
              秒生效。
            </p>
            <PaneCard name="rules" />
          </article>
          <article className="chapter" data-tab="model">
            <p className="ch-num">語言模型</p>
            <h3>
              看懂上下文
              <span className="en">A local model reads the context.</span>
            </h3>
            <p>
              規則清單處理你已知的錯字，可選的本機語言模型處理你沒想到的。模型只當裁判，不負責改寫：每個修正都是你打的字的同音字，一次只改一個字。
            </p>
            <div className="ctx">
              <p className="ctx-row">
                <span className="tline">我在家等你。</span>
                <em>用字正確，不改</em>
              </p>
              <p className="ctx-row">
                <span className="tline" aria-label="明天再討論。">
                  明天
                  <span ref={ctx} aria-hidden="true" />
                  討論。
                </span>
                <em className="blue">依上下文改成「再」</em>
              </p>
            </div>
            <PaneCard name="model" />
          </article>
          <article className="chapter" data-tab="apps">
            <p className="ch-num">應用程式</p>
            <h3>
              每個程式，各自設定
              <span className="en">A correction mode per app.</span>
            </h3>
            <p>
              讀得到內文的欄位會選取、取代再讀回確認；終端機改用方向鍵和
              Backspace
              一步一步修，每一步都先讀回再送出下一步。不想修正的程式，直接關閉。
            </p>
            <ul className="modes">
              {["自動", "標準", "盲改", "終端機", "關閉"].map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <PaneCard name="apps" />
          </article>
          <article className="chapter" data-tab="history">
            <p className="ch-num">紀錄</p>
            <h3>
              留在你的電腦上<span className="en">Private by design.</span>
            </h3>
            <p>
              規則和語言模型都在本機執行。記錄檔不會記下你打的內容，修正紀錄只存在記憶體，結束
              Typomend 就清除。開啟不記錄模式後，連這些都不保留。
            </p>
            <p className="fact">
              <b>不需要</b>系統管理員權限。單一執行檔，以你的帳號執行。
            </p>
            <PaneCard name="history" />
          </article>
        </div>

        <div className="sheet-wrap">
          <div
            className="sheet"
            role="group"
            aria-label="Typomend 設定視窗示意"
          >
            <img
              className="sheet-t"
              src={`${BASE}logo/Typomend-symbol-color.svg`}
              alt=""
              width="120"
              height="128"
            />
            <div className="sheet-bar">
              <img
                src={`${BASE}logo/Typomend-symbol-color.svg`}
                alt=""
                width="14"
                height="15"
              />{" "}
              Typomend
              <span className="win-ctl" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="sheet-tabs" ref={tabs} aria-hidden="true">
              {TABS.map((t) => (
                <span
                  key={t.label}
                  data-tab={t.tab}
                  className={
                    [t.tab === tab ? "is-on" : "", t.wide ? "hide-sm" : ""]
                      .join(" ")
                      .trim() || undefined
                  }
                >
                  {t.label}
                </span>
              ))}
              <i className="tab-ink" ref={ink} />
            </div>
            <div className="panes">
              <div className={pane("rules")}>
                <PaneBody name="rules" flip={flip} />
              </div>
              <div className={pane("model")}>
                <PaneBody name="model" flip={flip} />
              </div>
              <div className={pane("apps")}>
                <PaneBody name="apps" flip={flip} />
              </div>
              <div className={pane("history")}>
                <PaneBody name="history" flip={flip} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

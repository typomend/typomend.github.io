import { useEffect, useRef, useState } from "react";
import { must } from "../lib/motion";
import { firstTypo } from "../lib/rules";
import { sound } from "../lib/sound";
import { graphemes } from "../lib/text";

interface Mend {
  id: number;
  time: string;
  from: string;
  to: string;
}

const SAMPLES = [
  { label: "打籃求", text: "我今天去打籃求，明天在見。" },
  { label: "以經、因該", text: "資料我以經寄出了，我因該會準時到。" },
  { label: "既使、由其", text: "既使下雨，我們由其要再接再勵。" },
];

/** Plain-text caret offset inside `root`. */
function getCaret(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return root.textContent.length;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.endContainer)) return root.textContent.length;
  const before = range.cloneRange();
  before.selectNodeContents(root);
  before.setEnd(range.endContainer, range.endOffset);
  return before.toString().length;
}

function setCaret(root: HTMLElement, offset: number) {
  if (document.activeElement !== root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let left = offset;
  let node = walker.nextNode();
  const range = document.createRange();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (left <= length) {
      range.setStart(node, left);
      break;
    }
    left -= length;
    node = walker.nextNode();
  }
  if (!node) range.selectNodeContents(root);
  range.collapse(!node ? false : true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * A browser stand-in for Typomend: nothing is touched while the IME is composing,
 * the check runs after a short pause, and a fix is dropped if typing starts again
 * before it is written.
 */
export function TryIt() {
  const edit = useRef<HTMLDivElement>(null);
  const api = useRef<{ say: (text: string) => void; clear: () => void } | null>(
    null,
  );
  const [log, setLog] = useState<Mend[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const root = must(edit.current, "editor");
    let composing = false;
    let busy = false;
    let check = 0;
    let swap = 0;
    let settle = 0;
    let typer = 0;
    let nextId = 1;

    const normalize = () => {
      if (!root.querySelector(".mend")) return;
      const caret = getCaret(root);
      root.replaceChildren(root.textContent);
      setCaret(root, caret);
    };

    const mend = () => {
      if (composing || busy) return;
      normalize();
      const text = root.textContent;
      const typo = firstTypo(text);
      if (!typo) return;
      busy = true;
      const caret = getCaret(root);
      const mark = document.createElement("span");
      mark.className = "mend";
      mark.textContent = typo.from;
      root.replaceChildren(
        text.slice(0, typo.at),
        mark,
        text.slice(typo.at + typo.from.length),
      );
      setCaret(root, caret);
      sound.play("tick_found");

      swap = window.setTimeout(() => {
        if (composing) {
          // Typing started again before the fix was written, so this fix is dropped.
          busy = false;
          return;
        }
        const at = getCaret(root);
        mark.textContent = typo.to;
        mark.classList.add("done");
        setCaret(root, at);
        sound.play("chime_fix");
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setLog((items) =>
          [
            { id: nextId++, time, from: typo.from, to: typo.to },
            ...items,
          ].slice(0, 6),
        );
        settle = window.setTimeout(() => {
          busy = false;
          if (!composing) normalize();
          schedule();
        }, 1100);
      }, 420);
    };

    const schedule = () => {
      window.clearTimeout(check);
      check = window.setTimeout(mend, 450);
    };

    const onCompositionStart = () => {
      composing = true;
      window.clearTimeout(check);
    };
    const onCompositionEnd = () => {
      composing = false;
      schedule();
    };
    const onInput = (event: Event) => {
      if ((event as InputEvent).isComposing || composing) return;
      sound.tap();
      schedule();
    };
    // Line breaks and pasted text go in as plain text, so the editor never holds markup.
    const insert = (text: string) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      root.normalize();
      schedule();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        insert("\n");
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      insert(event.clipboardData?.getData("text/plain") ?? "");
    };

    root.addEventListener("compositionstart", onCompositionStart);
    root.addEventListener("compositionend", onCompositionEnd);
    root.addEventListener("input", onInput);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("paste", onPaste);

    api.current = {
      say: (text: string) => {
        window.clearTimeout(typer);
        const chars = graphemes(text);
        let i = 0;
        setTyping(true);
        if (root.textContent && !root.textContent.endsWith("\n"))
          root.append("\n");
        const step = () => {
          const ch = chars[i];
          if (ch === undefined) {
            setTyping(false);
            return;
          }
          root.append(ch);
          sound.tap();
          schedule();
          i += 1;
          const pause = "，。".includes(ch) ? 650 : 90 + Math.random() * 60;
          typer = window.setTimeout(step, pause);
        };
        step();
      },
      clear: () => {
        window.clearTimeout(typer);
        window.clearTimeout(check);
        window.clearTimeout(swap);
        window.clearTimeout(settle);
        busy = false;
        root.replaceChildren();
        setTyping(false);
        setLog([]);
      },
    };

    return () => {
      [check, swap, settle, typer].forEach((t) => {
        window.clearTimeout(t);
      });
      root.removeEventListener("compositionstart", onCompositionStart);
      root.removeEventListener("compositionend", onCompositionEnd);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("paste", onPaste);
    };
  }, []);

  return (
    <section className="try" id="try" data-tone="light">
      <div className="try-head">
        <p className="eyebrow">自己打打看</p>
        <h2>
          用你的輸入法打一句。<span className="en">Type it yourself.</span>
        </h2>
        <p>
          這是網頁上的示範：只套用一份小小的規則清單，模擬 Typomend
          的修正方式。組字中的文字不會被動到，送出後稍停才會檢查。
        </p>
      </div>
      <div className="try-body">
        <div className="pad">
          <div className="pad-bar">
            <span>未命名 - 記事本</span>
            <span className="pad-count">
              已修正 <b>{log.length}</b> 處
            </span>
          </div>
          <div
            className="pad-edit"
            ref={edit}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            tabIndex={0}
            aria-multiline="true"
            aria-label="輸入區，例如：我今天去打籃求"
            spellCheck={false}
            data-placeholder="例如：我今天去打籃求"
          />
          <div className="pad-chips">
            <span className="chips-label">不方便打字？點一句：</span>
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                className="chip"
                disabled={typing}
                onClick={() => {
                  api.current?.say(sample.text);
                }}
              >
                {sample.label}
              </button>
            ))}
            <button
              type="button"
              className="chip ghost"
              onClick={() => {
                api.current?.clear();
              }}
            >
              清除
            </button>
          </div>
        </div>
        <aside className="log" aria-label="修正紀錄">
          <p className="log-head">紀錄</p>
          <ol aria-live="polite">
            {log.length === 0 ? (
              <li className="empty">修正會出現在這裡。</li>
            ) : (
              log.map((item) => (
                <li key={item.id}>
                  <time>{item.time}</time>
                  <span>
                    {item.from} → {item.to}
                  </span>
                  <b>完成</b>
                </li>
              ))
            )}
          </ol>
          <p className="log-foot">
            真正的 Typomend 另有本機語言模型，能修規則沒列到的同音錯字。
          </p>
        </aside>
      </div>
    </section>
  );
}

// A tape records typing as a list of frames, the same way the intro film's
// Typer does: bopomofo appears first, turns into a character that stays
// underlined while composing, and loses the underline when committed. A mend
// marks the typo in Light Blue, swaps only the characters that differ in Mend
// Blue, then settles back to ink. Frames can be scrubbed by scroll or played
// back in time.

import { sound } from "./sound";

const BPMF: Record<string, string> = {
  明: "ㄇㄧㄥ",
  天: "ㄊㄧㄢ",
  我: "ㄨㄛ",
  因: "ㄧㄣ",
  該: "ㄍㄞ",
  會: "ㄏㄨㄟ",
  準: "ㄓㄨㄣ",
  時: "ㄕ",
  到: "ㄉㄠ",
  的: "ㄉㄜ",
  議: "ㄧ",
  晚: "ㄨㄢ",
  十: "ㄕ",
  分: "ㄈㄣ",
  鐘: "ㄓㄨㄥ",
  資: "ㄗ",
  料: "ㄌㄧㄠ",
  以: "ㄧ",
  經: "ㄐㄧㄥ",
  已: "ㄧ",
  寄: "ㄐㄧ",
  你: "ㄋㄧ",
  信: "ㄒㄧㄣ",
  箱: "ㄒㄧㄤ",
  了: "ㄌㄜ",
  下: "ㄒㄧㄚ",
  次: "ㄘ",
  一: "ㄧ",
  定: "ㄉㄧㄥ",
  在: "ㄗㄞ",
  來: "ㄌㄞ",
  修: "ㄒㄧㄡ",
  正: "ㄓㄥ",
  過: "ㄍㄨㄛ",
  期: "ㄑㄧ",
  連: "ㄌㄧㄢ",
  結: "ㄐㄧㄝ",
  好: "ㄏㄠ",
  見: "ㄐㄧㄢ",
};

/** n: committed, c: composing, f: found by Typomend, m: just mended */
export type TokenState = "n" | "c" | "f" | "m";

export interface Token {
  id: number;
  ch: string;
  s: TokenState;
  old?: string;
  sw?: boolean;
}

export type Cue = "key" | "bs" | "commit" | "found" | "fix" | "settle" | "send";

export interface Frame {
  toks: Token[];
  cue?: Cue;
}

export class Tape {
  readonly frames: Frame[] = [];
  private toks: Token[] = [];
  private uid = 0;

  constructor() {
    this.snap();
  }

  private snap(cue?: Cue) {
    this.frames.push({ toks: this.toks.map((t) => ({ ...t })), cue });
    return this;
  }

  private text() {
    return this.toks.map((t) => t.ch).join("");
  }

  /** Types `str` as one IME composition, spelling out bopomofo where it is known. */
  type(str: string) {
    for (const ch of str) {
      const spelling = BPMF[ch];
      const token: Token = { id: ++this.uid, ch: "", s: "c" };
      this.toks.push(token);
      if (spelling) {
        for (let i = 1; i <= spelling.length; i++) {
          token.ch = spelling.slice(0, i);
          this.snap("key");
        }
      }
      token.ch = ch;
      this.snap("key");
    }
    return this;
  }

  commit() {
    this.toks.forEach((t) => {
      if (t.s === "c") t.s = "n";
    });
    return this.snap("commit");
  }

  hold(frames = 1) {
    for (let i = 0; i < frames; i++) this.snap();
    return this;
  }

  /** Finds `from`, swaps the characters that differ, then settles. */
  mend(from: string, to: string) {
    const at = this.text().lastIndexOf(from);
    const range = this.toks.slice(at, at + from.length);
    range.forEach((t, i) => {
      t.s = "f";
      const next = to[i];
      if (next !== undefined && next !== t.ch) {
        t.old = t.ch;
        t.ch = next;
        t.sw = false;
      }
    });
    this.snap("found").hold(3);
    range.forEach((t) => {
      t.s = "m";
      if (t.old) t.sw = true;
    });
    this.snap("fix").hold(6);
    range.forEach((t) => {
      t.s = "n";
    });
    return this.snap("settle");
  }

  /** Terminal mode: mark the typo, delete it with Backspace, retype it. */
  retype(from: string, to: string) {
    const at = this.text().lastIndexOf(from);
    this.toks.slice(at, at + from.length).forEach((t) => {
      t.s = "f";
    });
    this.snap("found").hold(3);
    for (let left = from.length; left > 0; left -= 1) {
      this.toks.pop();
      this.snap("bs");
    }
    for (const ch of to) {
      this.toks.push({ id: ++this.uid, ch, s: "m" });
      this.snap("key");
    }
    this.snap("fix").hold(6);
    this.toks.forEach((t) => {
      t.s = "n";
    });
    return this.snap("settle");
  }

  clear() {
    this.toks = [];
    return this.snap("send");
  }

  /** Index of the first frame with `cue` at or after `from`. */
  find(cue: Cue, from = 0) {
    const i = this.frames.findIndex((f, k) => k >= from && f.cue === cue);
    return i < 0 ? this.frames.length - 1 : i;
  }

  get last() {
    return this.frames.length - 1;
  }
}

export interface Renderer {
  draw: (frame: Frame) => void;
  caret: (on: boolean) => void;
}

/** Draws frames into `el`, keeping one span per token so swaps can transition. */
export function createRenderer(el: HTMLElement): Renderer {
  el.replaceChildren();
  const spans = new Map<number, HTMLSpanElement>();
  const caret = document.createElement("span");
  caret.className = "caret";
  let last: Frame | null = null;

  const draw = (frame: Frame) => {
    if (frame === last) return;
    last = frame;
    const keep = new Set<number>();
    let prev: Node | null = null;
    for (const t of frame.toks) {
      let span = spans.get(t.id);
      if (!span) {
        span = document.createElement("span");
        span.append(document.createElement("i"), document.createElement("i"));
        span.children[0]?.classList.add("o");
        span.children[1]?.classList.add("w");
        spans.set(t.id, span);
      }
      keep.add(t.id);
      const [o, w] = span.children;
      if (o && o.textContent !== (t.old ?? "")) o.textContent = t.old ?? "";
      if (w && w.textContent !== t.ch) w.textContent = t.ch;
      span.className = `tk s-${t.s}${t.old ? " has-old" : ""}${t.sw ? " sw" : ""}`;
      const ref: ChildNode | null = prev ? prev.nextSibling : el.firstChild;
      if (ref !== span) el.insertBefore(span, ref);
      prev = span;
    }
    for (const [id, span] of spans) {
      if (!keep.has(id)) {
        span.remove();
        spans.delete(id);
      }
    }
    el.appendChild(caret);
    caret.classList.toggle(
      "busy",
      frame.cue !== undefined && frame.cue !== "settle",
    );
  };

  return {
    draw,
    caret: (on) => {
      caret.classList.toggle("off", !on);
    },
  };
}

export function playCue(cue: Cue | undefined) {
  switch (cue) {
    case "key":
    case "bs":
      sound.tap();
      break;
    case "commit":
      sound.tap("key_space");
      break;
    case "found":
      sound.play("tick_found");
      break;
    case "fix":
      sound.play("chime_fix");
      break;
    case "send":
      sound.play("pop_soft");
      break;
    default:
      break;
  }
}

/** Maps a progress value in [0, 1] to a frame, playing cues only while moving forward. */
export function scrubber(
  tape: Tape,
  renderer: Renderer,
  onFrame?: (index: number) => void,
) {
  let index = -1;
  return (progress: number, forward: boolean) => {
    const i = Math.min(
      tape.last,
      Math.max(0, Math.round(progress * tape.last)),
    );
    if (i === index) return;
    const prev = index;
    index = i;
    const frame = tape.frames[i];
    if (frame) renderer.draw(frame);
    if (forward && prev >= 0 && i > prev && i - prev < 8) {
      for (let k = prev + 1; k <= i; k++) playCue(tape.frames[k]?.cue);
    }
    onFrame?.(i);
  };
}

const DELAY: Record<Cue | "none", number> = {
  key: 75,
  bs: 90,
  commit: 160,
  found: 140,
  fix: 160,
  settle: 200,
  send: 200,
  none: 160,
};

/** Plays a tape in real time from frame `from`. Returns a function that stops playback. */
export function playTape(
  tape: Tape,
  renderer: Renderer,
  onFrame?: (index: number) => void,
  from = 0,
) {
  let i = from;
  let timer = 0;
  const step = () => {
    const frame = tape.frames[i];
    if (!frame) return;
    renderer.draw(frame);
    playCue(frame.cue);
    onFrame?.(i);
    i += 1;
    if (i <= tape.last) {
      const jitter = frame.cue === "key" ? Math.random() * 50 : 0;
      timer = window.setTimeout(step, DELAY[frame.cue ?? "none"] + jitter);
    }
  };
  step();
  return () => {
    window.clearTimeout(timer);
  };
}

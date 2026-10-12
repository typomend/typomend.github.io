import { Tape } from "./tape";

/**
 * Sentences for the first screen, each typed in IME-sized chunks with one
 * homophone typo that Typomend then mends in place.
 */
interface Example {
  parts: string[];
  from: string;
  to: string;
}

const EXAMPLES: Example[] = [
  { parts: ["明天", "我", "因該", "會準時到", "。"], from: "因該", to: "應該" },
  { parts: ["好，", "那我們", "明天", "在見", "。"], from: "在見", to: "再見" },
  { parts: ["資料", "我", "以經", "寄給你了", "。"], from: "以經", to: "已經" },
  {
    parts: ["我今天", "去", "打籃求", "了", "。"],
    from: "打籃求",
    to: "打籃球",
  },
  { parts: ["既使", "下雨", "我也會去", "。"], from: "既使", to: "即使" },
  { parts: ["我", "由其", "喜歡", "這首歌", "。"], from: "由其", to: "尤其" },
  { parts: ["這份", "做業", "明天", "要交", "。"], from: "做業", to: "作業" },
  { parts: ["下次", "一定會", "在來", "。"], from: "在來", to: "再來" },
  { parts: ["我", "一但", "決定", "就不改", "。"], from: "一但", to: "一旦" },
  { parts: ["因問", "下雨", "所以", "遲到了", "。"], from: "因問", to: "因為" },
  { parts: ["這件事", "莫明其妙", "。"], from: "莫明其妙", to: "莫名其妙" },
  { parts: ["我們", "再接再勵", "吧！"], from: "再接再勵", to: "再接再厲" },
  { parts: ["我", "迫不急待", "想看", "。"], from: "迫不急待", to: "迫不及待" },
];

function build(example: Example) {
  const tape = new Tape();
  for (const part of example.parts) tape.type(part).commit();
  return tape.hold(3).mend(example.from, example.to);
}

const tapes = EXAMPLES.map(build);

/** The first example, for viewers who asked for reduced motion. */
export const firstExample = tapes[0] ?? new Tape();
function shuffle(order: number[]) {
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a !== undefined && b !== undefined) {
      order[i] = b;
      order[j] = a;
    }
  }
  return order;
}

/**
 * Hands out the examples in random order. Every example plays once before
 * any repeats, and the same sentence never plays twice in a row.
 */
export function exampleDeck() {
  let order: number[] = [];
  let last = -1;
  return () => {
    if (order.length === 0) {
      order = shuffle(tapes.map((_, i) => i));
      if (order[0] === last) order.push(order.shift() ?? 0);
    }
    last = order.shift() ?? 0;
    return tapes[last] ?? firstExample;
  };
}

/**
 * A small rule list for the in-browser demo. Every pair keeps the same length,
 * as Typomend's homophone fixes do, so the caret never has to move.
 */
export const RULES: [string, string][] = [
  ["因該", "應該"],
  ["在見", "再見"],
  ["以經", "已經"],
  ["一但", "一旦"],
  ["既使", "即使"],
  ["由其", "尤其"],
  ["做業", "作業"],
  ["在一次", "再一次"],
  ["打籃求", "打籃球"],
  ["因問", "因為"],
  ["再接再勵", "再接再厲"],
  ["迫不急待", "迫不及待"],
  ["一股作氣", "一鼓作氣"],
  ["按步就班", "按部就班"],
  ["莫明其妙", "莫名其妙"],
  ["走頭無路", "走投無路"],
  ["甘敗下風", "甘拜下風"],
  ["默守成規", "墨守成規"],
  ["再所難免", "在所難免"],
];

export function firstTypo(text: string) {
  let best: { at: number; from: string; to: string } | null = null;
  for (const [from, to] of RULES) {
    const at = text.indexOf(from);
    if (at >= 0 && (!best || at < best.at)) best = { at, from, to };
  }
  return best;
}

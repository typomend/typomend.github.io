const segmenter = new Intl.Segmenter("zh-Hant", { granularity: "grapheme" });

/** Splits text into user-perceived characters. */
export function graphemes(text: string) {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

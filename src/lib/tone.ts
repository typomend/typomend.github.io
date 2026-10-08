export type Tone = "light" | "dark";

/**
 * The section showing at viewport height `y`. Later sections win, because a
 * section that scrolls over a pinned one sits on top of it.
 */
export function sectionAt(y: number) {
  const sections = [
    ...document.querySelectorAll<HTMLElement>("main > section"),
  ];
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (!section) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= y && rect.bottom > y) return section;
  }
  return null;
}

export function toneAt(y: number): Tone {
  return sectionAt(y)?.dataset.tone === "dark" ? "dark" : "light";
}

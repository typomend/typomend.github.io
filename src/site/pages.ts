import { ENGLISH, GUIDES } from "./nav";

// Every page on the site with what search engines and link previews read
// from it. A title names the site once, at the start or the end, and is short
// enough that search results show it whole. A description says what the page
// answers in the two lines a result gives it.

export type Lang = "zh-Hant-TW" | "en";

export type Kind = "home" | "article" | "faq" | "missing";

export interface PageMeta {
  path: string;
  lang: Lang;
  kind: Kind;
  /** Short name for menus and breadcrumbs. */
  name: string;
  title: string;
  description: string;
  /** The day the content last changed in substance, as YYYY-MM-DD. */
  updated: string;
  /** The same page in the other language. */
  translation?: string;
}

const name = (path: string) =>
  GUIDES.find((link) => link.path === path)?.name ?? path;

export const PAGES: PageMeta[] = [
  {
    path: "/",
    lang: "zh-Hant-TW",
    kind: "home",
    name: "首頁",
    title: "Typomend：自動修正注音錯字的 Windows 工具",
    description:
      "照常用注音或任何輸入法打字，Typomend 會自動把選錯的同音字改好，例如「因該」改成「應該」。免費開源，打的字不會離開你的電腦。",
    updated: "2026-10-11",
    translation: ENGLISH.path,
  },
  {
    path: "/how-it-works/",
    lang: "zh-Hant-TW",
    kind: "article",
    name: name("/how-it-works/"),
    title: "Typomend 怎麼在任何程式裡修正錯字",
    description:
      "瀏覽器、記事本、VS Code、終端機和 Claude Code 裡打錯的同音字，Typomend 都能原地改好。不用換輸入法，打的字也不會離開你的電腦。",
    updated: "2026-10-12",
  },
  {
    path: "/language-model/",
    lang: "zh-Hant-TW",
    kind: "article",
    name: name("/language-model/"),
    title: "用語言模型修正同音錯字｜Typomend",
    description:
      "Typomend 用一個在你電腦上執行的語言模型，判斷哪個同音字放在句子裡最合理，只換掉選錯的那個字，不會改寫你的句子。測試中修好了 81% 的繁體中文同音錯字。",
    updated: "2026-10-12",
  },
  {
    path: "/faq/",
    lang: "zh-Hant-TW",
    kind: "faq",
    name: name("/faq/"),
    title: "Typomend 常見問題",
    description:
      "微軟注音一直選錯字怎麼辦？打的字會上傳嗎？能在 Claude Code 裡用嗎？這裡回答下載和使用 Typomend 之前最常被問到的問題。",
    updated: "2026-10-12",
  },
  {
    path: ENGLISH.path,
    lang: "en",
    kind: "home",
    name: ENGLISH.name,
    title: "Typomend: Autocorrect for Chinese Homophone Typos",
    description:
      "Keep your input method. Typomend fixes the wrong homophone your IME picks, right where you typed it, in any Windows app. Free and open source.",
    updated: "2026-10-12",
    translation: "/",
  },
  {
    path: "/404.html",
    lang: "zh-Hant-TW",
    kind: "missing",
    name: "找不到頁面",
    title: "找不到這個頁面｜Typomend",
    description: "這個網址沒有頁面。可以回到首頁，或從常見問題找起。",
    updated: "2026-10-12",
  },
];

export function pageAt(path: string) {
  return PAGES.find((page) => page.path === path);
}

/** Pages that belong in search results and the sitemap. */
export const INDEXED = PAGES.filter((page) => page.kind !== "missing");

/** The file a page is written to, relative to the build output. */
export function fileFor(page: PageMeta) {
  return page.path.endsWith("/")
    ? `${page.path.slice(1)}index.html`
    : page.path.slice(1);
}

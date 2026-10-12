import { RELEASES_URL, REPO_URL } from "../lib/links";
import { INDEXED } from "./pages";
import { absolute, SITE_NAME } from "./site";

// The plain files crawlers read beside the pages, written from the same list
// of pages so they never fall out of step with it.

const xml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/**
 * The sitemap. Google reads <lastmod> only when it matches real changes, so
 * it is each page's `updated` date rather than the day of the build.
 */
function sitemap() {
  const urls = INDEXED.map(
    (page) =>
      `  <url>\n    <loc>${xml(absolute(page.path))}</loc>\n    <lastmod>${page.updated}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/** Every crawler is welcome, AI search crawlers included. */
function robots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absolute("/sitemap.xml")}\n`;
}

/**
 * A summary in the llms.txt format for AI tools. Google says its own AI
 * features need no such file; it is here for the tools that do look for it.
 */
function llms() {
  const chinese = INDEXED.filter((page) => page.lang !== "en");
  const english = INDEXED.filter((page) => page.lang === "en");
  const line = (page: (typeof INDEXED)[number]) =>
    `- [${page.title}](${absolute(page.path)}): ${page.description}`;
  return [
    `# ${SITE_NAME}`,
    "",
    "> Typomend 是 Windows 上接在輸入法後面的自動修正工具。照常打字，它找出輸入法剛送出的同音錯字，在原處改正。修正引擎是規則清單加上可選的本機語言模型，文字不離開你的電腦。免費，以 MPL-2.0 授權開源。",
    "",
    `- 下載：${RELEASES_URL}`,
    `- 原始碼：${REPO_URL}`,
    "",
    "## 頁面",
    "",
    ...chinese.map(line),
    "",
    "## English",
    "",
    ...english.map(line),
    "",
  ].join("\n");
}

/** Files to write at the root of the build, by name. */
export function siteFiles(): Record<string, string> {
  return {
    "sitemap.xml": sitemap(),
    "robots.txt": robots(),
    "llms.txt": llms(),
  };
}

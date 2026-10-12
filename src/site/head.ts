import { pageAt, type PageMeta } from "./pages";
import { OG_SIZE, ogImage, structuredData, type Faq } from "./schema";
import { absolute, SITE_NAME, VERIFICATION } from "./site";

// The tags in each page's <head>, written as HTML into the page's template.
// They are plain strings rather than React elements, because React moves
// <title> and <meta> around when it renders them outside a full document.

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function tag(name: string, attrs: Record<string, string>) {
  const list = Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${escape(value)}"`)
    .join("");
  return `<${name}${list} />`;
}

const meta = (name: string, content: string) => tag("meta", { name, content });
const property = (key: string, content: string) =>
  tag("meta", { property: key, content });

/**
 * JSON for a script element. A "<" inside a string could close the element
 * early, so it is written as an escape that JSON reads back the same.
 */
function json(data: object) {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

const OG_LOCALE = { "zh-Hant-TW": "zh_TW", en: "en_US" } as const;

/** The Chinese pages serve every reader of Traditional Chinese, so they are marked by script alone. */
const HREFLANG = { "zh-Hant-TW": "zh-Hant", en: "en" } as const;

function alternates(page: PageMeta) {
  const other = page.translation ? pageAt(page.translation) : undefined;
  if (!other) return [];
  const chinese = page.lang === "en" ? other : page;
  return [page, other]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((item) =>
      tag("link", {
        rel: "alternate",
        hreflang: HREFLANG[item.lang],
        href: absolute(item.path),
      }),
    )
    .concat(
      tag("link", {
        rel: "alternate",
        hreflang: "x-default",
        href: absolute(chinese.path),
      }),
    );
}

export function headTags(page: PageMeta, faq: Faq[] = []) {
  const indexed = page.kind !== "missing";
  const image = ogImage(page);
  const url = absolute(page.path);
  const other = page.translation ? pageAt(page.translation) : undefined;
  const data = structuredData(page, faq);

  const tags = [
    `<title>${escape(page.title)}</title>`,
    meta("description", page.description),
    indexed
      ? tag("link", { rel: "canonical", href: url })
      : meta("robots", "noindex"),
    ...(indexed ? alternates(page) : []),
    ...(indexed ? [meta("robots", "max-image-preview:large")] : []),
    ...(VERIFICATION.google
      ? [meta("google-site-verification", VERIFICATION.google)]
      : []),
    ...(VERIFICATION.bing ? [meta("msvalidate.01", VERIFICATION.bing)] : []),
    property("og:type", page.kind === "home" ? "website" : "article"),
    property("og:site_name", SITE_NAME),
    property("og:locale", OG_LOCALE[page.lang]),
    ...(other ? [property("og:locale:alternate", OG_LOCALE[other.lang])] : []),
    property("og:url", url),
    property("og:title", page.title),
    property("og:description", page.description),
    property("og:image", absolute(image.path)),
    property("og:image:type", "image/png"),
    property("og:image:width", String(OG_SIZE.width)),
    property("og:image:height", String(OG_SIZE.height)),
    property("og:image:alt", image.alt),
    ...(page.kind === "home"
      ? []
      : [property("article:modified_time", page.updated)]),
    meta("twitter:card", "summary_large_image"),
  ];
  if (data) {
    tags.push(`<script type="application/ld+json">${json(data)}</script>`);
  }
  return tags.join("\n    ");
}

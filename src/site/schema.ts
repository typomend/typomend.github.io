import { RELEASES_URL, REPO_URL } from "../lib/links";
import { pageAt, type PageMeta } from "./pages";
import {
  absolute,
  AUTHOR,
  LICENSE_URL,
  RELEASED,
  SITE_NAME,
  SITE_URL,
  VERSION,
} from "./site";

// Structured data in JSON-LD, one connected graph per page. It describes only
// what the page shows. Google lists a rating or review as required for the
// software app rich result; Typomend has none, so the app is described for
// what it is and no rating is made up to qualify.

export interface Faq {
  question: string;
  /** The answer as HTML, the same markup the page shows. */
  answer: string;
}

export interface OgImage {
  path: string;
  alt: string;
}

export const OG_SIZE = { width: 1200, height: 630 };

export function ogImage(page: PageMeta): OgImage {
  return page.lang === "en"
    ? {
        path: "/og/typomend-en.png",
        alt: "Typomend: Keep typing. Mend in place.",
      }
    : {
        path: "/og/typomend.png",
        alt: "Typomend：照常輸入，原地修正。",
      };
}

const id = {
  website: absolute("/#website"),
  app: absolute("/#app"),
  source: absolute("/#source"),
  author: absolute("/#author"),
};

const ref = (target: string) => ({ "@id": target });

function author() {
  return {
    "@type": "Person",
    "@id": id.author,
    name: AUTHOR.name,
    url: AUTHOR.url,
  };
}

/**
 * The site as a whole, which gives Google the site name shown above each
 * result. When Google is not confident in a name, it may show the parent
 * domain's name instead, which for github.io is "GitHub". The lowercase
 * hostname in alternateName is a fallback that still names this site.
 */
function website() {
  return {
    "@type": "WebSite",
    "@id": id.website,
    url: absolute("/"),
    name: SITE_NAME,
    alternateName: new URL(SITE_URL).hostname,
    inLanguage: ["zh-Hant-TW", "en"],
    publisher: ref(id.author),
  };
}

const FEATURES = {
  "zh-Hant-TW": [
    "在輸入法送出文字後，自動修正選錯的同音字",
    "不取代輸入法，微軟注音或任何輸入法都適用",
    "規則清單加上可選的本機語言模型",
    "瀏覽器、記事本、VS Code、終端機與 Claude Code 都能修正",
    "文字只在本機處理，記錄檔不記下輸入內容",
    "不需要系統管理員權限",
  ],
  en: [
    "Fixes the wrong homophone after the input method commits it",
    "Works with Microsoft Bopomofo or any other input method",
    "A rule list plus an optional on-device language model",
    "Works in browsers, Notepad, VS Code, terminals and Claude Code",
    "Text is checked on your computer, and logs never contain it",
    "No administrator rights needed",
  ],
};

function app(page: PageMeta) {
  return {
    "@type": "SoftwareApplication",
    "@id": id.app,
    name: SITE_NAME,
    description: page.description,
    url: absolute(page.path),
    image: absolute(ogImage(page).path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows",
    softwareVersion: VERSION,
    datePublished: RELEASED,
    fileSize: "5MB",
    downloadUrl: RELEASES_URL,
    releaseNotes: `${REPO_URL}/blob/main/CHANGELOG.md`,
    license: LICENSE_URL,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
    featureList: FEATURES[page.lang],
    author: ref(id.author),
    sameAs: [REPO_URL],
  };
}

function source() {
  return {
    "@type": "SoftwareSourceCode",
    "@id": id.source,
    name: SITE_NAME,
    codeRepository: REPO_URL,
    programmingLanguage: "Rust",
    license: LICENSE_URL,
    author: ref(id.author),
    targetProduct: ref(id.app),
  };
}

function breadcrumbs(page: PageMeta) {
  const trail = [pageAt("/"), page].filter(
    (item): item is PageMeta => item !== undefined,
  );
  return {
    "@type": "BreadcrumbList",
    "@id": `${absolute(page.path)}#breadcrumb`,
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/** A page about Typomend. Every page but the two home pages sits under a breadcrumb. */
function webPage(page: PageMeta, type: string) {
  const crumbs =
    page.kind === "home"
      ? {}
      : { breadcrumb: ref(`${absolute(page.path)}#breadcrumb`) };
  return {
    "@type": type,
    "@id": `${absolute(page.path)}#page`,
    url: absolute(page.path),
    name: page.title,
    description: page.description,
    inLanguage: page.lang,
    isPartOf: ref(id.website),
    about: ref(id.app),
    dateModified: page.updated,
    primaryImageOfPage: absolute(ogImage(page).path),
    ...crumbs,
  };
}

function article(page: PageMeta) {
  return {
    "@type": "TechArticle",
    "@id": `${absolute(page.path)}#article`,
    headline: page.title.replace(/｜.*$/, ""),
    description: page.description,
    inLanguage: page.lang,
    image: absolute(ogImage(page).path),
    datePublished: RELEASED,
    dateModified: page.updated,
    author: ref(id.author),
    publisher: ref(id.author),
    mainEntityOfPage: ref(`${absolute(page.path)}#page`),
    about: ref(id.app),
  };
}

function faqPage(page: PageMeta, faq: Faq[]) {
  return {
    "@type": "FAQPage",
    "@id": `${absolute(page.path)}#faq`,
    inLanguage: page.lang,
    isPartOf: ref(`${absolute(page.path)}#page`),
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** The structured data for one page. */
export function structuredData(page: PageMeta, faq: Faq[] = []) {
  const graph: object[] = [website(), author()];
  switch (page.kind) {
    case "home":
      graph.push(webPage(page, "WebPage"), app(page), source());
      break;
    case "article":
      graph.push(webPage(page, "WebPage"), article(page), breadcrumbs(page));
      break;
    case "faq":
      graph.push(
        webPage(page, "WebPage"),
        faqPage(page, faq),
        breadcrumbs(page),
      );
      break;
    case "missing":
      return null;
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

import { StrictMode, type ReactElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { App } from "./App";
import { English } from "./pages/English";
import { Faq } from "./pages/Faq";
import { GROUPS } from "./pages/faq-questions";
import { HowItWorks } from "./pages/HowItWorks";
import { LanguageModel } from "./pages/LanguageModel";
import { NotFound } from "./pages/NotFound";
import { siteFiles } from "./site/files";
import { headTags } from "./site/head";
import { fileFor, PAGES, pageAt, type PageMeta } from "./site/pages";

// Renders every page to HTML at build time, and on request in development.
// The home page is rendered for React to hydrate in the browser; the guide
// pages are rendered once and ship without any script.

export type Template = "home" | "page";

export interface Rendered {
  path: string;
  /** Where the page is written, relative to the build output. */
  file: string;
  template: Template;
  lang: string;
  head: string;
  body: string;
}

const VIEWS: Record<string, (page: PageMeta) => ReactElement> = {
  "/": () => (
    <StrictMode>
      <App />
    </StrictMode>
  ),
  "/how-it-works/": (page) => <HowItWorks page={page} />,
  "/language-model/": (page) => <LanguageModel page={page} />,
  "/faq/": (page) => <Faq page={page} />,
  "/en/": (page) => <English page={page} />,
  "/404.html": (page) => <NotFound page={page} />,
};

/** The FAQ answers as the same HTML the page shows, for its structured data. */
function faqAnswers() {
  return GROUPS.flatMap((group) =>
    group.questions.map((item) => ({
      question: item.question,
      answer: renderToStaticMarkup(item.answer),
    })),
  );
}

export function render(path: string): Rendered | undefined {
  const page = pageAt(path);
  const view = VIEWS[path];
  if (!page || !view) return undefined;
  const hydrated = path === "/";
  const element = view(page);
  return {
    path,
    file: fileFor(page),
    template: hydrated ? "home" : "page",
    lang: page.lang,
    head: headTags(page, page.kind === "faq" ? faqAnswers() : []),
    body: hydrated ? renderToString(element) : renderToStaticMarkup(element),
  };
}

export function renderAll() {
  return PAGES.map((page) => render(page.path)).filter(
    (page): page is Rendered => page !== undefined,
  );
}

/**
 * Where a path without its trailing slash belongs. GitHub Pages redirects
 * such paths itself; the development server does the same with this.
 */
export function redirect(path: string) {
  const target = `${path}/`;
  return pageAt(target) ? target : undefined;
}

/** Puts a rendered page into its template. */
export function fill(template: string, page: Rendered) {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`)
    .replace("<!--app-head-->", page.head)
    .replace("<!--app-html-->", page.body);
}

export { siteFiles };

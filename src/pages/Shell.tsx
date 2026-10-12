import type { CSSProperties, ReactNode } from "react";
import { GitHubMark } from "../components/GitHubMark";
import { FILM_URL, RELEASES_URL, REPO_URL } from "../lib/links";
import { ENGLISH, GUIDES } from "../site/nav";
import type { Lang, PageMeta } from "../site/pages";

// The guide pages are set like a type specimen that proofreads itself: a
// large sentence opens each page and mends its typo in place, the chapters
// sit on a Swiss grid with the heading in the left columns and the text in
// the right, and the only colours besides ink are the brand's proof marks,
// Light Blue for a typo and Mend Blue for its fix. The pages are written to
// HTML at build time and run no script; the mend is a CSS animation.

const TEXT = {
  "zh-Hant-TW": {
    skip: "跳到內容",
    home: "Typomend 首頁",
    where: "目前位置",
    guides: "指南",
    signoff: "照常輸入，原地修正。",
    signoffLine: "以 MPL-2.0 授權開源。",
    getIt: "下載 Typomend",
    demo: "到首頁看它怎麼修",
    github: "原始碼在 GitHub",
    film: "介紹影片",
    changelog: "版本紀錄",
    other: { path: ENGLISH.path, name: "English", lang: "en" },
  },
  en: {
    skip: "Skip to content",
    home: "Typomend home",
    where: "You are here",
    guides: "Guides",
    signoff: "Keep typing. Mend in place.",
    signoffLine: "Open source under the MPL-2.0.",
    getIt: "Download Typomend",
    demo: "See it mend, on the Chinese home page",
    github: "Source on GitHub",
    film: "Intro film",
    changelog: "Changelog",
    other: { path: "/", name: "繁體中文", lang: "zh-Hant-TW" },
  },
} as const;

/** A link that leaves the site. */
export function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** A typo and its fix inside running text, marked the way the film marks them. */
export function Mend({ typo, fix }: { typo: string; fix: string }) {
  return (
    <span className="pm">
      <del>{typo}</del>
      <ins>{fix}</ins>
    </span>
  );
}

interface SpecimenProps {
  before: string;
  typo: string;
  fix: string;
  after?: string;
  /** A note in the margin of the proof, such as the model's odds. */
  note?: ReactNode;
}

/**
 * How wide `text` sets, in em: a Chinese character or full-width mark is a
 * square, Latin letters are narrower.
 */
function measure(text: string) {
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x2e80) em += 1;
    else if (ch === " ") em += 0.3;
    else if (/[A-Z]/.test(ch)) em += 0.68;
    else em += 0.58;
  }
  return em;
}

/**
 * The sentence that opens a page. It arrives with its typo marked and mends
 * it a moment later, once. It is a picture of what the page explains, so
 * screen readers skip it; the heading below says it in words. Its size
 * follows its length, so it sets on one line across a wide screen, and on
 * two balanced lines on a phone when it is long.
 */
export function Specimen({
  before,
  typo,
  fix,
  after = "",
  note,
}: SpecimenProps) {
  const em = measure(before + typo + after) + 0.5;
  const style = {
    "--em": em.toFixed(2),
    "--em-phone": (em > 7 ? em / 2 + 0.8 : em).toFixed(2),
  } as CSSProperties;
  return (
    <figure className="specimen" aria-hidden="true">
      <p className="specimen-line" lang="zh-Hant-TW" style={style}>
        {before}
        <span className="specimen-mend">
          <del>{typo}</del>
          <ins>{fix}</ins>
        </span>
        {after}
        <span className="specimen-caret" />
      </p>
      {note && <figcaption className="specimen-note">{note}</figcaption>}
    </figure>
  );
}

interface ChapterProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** A chapter: its heading holds the left columns while the text runs on the right. */
export function Chapter({ id, title, children }: ChapterProps) {
  return (
    <section className="chapter" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <div className="chapter-text">{children}</div>
    </section>
  );
}

/** Large figures with their captions, set in a row. */
export function Figures({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  return (
    <dl className="figures">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The same menu on every page, in the same order; the page you are on is marked. */
const MENU = [...GUIDES, ENGLISH];

function Masthead({ page }: { page: PageMeta }) {
  const t = TEXT[page.lang];
  return (
    <header className="mast">
      <nav className="mast-where" aria-label={t.where}>
        <a className="mast-logo" href="/" aria-label={t.home}>
          <img
            src="/logo/Typomend-lockup-color.svg"
            alt=""
            width="120"
            height="26"
          />
        </a>
        <span className="mast-sep" aria-hidden="true">
          /
        </span>
        <span className="mast-here" aria-current="page">
          {page.name}
        </span>
      </nav>
      <nav className="mast-nav" aria-label={t.guides}>
        {MENU.map((link) => (
          <a
            key={link.path}
            href={link.path}
            aria-current={link.path === page.path ? "page" : undefined}
            {...(link === ENGLISH ? { hrefLang: "en", lang: "en" } : {})}
          >
            {link.name}
          </a>
        ))}
        <a className="mast-download" href={RELEASES_URL}>
          下載
        </a>
      </nav>
    </header>
  );
}

function Signoff({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <aside className="signoff" aria-label={t.getIt}>
      <p className="signoff-title" lang={lang}>
        {t.signoff}
      </p>
      <p className="signoff-line">{t.signoffLine}</p>
      <ul className="signoff-links">
        <li>
          <a className="signoff-primary" href={RELEASES_URL}>
            {t.getIt}
          </a>
        </li>
        <li>
          <a href="/">{t.demo}</a>
        </li>
        <li>
          <a href={REPO_URL}>
            <GitHubMark size={15} />
            {t.github}
          </a>
        </li>
      </ul>
    </aside>
  );
}

function Colophon({ page }: { page: PageMeta }) {
  const t = TEXT[page.lang];
  return (
    <footer className="colophon">
      <img
        src="/logo/Typomend-lockup-reverse.svg"
        alt="Typomend"
        width="120"
        height="26"
      />
      <ul className="colophon-links">
        {GUIDES.map((link) => (
          <li key={link.path}>
            <a href={link.path}>{link.name}</a>
          </li>
        ))}
        <li>
          <a
            href={t.other.path}
            hrefLang={t.other.lang === "en" ? "en" : "zh-Hant"}
            lang={t.other.lang}
          >
            {t.other.name}
          </a>
        </li>
        <li>
          <a href={`${REPO_URL}/blob/main/CHANGELOG.md`}>{t.changelog}</a>
        </li>
        <li>
          <a href={FILM_URL}>{t.film}</a>
        </li>
      </ul>
    </footer>
  );
}

interface PageProps {
  page: PageMeta;
  specimen: ReactNode;
  heading: string;
  standfirst: ReactNode;
  children: ReactNode;
}

export function Page({
  page,
  specimen,
  heading,
  standfirst,
  children,
}: PageProps) {
  const t = TEXT[page.lang];
  return (
    <>
      <a className="skip" href="#content">
        {t.skip}
      </a>
      <Masthead page={page} />
      <main id="content">
        <header className="cover">
          {specimen}
          <h1>{heading}</h1>
          <div className="standfirst">{standfirst}</div>
        </header>
        {children}
      </main>
      <Signoff lang={page.lang} />
      <Colophon page={page} />
    </>
  );
}

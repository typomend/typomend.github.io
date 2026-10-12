import { expect, test, type APIRequestContext } from "@playwright/test";
import { ready } from "./helpers.ts";

// What search engines and link previews read. Every page arrives as finished
// HTML with its own title, description, canonical address and structured
// data; the guide pages run no script; and the home page comes back to life
// in the browser without React finding a mismatch.

const SITE = "https://typomend.github.io";
const PAGES = ["/", "/how-it-works/", "/language-model/", "/faq/", "/en/"];

/** The HTML as the server sends it, before any script runs. */
async function source(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  return response.text();
}

const titleOf = (html: string) => /<title>([^<]+)<\/title>/.exec(html)?.[1];

for (const path of PAGES) {
  test(`${path} arrives with its content and metadata`, async ({ request }) => {
    const html = await source(request, path);
    expect(titleOf(html)).toBeTruthy();
    expect(html).toMatch(/<meta name="description" content="[^"]{60,}" \/>/);
    expect(html).toContain(`<link rel="canonical" href="${SITE}${path}" />`);
    expect(html).toContain(
      `<meta property="og:url" content="${SITE}${path}" />`,
    );
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);

    const data = [
      ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ];
    expect(data).toHaveLength(1);
    const graph = (
      JSON.parse(data[0]?.[1] ?? "{}") as { "@graph": { "@type": string }[] }
    )["@graph"];
    expect(graph.map((node) => node["@type"])).toContain("WebSite");
  });
}

test("every page has a title of its own", async ({ request }) => {
  const titles = await Promise.all(
    PAGES.map(async (path) => titleOf(await source(request, path))),
  );
  expect(new Set(titles).size).toBe(PAGES.length);
});

/**
 * A rough display width in which a full-width character counts twice. Google
 * cuts a title at about 600 pixels, near 58 of these, and a description after
 * two lines, near 160.
 */
function width(text: string) {
  let sum = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const wide =
      (code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef);
    sum += wide ? 2 : 1;
  }
  return sum;
}

test("titles and descriptions show whole in search results", async ({
  request,
}) => {
  for (const path of PAGES) {
    const html = await source(request, path);
    const title = titleOf(html) ?? "";
    const description =
      /<meta name="description" content="([^"]+)"/.exec(html)?.[1] ?? "";
    expect(width(title), title).toBeLessThanOrEqual(55);
    expect(width(description), description).toBeLessThanOrEqual(160);
  }
});

test("the home page is in the HTML before any script runs", async ({
  request,
}) => {
  const html = await source(request, "/");
  for (const text of [
    "自動修正選錯的同音字",
    "音對了，字錯了。",
    "常見的解法，都要你改變習慣。",
    "規則、模型、每個程式的修正方式，都由你決定。",
  ]) {
    expect(html).toContain(text);
  }
});

test("the guide pages run no script", async ({ request }) => {
  for (const path of PAGES.filter((p) => p !== "/")) {
    expect(await source(request, path)).not.toContain('<script type="module"');
  }
});

test("the home page hydrates without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("the Chinese and English home pages name each other", async ({
  request,
}) => {
  for (const path of ["/", "/en/"]) {
    const html = await source(request, path);
    expect(html).toContain(
      `<link rel="alternate" hreflang="zh-Hant" href="${SITE}/" />`,
    );
    expect(html).toContain(
      `<link rel="alternate" hreflang="en" href="${SITE}/en/" />`,
    );
    expect(html).toContain(
      `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
    );
  }
});

test("every link inside the site leads to a page", async ({ request }) => {
  const seen = new Set<string>();
  for (const path of [...PAGES, "/404.html"]) {
    const html = await source(request, path);
    for (const [, href = ""] of html.matchAll(/<a[^>]+href="(\/[^"#]*)/g)) {
      seen.add(href);
    }
  }
  for (const href of seen) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("the sitemap lists every page and robots.txt points to it", async ({
  request,
}) => {
  const sitemap = await source(request, "/sitemap.xml");
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
  expect(listed.sort()).toEqual(PAGES.map((path) => `${SITE}${path}`).sort());
  expect(await source(request, "/robots.txt")).toContain(
    `Sitemap: ${SITE}/sitemap.xml`,
  );
});

test("the home page gives Google a site name and a favicon it can show", async ({
  request,
}) => {
  const html = await source(request, "/");
  const data = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(
    html,
  )?.[1];
  const website = (
    JSON.parse(data ?? "{}") as { "@graph": Record<string, unknown>[] }
  )["@graph"].find((node) => node["@type"] === "WebSite");
  expect(website).toMatchObject({
    url: `${SITE}/`,
    name: "Typomend",
    alternateName: "typomend.github.io",
  });

  // Google shows a favicon only if it is square and not an SVG.
  const icons = [...html.matchAll(/<link rel="icon"[^>]*href="([^"]+)"/g)];
  expect(icons.length).toBeGreaterThan(0);
  for (const [, href = ""] of icons) {
    expect(href).toMatch(/\.(png|ico)$/);
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
  const png = await (await request.get("/favicon.png")).body();
  expect(png.readUInt32BE(16)).toBe(png.readUInt32BE(20));
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(48);
});

test("the missing page is kept out of search results", async ({ request }) => {
  const html = await source(request, "/404.html");
  expect(html).toContain('<meta name="robots" content="noindex" />');
  expect(html).not.toContain('rel="canonical"');
});

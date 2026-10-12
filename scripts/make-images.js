// Draws the link preview cards, the favicons and the home screen icon from
// the brand's logo files, with the Chromium that Playwright installs:
//
//   pnpm exec playwright install chromium
//   node scripts/make-images.js
//
// The cards load Noto Sans TC from Google Fonts, so this needs a network
// connection. The results are committed to public/; run it again after a
// change to the tagline or the logo.

import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const svg = async (name) =>
  `data:image/svg+xml;base64,${(await readFile(`public/logo/${name}.svg`)).toString("base64")}`;

const lockup = await svg("Typomend-lockup-color");
const symbol = await svg("Typomend-symbol-color");
const reverse = await svg("Typomend-symbol-reverse");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;800&display=block";

const style = `
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    position: relative;
    padding: 72px 84px;
    background: #f4f6f8;
    color: #0b0f1a;
    font-family: "Noto Sans TC", sans-serif;
  }
  .logo { height: 50px; display: block; }
  .mark {
    position: absolute;
    right: -190px;
    bottom: -110px;
    height: 560px;
    opacity: 0.08;
  }
  h1 {
    margin-top: 58px;
    font-size: 84px;
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.01em;
  }
  .field {
    display: inline-flex;
    align-items: center;
    gap: 22px;
    margin-top: 40px;
    padding: 20px 30px;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 1px 0 rgba(11, 15, 26, 0.06), 0 18px 40px -18px rgba(11, 15, 26, 0.25);
    font-size: 44px;
    font-weight: 700;
  }
  .fix { color: #2563eb; }
  .badge {
    padding: 6px 16px;
    border-radius: 999px;
    background: rgba(147, 197, 253, 0.4);
    color: #1d4ed8;
    font-size: 22px;
    font-weight: 700;
  }
  .foot {
    position: absolute;
    left: 84px;
    bottom: 60px;
    font-size: 25px;
    font-weight: 500;
    color: #5b6477;
  }
`;

const card = ({ lang, title, field, badge, foot }) => `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="${FONTS}" />
    <style>${style}</style>
  </head>
  <body>
    <img class="mark" src="${symbol}" alt="" />
    <img class="logo" src="${lockup}" alt="" />
    <h1>${title}</h1>
    <p class="field"><span>${field}</span><span class="badge">${badge}</span></p>
    <p class="foot">${foot}</p>
  </body>
</html>`;

const CARDS = [
  {
    file: "public/og/typomend.png",
    lang: "zh-Hant-TW",
    title: "照常輸入，原地修正。",
    field: '明天我<span class="fix">應</span>該會準時到',
    badge: "因該 → 應該",
    foot: "打字時自動修正同音錯字 · 本機語言模型 · Windows 免費開源",
  },
  {
    file: "public/og/typomend-en.png",
    lang: "en",
    title: "Keep typing.<br />Mend in place.",
    field: '明天我<span class="fix">應</span>該會準時到',
    badge: "因該 → 應該",
    foot: "Autocorrect for Chinese homophone typos on Windows",
  },
];

const icon = `<!doctype html>
<html>
  <body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:#0b0f1a">
    <img src="${reverse}" alt="" style="height:104px" />
  </body>
</html>`;

/**
 * The color symbol on a transparent square. Google Search shows only a square
 * favicon in a raster format such as PNG or ICO, so the SVG logo, which is
 * taller than it is wide, cannot be the favicon itself.
 */
const mark = (size) => `<!doctype html>
<html>
  <body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center">
    <img src="${symbol}" alt="" style="height:${size}px" />
  </body>
</html>`;

/**
 * Packs PNG images into one ICO file. Current browsers and Windows since Vista
 * read PNG data inside an ICO, so the images need no conversion to bitmaps.
 */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const browser = await chromium.launch();
try {
  await mkdir("public/og", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  for (const { file, ...content } of CARDS) {
    await page.setContent(card(content), { waitUntil: "networkidle" });
    // Runs in the page, where the fonts are.
    await page.evaluate("document.fonts.ready.then(() => true)");
    await page.screenshot({ path: file });
    console.log(`Wrote ${file}`);
  }
  const favicons = [];
  for (const size of [16, 32, 48, 192]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(mark(size));
    favicons.push({
      size,
      png: await page.screenshot({ omitBackground: true }),
    });
  }
  await writeFile("public/favicon.png", favicons.at(-1).png);
  console.log("Wrote public/favicon.png");
  await writeFile("public/favicon.ico", ico(favicons.slice(0, -1)));
  console.log("Wrote public/favicon.ico");
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(icon);
  await page.screenshot({ path: "public/apple-touch-icon.png" });
  console.log("Wrote public/apple-touch-icon.png");
} finally {
  await browser.close();
}

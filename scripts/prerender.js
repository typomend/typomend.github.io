// Writes every page of the site as static HTML. Run after the client build,
// which leaves the two templates in dist/, and the server build, which leaves
// the renderer in dist-ssr/. Both come from `pnpm build`.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = "dist";
const SERVER = "dist-ssr";

const entry = await import(pathToFileURL(join(SERVER, "entry-server.js")).href);

const templates = {
  home: await readFile(join(DIST, "index.html"), "utf8"),
  page: await readFile(join(DIST, "page.html"), "utf8"),
};

async function write(file, text) {
  const path = join(DIST, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
}

const pages = entry.renderAll();
for (const page of pages) {
  await write(page.file, entry.fill(templates[page.template], page));
}
const files = entry.siteFiles();
for (const [file, text] of Object.entries(files)) {
  await write(file, text);
}

// The page template is not a page of its own.
await rm(join(DIST, "page.html"));
await rm(SERVER, { recursive: true, force: true });

console.log(
  `Prerendered ${pages.length} pages and ${Object.keys(files).length} files: ${[
    ...pages.map((page) => page.file),
    ...Object.keys(files),
  ].join(", ")}`,
);

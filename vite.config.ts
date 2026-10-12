import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { defineConfig, type Plugin } from "vite";

/** What the development server needs from src/entry-server.tsx. */
interface Rendered {
  template: "home" | "page";
}
interface ServerEntry {
  render(path: string): Rendered | undefined;
  redirect(path: string): string | undefined;
  fill(template: string, page: Rendered): string;
}

const TEMPLATES = { home: "index.html", page: "page.html" };

/**
 * Serves each page in development the way the build writes it: rendered by
 * src/entry-server.tsx and filled into its template, so what you see while
 * working is what search engines will read.
 */
function renderedPages(): Plugin {
  return {
    name: "typomend:rendered-pages",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "/").split("?")[0] ?? "/";
        if (req.method !== "GET" || /^\/(@|src\/|node_modules\/)/.test(path)) {
          next();
          return;
        }
        const respond = async () => {
          const entry = (await server.ssrLoadModule(
            "/src/entry-server.tsx",
          )) as ServerEntry;
          const target = entry.redirect(path);
          if (target) {
            res.writeHead(301, { Location: target }).end();
            return;
          }
          const page = entry.render(path);
          if (!page) {
            next();
            return;
          }
          const template = await server.transformIndexHtml(
            path,
            await readFile(TEMPLATES[page.template], "utf8"),
          );
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(entry.fill(template, page));
        };
        respond().catch((error: unknown) => {
          if (error instanceof Error) server.ssrFixStacktrace(error);
          next(error);
        });
      });
    },
  };
}

// typomend.github.io is an organization site, so it is served from the root.
// The client build takes both templates; `scripts/prerender.js` then fills
// them with the pages the server build renders.
export default defineConfig(({ isSsrBuild }) => ({
  base: "/",
  appType: "mpa",
  plugins: [react(), renderedPages()],
  build: isSsrBuild
    ? {}
    : {
        rolldownOptions: {
          input: { main: "index.html", page: "page.html" },
        },
      },
}));

<h1 align="center">
  <a href="https://typomend.github.io/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/logo/Typomend-lockup-reverse.svg">
      <img alt="Typomend" src="public/logo/Typomend-lockup-color.svg" width="320">
    </picture>
  </a>
</h1>

<p align="center">The website of <a href="https://github.com/boylin0/typomend">Typomend</a>, autocorrect for Chinese homophone typos.</p>

<p align="center">
  <a href="https://typomend.github.io/">typomend.github.io</a>
</p>

<p align="center">
  <a href="https://github.com/typomend/typomend.github.io/actions/workflows/deploy.yml"><img alt="Build and deploy" src="https://github.com/typomend/typomend.github.io/actions/workflows/deploy.yml/badge.svg"></a>
</p>

**English** | [繁體中文](README.zh-TW.md)

## What is this repo?

This is the source of [typomend.github.io](https://typomend.github.io/). The home page tells Typomend's story the way its intro film does, scene by scene as you scroll, with the film's sound and score. The guide pages cover how Typomend works, its language model and frequently asked questions, and there is a short English overview.

The site is a React app that Vite renders to static HTML at build time. The home page then hydrates and runs its scroll animations with GSAP; the guide pages ship no JavaScript.

Typomend itself lives in [boylin0/typomend](https://github.com/boylin0/typomend). Please report problems with the app there, and problems with the website here.

## Getting started

You need [Node.js](https://nodejs.org/) 22.12 or later and [pnpm](https://pnpm.io/). Running `corepack enable pnpm` once gives you the pnpm version this repo pins.

```sh
git clone https://github.com/typomend/typomend.github.io.git
cd typomend.github.io
pnpm install
pnpm dev
```

Then open <http://localhost:5173>. The development server renders every page the same way the production build does.

Other scripts:

- `pnpm build` type-checks, builds and prerenders every page into `dist/`.
- `pnpm preview` serves `dist/`.
- `pnpm check` runs TypeScript, ESLint and Prettier, the same checks CI runs.
- `pnpm test:e2e` runs the Playwright tests against a production build. Run `pnpm exec playwright install chromium` the first time.

## Where to edit

- The home page's scenes are in [`src/sections/`](src/sections), and its styles in [`src/styles/site.css`](src/styles/site.css).
- The guide pages are in [`src/pages/`](src/pages), styled by [`src/styles/page.css`](src/styles/page.css). Their titles, descriptions and dates are in [`src/site/pages.ts`](src/site/pages.ts).
- The site address and release version are in [`src/site/site.ts`](src/site/site.ts); the download and intro film links are in [`src/lib/links.ts`](src/lib/links.ts).
- The link preview images are drawn by `node scripts/make-images.js`.

To see the lighter effects that low-end phones get, add `?quality=lite` to the address.

## Contributing

Issues and pull requests are welcome. Before you open a pull request, run `pnpm check`, and `pnpm test:e2e` if the change is visual. Changes to layout are worth a look on a phone too.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). Git hooks, installed by `pnpm install`, lint the files you commit and check the message.

## Deployment

Every push to `main` is checked, built and published to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which then tells Bing and other search engines about the pages through [IndexNow](https://www.indexnow.org/). Pull requests are checked and built, but not published.

## License

Licensed under the [Mozilla Public License 2.0](LICENSE).

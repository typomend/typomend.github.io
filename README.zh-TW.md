<h1 align="center">
  <a href="https://typomend.github.io/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/logo/Typomend-lockup-reverse.svg">
      <img alt="Typomend" src="public/logo/Typomend-lockup-color.svg" width="320">
    </picture>
  </a>
</h1>

<p align="center"><a href="https://github.com/boylin0/typomend">Typomend</a> 的網站。Typomend 會在你打字時，自動修正選錯的同音字。</p>

<p align="center">
  <a href="https://typomend.github.io/">typomend.github.io</a>
</p>

<p align="center">
  <a href="https://github.com/typomend/typomend.github.io/actions/workflows/deploy.yml"><img alt="Build and deploy" src="https://github.com/typomend/typomend.github.io/actions/workflows/deploy.yml/badge.svg"></a>
</p>

[English](README.md) | **繁體中文**

## 這是什麼？

這裡是 [typomend.github.io](https://typomend.github.io/) 的原始碼。首頁照著 Typomend 的介紹影片，隨著捲動一幕一幕說故事，也用了影片的音效與配樂。指南頁介紹 Typomend 怎麼運作、它的語言模型和常見問題，另外有一頁英文簡介。

網站用 React 寫成，建置時由 Vite 輸出成靜態 HTML。首頁載入後交給 React 接手，用 GSAP 播放捲動動畫；指南頁不載入任何 JavaScript。

Typomend 本身在 [boylin0/typomend](https://github.com/boylin0/typomend)。程式的問題請回報到那裡，網站的問題回報到這裡。

## 開始

需要 [Node.js](https://nodejs.org/) 22.12 以上和 [pnpm](https://pnpm.io/)。執行一次 `corepack enable pnpm`，就會使用這個 repo 指定的 pnpm 版本。

```sh
git clone https://github.com/typomend/typomend.github.io.git
cd typomend.github.io
pnpm install
pnpm dev
```

接著打開 <http://localhost:5173>。開發伺服器渲染每一頁的方式，和正式建置相同。

其他指令：

- `pnpm build` 做型別檢查、建置，並把每一頁預先渲染到 `dist/`。
- `pnpm preview` 預覽 `dist/`。
- `pnpm check` 執行 TypeScript、ESLint 和 Prettier，和 CI 的檢查相同。
- `pnpm test:e2e` 對正式建置執行 Playwright 測試。第一次執行前先跑 `pnpm exec playwright install chromium`。

## 要改哪裡

- 首頁的各個場景在 [`src/sections/`](src/sections)，樣式在 [`src/styles/site.css`](src/styles/site.css)。
- 指南頁在 [`src/pages/`](src/pages)，樣式在 [`src/styles/page.css`](src/styles/page.css)。頁面的標題、描述和更新日期在 [`src/site/pages.ts`](src/site/pages.ts)。
- 網站網址和版本號在 [`src/site/site.ts`](src/site/site.ts)；下載和介紹影片的連結在 [`src/lib/links.ts`](src/lib/links.ts)。
- 分享預覽圖由 `node scripts/make-images.js` 產生。

想看低階手機會拿到的精簡效果，在網址後面加上 `?quality=lite`。

## 參與貢獻

歡迎提出 issue 和 pull request。開 pull request 之前請執行 `pnpm check`；改動畫面時也請執行 `pnpm test:e2e`。改到版面的話，最好也用手機看一下。

Commit 訊息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/)。`pnpm install` 會安裝 Git hook，commit 時檢查要提交的檔案和訊息格式。

## 部署

每次推送到 `main`，[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 都會檢查、建置並發布到 GitHub Pages，再透過 [IndexNow](https://www.indexnow.org/) 通知 Bing 等搜尋引擎。Pull request 只會檢查與建置，不會發布。

## 授權

以 [Mozilla Public License 2.0](LICENSE) 授權。

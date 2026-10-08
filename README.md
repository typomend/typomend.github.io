# Typomend 網站

Typomend 的官方網站，部署在 <https://typomend.github.io/>。整頁照著 Typomend 介紹影片的七個場景編排：往下捲動就像拖動 After Effects 的時間軸，畫面底下的時間碼對應影片的 1 分 36 秒。

## 快速對照

| 我要                 | 做法                                      |
| -------------------- | ----------------------------------------- |
| 安裝相依套件         | `pnpm install`                            |
| 本機開發             | `pnpm dev`，開啟 <http://localhost:5173/> |
| 自動修正 lint 與排版 | `pnpm lint:fix`                           |
| 跑完 CI 會檢查的項目 | `pnpm check`（型別、ESLint、Prettier）    |
| 建置正式版           | `pnpm build`，輸出到 `dist/`              |
| 預覽正式版           | `pnpm preview`                            |
| 改下載與 GitHub 連結 | `src/lib/links.ts`                        |

需要 Node.js 22.12 以上與 pnpm。`package.json` 的 `packageManager` 欄位指定了 pnpm 版本，執行一次 `corepack enable pnpm` 就會自動使用正確版本。

## 技術選擇

| 項目     | 選用                                                             |
| -------- | ---------------------------------------------------------------- |
| 框架     | React 19、Vite 8、TypeScript                                     |
| 捲動動畫 | GSAP ScrollTrigger，透過 `@gsap/react` 的 `useGSAP` 管理生命週期 |
| 平滑捲動 | Lenis，與 ScrollTrigger 同步                                     |
| 字型     | Noto Sans TC（Google Fonts）、JetBrains Mono                     |
| 音效     | 介紹影片的原始音效，轉成單聲道 24 kHz 放在 `public/sfx/`         |

## 專案結構

| 路徑                          | 內容                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/sections/`               | 每個場景一個元件：`Hero`（S1）、`Problem` 與 `Stop`（S2）、`Meet`（S3）、`World`（S4、S5）、`Apps`、`Punch`、`Control`（S6）、`TryIt`、`Finale`（S7） |
| `src/components/`             | 頂端列 `Hud`、底部時間軸 `Timeline`、內嵌標誌 `Lockup`、GitHub 圖示 `GitHubMark`                                                                      |
| `src/lib/tape.ts`             | 打字引擎：先出現注音、轉成組字中的國字、送出，再標出錯字並原地替換，和影片的 `Typer` 相同                                                             |
| `src/lib/motion.ts`           | GSAP 註冊、釘選時間軸 `pinnedTimeline`、只在往下捲時播放的 `cue`                                                                                      |
| `src/lib/scenes.ts`           | S1 到 S7 的影片時間與對應的捲動位置                                                                                                                   |
| `src/lib/rules.ts`            | 「自己打打看」使用的小型規則清單                                                                                                                      |
| `src/lib/examples.ts`         | 首屏輪流播放的 13 個同音錯字範例，隨機排序、不連續重複                                                                                                |
| `src/lib/reveal.ts`           | 按鈕的 reveal light：游標附近的邊框發光、游標下的表面被照亮，參考 Fluent Design 的 Reveal Highlight                                                   |
| `src/styles/site.css`         | 全站樣式；顏色都是 CIS 的四個品牌色                                                                                                                   |
| `public/logo/`、`src/assets/` | CIS 的標誌 SVG                                                                                                                                        |

### 動畫怎麼寫

- 每個釘選場景用 `pinnedTimeline(section, 長度vh)` 建立一條跟著捲動走的時間軸，時間軸的單位只是相對長度，實際捲動距離由 `長度vh` 決定。
- 打字畫面是一串預先算好的影格（`Tape`），捲動進度對應到影格編號，所以往回捲也會正確倒帶。
- 音效預設關閉，按右上角的聲音按鈕才會載入；捲動場景裡的音效只在往下捲時播放。音效的來源與設計見 `typomend_ae/DESIGN.md`。
- 系統開啟「減少動態效果」時，`index.html` 不會加上 `motion` class，所有場景改成直接顯示最後的畫面，不釘選也不播動畫。

## 程式碼規範

| 檢查        | 工具                                                                                                                                    | 時機                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 型別        | TypeScript `strict` 加 `noUncheckedIndexedAccess`                                                                                       | pre-push hook、CI   |
| 程式碼品質  | ESLint 10 flat config：`typescript-eslint` 的 `strictTypeChecked` 與 `stylisticTypeChecked`、React Hooks、React Refresh                 | pre-commit hook、CI |
| 無障礙      | `eslint-plugin-jsx-a11y` 的 `strict` 規則                                                                                               | pre-commit hook、CI |
| 排版        | Prettier 預設值，搭配 `eslint-config-prettier` 避免規則衝突                                                                             | pre-commit hook、CI |
| Commit 訊息 | commitlint 的 `@commitlint/config-conventional`，遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hant/v1.0.0/) | commit-msg hook     |
| 編輯器設定  | `.editorconfig`：UTF-8、LF、兩格空白縮排                                                                                                | 編輯器              |

Hook 由 Husky 管理，`pnpm install` 時會自動安裝。commit 時 lint-staged 只處理暫存的檔案：`.ts`、`.tsx`、`.js` 先跑 `eslint --fix` 再跑 Prettier，其他檔案只跑 Prettier，修正後的內容會直接進入這次 commit。

`eslint-plugin-jsx-a11y` 6.10.2 宣告的 peer dependency 只到 ESLint 9，但在 ESLint 10 上實測規則都能正常觸發，所以 `pnpm-workspace.yaml` 用 `peerDependencyRules` 允許 ESLint 10。外掛發布支援 ESLint 10 的版本後就可以拿掉這段。

## 部署

推送到 `main` 時，`.github/workflows/deploy.yml` 會依序執行 `pnpm check`、`pnpm build`，再用 GitHub Pages 官方的 `upload-pages-artifact` 與 `deploy-pages` 發布 `dist/`。Pull request 只跑檢查與建置，不會部署。流程依照 [Vite 的 GitHub Pages 部署說明](https://vite.dev/guide/static-deploy#github-pages)，所有 action 都固定到 commit SHA。

第一次部署前要在 GitHub 上做兩件事：

1. 在 `typomend` 組織建立名為 `typomend.github.io` 的 repo，網站才會出現在網域根目錄，所以 `vite.config.ts` 的 `base` 是 `/`。
2. 到 repo 的 **Settings** > **Pages**，把 **Source** 設成 **GitHub Actions**。

## 設計參考

版面與動態參考了下列得獎網站。獎項依 Awwwards 官方頁面，或標明的媒體報導。

| 作品                                                                                    | 單位      | 獎項                                                           | 取用的手法                                                                  |
| --------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Lando Norris](https://www.awwwards.com/annual-awards/winners)                          | OFF+BRAND | Awwwards 2025 Site of the Year                                 | 首屏跟著游標反應：大字的字重與折頁隨滑鼠變化；全站只用四個品牌色            |
| [AirPods Pro](https://www.awwwards.com/airpods-pro-wins-site-of-the-month-january.html) | Apple     | Awwwards Site of the Month（2020 年 1 月）、D&AD Yellow Pencil | 一個釘選畫面、一路捲到底的連續敘事：S4、S5 的四台桌面是同一個鏡頭           |
| [Mat Voyce](https://www.hontran.dev/blog/best-award-winning-websites-2026)              | Mat Voyce | Awwwards Site of the Day（依該文）                             | 字隨捲動伸縮、定位：S2 的拉霸與「因該」重擊                                 |
| [Uncommon Studio](https://www.hontran.dev/blog/best-award-winning-websites-2026)        | Uncommon  | Awwwards Site of the Day、FWA（依該文）                        | 網格在關鍵時刻被打破，轉場像鏡頭移動：S2 的 12 欄網格、對數縮放的拉遠與甩鏡 |
| [By-Kin](https://www.hontran.dev/blog/best-award-winning-websites-2026)                 | By-Kin    | Awwwards Site of the Day、FWA（依該文）                        | 有重量的平滑捲動，整頁像一個連續的表面：Lenis                               |
| [Igloo Inc](https://www.awwwards.com/igloo-inc-case-study.html)                         | Abeto     | Awwwards 案例研究                                              | 段落不多，但捲動本身就是導覽：底部的影片時間軸                              |

## 素材來源

- 標誌、色票、字型：`typomend_cis`（CIS 設計交付檔）。
- 分鏡、文案、音效：`typomend_ae`（介紹影片的 After Effects 專案）。網站的場景順序、轉場與修正的三拍呈現都沿用影片的 `DESIGN.md`。

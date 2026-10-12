import { RELEASES_URL } from "../lib/links";
import type { PageMeta } from "../site/pages";
import { Chapter, Mend, Out, Page, Specimen } from "./Shell";

/** One text field at three moments: still composing, committed, mended. */
function Moments() {
  return (
    <figure className="strip">
      <div className="strip-row">
        <p className="strip-field">
          明天我<u className="composing">ㄧㄣ</u>
          <span className="strip-caret" />
        </p>
        <p className="strip-say">還在組字。Typomend 不會動任何字。</p>
      </div>
      <div className="strip-row">
        <p className="strip-field">
          明天我<mark>因</mark>該會準時到
          <span className="strip-caret" />
        </p>
        <p className="strip-say">
          字送出了，你也停了一下。它檢查剛打的幾個字。
        </p>
      </div>
      <div className="strip-row">
        <p className="strip-field">
          明天我
          <Mend typo="因" fix="應" />
          該會準時到
          <span className="strip-caret" />
        </p>
        <p className="strip-say">
          選錯的字在原處換掉。你若已經接著打字，它就先不改。
        </p>
      </div>
    </figure>
  );
}

function Terminal() {
  return (
    <figure className="terminal">
      <p>
        PS C:\work\site&gt; git commit -m "修正
        <Mend typo="以" fix="已" />
        經過期的連結"
      </p>
      <figcaption>終端機裡打的字也一樣會改好。</figcaption>
    </figure>
  );
}

export function HowItWorks({ page }: { page: PageMeta }) {
  return (
    <Page
      page={page}
      specimen={
        <Specimen before="明天我" typo="因" fix="應" after="該會準時到。" />
      }
      heading="Typomend 怎麼在任何程式裡修正錯字"
      standfirst={
        <p>
          你照常打字。字送出、你稍微停下的時候，Typomend
          會檢查剛打的字，把選錯的同音字原地換掉。不用換輸入法，文字也不會離開你的電腦。
        </p>
      }
    >
      <Chapter id="moments" title="三個時刻">
        <Moments />
      </Chapter>

      <Chapter id="ime" title="不用換輸入法">
        <p>
          Typomend
          不跟輸入法溝通，只看輸入法送出之後的文字。微軟注音、倉頡或你習慣的任何輸入法，都可以照常用。
        </p>
      </Chapter>

      <Chapter id="apps" title="幾乎每個程式都能用">
        <p>
          瀏覽器、記事本、VS Code 和終端機都能用，包括在終端機裡執行的 Claude
          Code 這類 AI 程式助理。
        </p>
        <Terminal />
        <p>
          密碼欄位和以系統管理員身分執行的程式，它一律不碰。不想被修正的程式，可以在設定裡單獨關掉。
        </p>
      </Chapter>

      <Chapter id="speed" title="不會拖慢電腦">
        <p>
          Typomend
          只看游標前的幾個字，所以文件再長也一樣快。打開語言模型之後，每次檢查也只要幾十毫秒。
        </p>
      </Chapter>

      <Chapter id="privacy" title="文字留在你的電腦上">
        <p>
          所有檢查都在你的電腦上完成，打的字不會上傳。只有在你下載語言模型時，它才會連上網路。
        </p>
        <p>
          記錄檔不會記下你打的內容。想連修正紀錄都不留，可以打開「不記錄模式」。
        </p>
      </Chapter>

      <Chapter id="install" title="下載">
        <p>
          到 GitHub 下載<Out href={RELEASES_URL}>最新版本</Out>
          ，打開就能用，不需要安裝，也不需要系統管理員權限。Typomend
          會待在系統匣，在圖示上按右鍵可以暫停修正。
        </p>
      </Chapter>
    </Page>
  );
}

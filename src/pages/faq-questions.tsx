import type { ReactNode } from "react";

// Each answer opens with the direct answer, so it still reads right when a
// search engine or an AI assistant quotes it alone. The answers say what a
// person deciding whether to use Typomend needs to know, and leave out how
// it is built.

export interface Question {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface Group {
  id: string;
  title: string;
  questions: Question[];
}

export const GROUPS: Group[] = [
  {
    id: "about",
    title: "認識 Typomend",
    questions: [
      {
        id: "what",
        question: "Typomend 是什麼？",
        answer: (
          <p>
            一個 Windows
            工具，會在你打字時自動修正選錯的同音字。你打出「我今天去打籃求」，它會改成「我今天去打籃球」。不用換輸入法，文字也不會離開你的電腦。
          </p>
        ),
      },
      {
        id: "zhuyin",
        question: "微軟注音一直選錯字，Typomend 能解決嗎？",
        answer: (
          <p>
            可以幫你改回來。輸入法還是可能選錯字，但 Typomend
            會在字送出之後，把選錯的同音字換成對的。輸入法原本的造詞和學習功能，照樣可以用。
          </p>
        ),
      },
      {
        id: "ime",
        question: "需要換輸入法嗎？",
        answer: (
          <p>
            不用。微軟注音或你習慣的任何輸入法都能繼續用，也不用多按任何鍵。
          </p>
        ),
      },
      {
        id: "free",
        question: "需要付費嗎？",
        answer: <p>不用。Typomend 免費，原始碼公開在 GitHub。</p>,
      },
      {
        id: "platforms",
        question: "有 Mac 或手機版嗎？",
        answer: <p>目前只有 Windows 版。</p>,
      },
    ],
  },
  {
    id: "use",
    title: "使用",
    questions: [
      {
        id: "apps",
        question: "支援哪些程式？",
        answer: (
          <p>
            大多數程式都可以，像是瀏覽器、記事本、VS Code
            和終端機。密碼欄位和以系統管理員身分執行的程式不會被修正。不想修正的程式，可以單獨關掉。
          </p>
        ),
      },
      {
        id: "ai-tools",
        question: "可以在 Claude Code 這類 AI 工具裡用嗎？",
        answer: (
          <p>
            可以。在終端機裡執行的 Claude Code 這類 AI
            程式助理，你打的中文指令也會被修正。
          </p>
        ),
      },
      {
        id: "mistakes",
        question: "會不會把正確的字改錯？",
        answer: (
          <p>
            很少。在繁體中文的測試裡，預設的語言模型沒有改動任何一句正確的句子。你若正在打字，它會先等你。也可以隨時暫停，或替某個程式關掉。
          </p>
        ),
      },
      {
        id: "simplified",
        question: "支援簡體中文嗎？",
        answer: (
          <p>
            支援。Typomend
            以繁體中文為主，也能修正簡體中文，不會把繁體換成簡體。設定視窗有繁體中文和英文。
          </p>
        ),
      },
      {
        id: "rules",
        question: "可以加入自己的錯字嗎？",
        answer: (
          <p>
            可以。在設定裡打開規則檔，一行寫一條，例如「因該 =
            應該」，存檔後馬上生效。
          </p>
        ),
      },
      {
        id: "pause",
        question: "怎麼暫停，或讓某個程式不要修正？",
        answer: (
          <p>
            在系統匣圖示上按右鍵，選「暫停修正」。只想停掉某個程式，就到設定的「應用程式」分頁把它關閉。
          </p>
        ),
      },
      {
        id: "performance",
        question: "會讓電腦變慢嗎？",
        answer: (
          <p>
            不會。Typomend
            只看游標前的幾個字，文件再長也一樣快。打開語言模型之後，每次檢查也只要幾十毫秒。
          </p>
        ),
      },
    ],
  },
  {
    id: "privacy",
    title: "隱私與安全",
    questions: [
      {
        id: "cloud",
        question: "我打的字會上傳到雲端嗎？",
        answer: (
          <p>
            不會。所有檢查都在你的電腦上完成，只有在你下載語言模型時才會連上網路。記錄檔也不會記下你打的內容。
          </p>
        ),
      },
      {
        id: "admin",
        question: "需要系統管理員權限嗎？",
        answer: <p>不用。Typomend 以你的帳號執行，也不需要安裝。</p>,
      },
      {
        id: "verify",
        question: "怎麼確認下載的檔案是安全的？",
        answer: (
          <p>
            每個版本都附有校驗碼，可以確認檔案沒被改過。原始碼也公開在 GitHub。
          </p>
        ),
      },
    ],
  },
];

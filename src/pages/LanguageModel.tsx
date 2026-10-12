import { REPO_URL } from "../lib/links";
import type { PageMeta } from "../site/pages";
import { Chapter, Figures, Out, Page, Specimen } from "./Shell";

const BENCHMARK = `${REPO_URL}/blob/main/crates/typomend-scorer/README.md`;

export function LanguageModel({ page }: { page: PageMeta }) {
  return (
    <Page
      page={page}
      specimen={
        <Specimen before="我今天去打籃" typo="求" fix="球" after="。" />
      }
      heading="用語言模型修正同音錯字"
      standfirst={
        <p>
          規則清單只能修你寫進去的錯字。打開語言模型之後，Typomend
          也能看懂上下文，修好清單裡沒有的錯字，例如把「打籃求」改成「打籃球」。模型在你的電腦上執行，也可以選擇不開。
        </p>
      }
    >
      <Chapter id="judge" title="只判斷，不改寫">
        <p>
          語言模型讀過大量中文，知道一句話裡哪個字放在哪裡最自然。Typomend
          只拿它來比較同音字：你打的字，和讀音相同的其他字，哪一個在這句話裡比較合理。
        </p>
        <p>
          差距夠大才會換，一次只換一個字。所以它不會改寫你的句子，換上去的一定是同音字。
        </p>
      </Chapter>

      <Chapter id="accuracy" title="準確度">
        <Figures
          items={[
            { value: "81%", label: "繁體中文測試句裡，被修好的同音錯字" },
            { value: "0 句", label: "被改動的正確句子" },
          ]}
        />
        <p>
          這是預設模型在測試句上的結果。你也可以在設定裡，用自己的電腦再測一次。完整的評測放在{" "}
          <Out href={BENCHMARK}>GitHub</Out>。
        </p>
      </Chapter>

      <Chapter id="optional" title="要不要打開">
        <p>
          語言模型是選用的。不打開時，Typomend
          只照規則清單修正；打開它，需要另外下載一個數百 MB 的模型。
        </p>
      </Chapter>
    </Page>
  );
}

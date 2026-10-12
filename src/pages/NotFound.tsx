import { GUIDES } from "../site/nav";
import type { PageMeta } from "../site/pages";
import { Chapter, Page, Specimen } from "./Shell";

export function NotFound({ page }: { page: PageMeta }) {
  return (
    <Page
      page={page}
      specimen={<Specimen before="找不到這個" typo="業" fix="頁" after="面" />}
      heading="找不到這個頁面"
      standfirst={
        <p>
          網址可能打錯了，或是頁面已經搬走。上面那個「業」該是「頁」；這種同音錯字，Typomend
          會在你打字的時候改好。
        </p>
      }
    >
      <Chapter id="next" title="從這裡繼續">
        <ul className="plain-links">
          <li>
            <a href="/">回首頁，看 Typomend 怎麼原地修正錯字</a>
          </li>
          {GUIDES.map((link) => (
            <li key={link.path}>
              <a href={link.path}>{link.name}</a>
            </li>
          ))}
        </ul>
      </Chapter>
    </Page>
  );
}

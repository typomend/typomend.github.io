import type { PageMeta } from "../site/pages";
import { GROUPS } from "./faq-questions";
import { Chapter, Page, Specimen } from "./Shell";

export function Faq({ page }: { page: PageMeta }) {
  return (
    <Page
      page={page}
      specimen={
        <Specimen before="Typomend " typo="因" fix="應" after="該怎麼用？" />
      }
      heading="關於 Typomend 的常見問題"
      standfirst={
        <p>
          下載之前，大家最常問的是這幾件事：它和輸入法是什麼關係、打的字會不會離開電腦，以及在哪些程式裡有用。
        </p>
      }
    >
      {GROUPS.map((group) => (
        <Chapter key={group.id} id={group.id} title={group.title}>
          {group.questions.map((item) => (
            <div key={item.id} id={item.id} className="qa">
              <h3>{item.question}</h3>
              {item.answer}
            </div>
          ))}
        </Chapter>
      ))}
    </Page>
  );
}

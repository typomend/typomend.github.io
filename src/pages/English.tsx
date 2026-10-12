import type { ReactNode } from "react";
import { RELEASES_URL } from "../lib/links";
import type { PageMeta } from "../site/pages";
import { Chapter, Figures, Mend, Out, Page, Specimen } from "./Shell";

/** Chinese inside the English page, marked so it is read and rendered as Chinese. */
function Zh({ children }: { children: ReactNode }) {
  return <span lang="zh-Hant-TW">{children}</span>;
}

/** One text field at three moments, as on the Chinese guide. */
function Moments() {
  return (
    <figure className="strip">
      <div className="strip-row">
        <p className="strip-field">
          <Zh>
            明天我<u className="composing">ㄧㄣ</u>
          </Zh>
          <span className="strip-caret" />
        </p>
        <p className="strip-say">Still composing. Nothing is touched.</p>
      </div>
      <div className="strip-row">
        <p className="strip-field">
          <Zh>
            明天我<mark>因</mark>該會準時到
          </Zh>
          <span className="strip-caret" />
        </p>
        <p className="strip-say">
          The text is committed and you pause. Typomend checks what you just
          typed.
        </p>
      </div>
      <div className="strip-row">
        <p className="strip-field">
          <Zh>
            明天我
            <Mend typo="因" fix="應" />
            該會準時到
          </Zh>
          <span className="strip-caret" />
        </p>
        <p className="strip-say">
          The wrong character is replaced in place. If you are already typing
          again, it waits.
        </p>
      </div>
    </figure>
  );
}

export function English({ page }: { page: PageMeta }) {
  return (
    <Page
      page={page}
      specimen={
        <Specimen
          before="我們明天"
          typo="在"
          fix="再"
          after="見"
          note="在 zài, “at”, typed for 再 zài, “again”"
        />
      }
      heading="Autocorrect for Chinese homophone typos, in any app"
      standfirst={
        <p>
          Every Chinese input method picks the wrong homophone now and then.
          Typomend fixes it the moment you type it, right where you typed it.
          You keep your input method, and your text stays on your computer.
        </p>
      }
    >
      <Chapter id="how" title="How it works">
        <Moments />
        <p>
          It works in browsers, Notepad, VS Code and terminals, including AI
          coding agents such as Claude Code. Password fields are never touched,
          and you can turn it off for any app.
        </p>
      </Chapter>

      <Chapter id="model" title="It corrects, it doesn’t rewrite">
        <p>
          A rule list fixes the typos you add to it. For the rest, such as{" "}
          <Zh>
            打籃
            <Mend typo="求" fix="球" />
          </Zh>
          , Typomend can use a small language model on your computer to judge
          which homophone fits the sentence. It changes one character at a time
          and never rewrites what you wrote.
        </p>
        <Figures
          items={[
            {
              value: "81%",
              label: "of Traditional Chinese homophone typos fixed in testing",
            },
            { value: "0", label: "correct sentences changed" },
          ]}
        />
      </Chapter>

      <Chapter id="privacy" title="Private">
        <p>
          Everything runs on your computer. Nothing you type is uploaded, and
          logs never record your text.
        </p>
      </Chapter>

      <Chapter id="download" title="Download">
        <p>
          Get the <Out href={RELEASES_URL}>latest release</Out> for Windows from
          GitHub and run it. There is nothing to install and no administrator
          rights are needed. It is free, and the settings window comes in
          English.
        </p>
      </Chapter>
    </Page>
  );
}

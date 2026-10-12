import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RELEASES_URL, REPO_URL } from "../lib/links";
import { jump } from "../lib/scroll";
import { sound } from "../lib/sound";
import { footInView, sectionAt, toneAt, type Tone } from "../lib/tone";
import { GitHubMark } from "./GitHubMark";

const BASE = import.meta.env.BASE_URL;

const NAV = [
  { href: "#problem", label: "問題", sections: ["problem", "stop", "meet"] },
  { href: "#world", label: "運作", sections: ["world", "apps", "punch"] },
  { href: "#control", label: "控制", sections: ["control"] },
  { href: "#try", label: "試用", sections: ["try"] },
];

export function Hud() {
  const [tone, setTone] = useState<Tone>("light");
  const [current, setCurrent] = useState("");
  const soundOn = useSyncExternalStore(
    sound.subscribe,
    sound.isOn,
    sound.isOnAtBuild,
  );
  const waiting = useSyncExternalStore(
    sound.subscribe,
    sound.isWaiting,
    sound.isWaitingAtBuild,
  );
  // A press that starts the audio only starts it. The page's gesture listener
  // may have the audio running before the click lands, and the click must not
  // then turn sound off.
  const starting = useRef(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setTone(toneAt(32));
      setCurrent(sectionAt(window.innerHeight / 2)?.id ?? "");
      const root = document.documentElement.dataset;
      // While the first screen is showing, only the logo and the main actions
      // are visible. Once the footer comes into view, the film's timeline is
      // done. Each is written only when it changes, since a change on the
      // root element makes the browser restyle the whole page.
      const arrival = String(window.scrollY < window.innerHeight * 0.4);
      if (root.arrival !== arrival) root.arrival = arrival;
      const ending = String(footInView());
      if (root.ending !== ending) root.ending = ending;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <header className="hud" data-tone={tone}>
      <a
        className="hud-logo"
        href="#top"
        onClick={jump}
        aria-label="Typomend，回到頂端"
      >
        <img
          className="on-light"
          src={`${BASE}logo/Typomend-lockup-color.svg`}
          alt=""
          width="132"
          height="29"
        />
        <img
          className="on-dark"
          src={`${BASE}logo/Typomend-lockup-reverse.svg`}
          alt=""
          width="132"
          height="29"
        />
      </a>
      <nav className="hud-nav glass" aria-label="章節">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={jump}
            className={item.sections.includes(current) ? "is-on" : undefined}
            aria-current={
              item.sections.includes(current) ? "location" : undefined
            }
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="hud-actions">
        <a
          className="hud-download glass glass-tint"
          href={RELEASES_URL}
          target="_blank"
          rel="noreferrer"
        >
          下載
        </a>
        <a
          className="hud-icon glass"
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubMark />
        </a>
        <button
          className="hud-icon glass sound"
          type="button"
          aria-pressed={soundOn}
          aria-label="聲音"
          title={soundOn && !waiting ? "關閉聲音" : "開啟聲音"}
          data-waiting={waiting}
          onPointerDown={() => {
            starting.current = sound.isWaiting();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ")
              starting.current = sound.isWaiting();
          }}
          onClick={() => {
            if (starting.current) starting.current = false;
            else sound.toggle();
          }}
        >
          <svg
            className="sound-note"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <ellipse
              cx="5.4"
              cy="12.2"
              rx="2.8"
              ry="2.15"
              transform="rotate(-20 5.4 12.2)"
            />
            <rect x="6.9" y="1.6" width="1.6" height="10.6" rx="0.8" />
            <path d="M7.7 1.9c.4 2 1.9 2.9 3.2 3.9 1.2.9 1.8 2.2 1.2 3.8-.1.4.4.6.6.2 1.2-2 .8-4.1-.7-5.6C10.8 3 9.6 2.2 9.4 1.2 9.2.4 7.6.9 7.7 1.9z" />
          </svg>
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>
    </header>
  );
}

import { useEffect, useState, useSyncExternalStore } from "react";
import { RELEASES_URL, REPO_URL } from "../lib/links";
import { jump } from "../lib/scroll";
import { sound } from "../lib/sound";
import { sectionAt, toneAt, type Tone } from "../lib/tone";
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
  const soundOn = useSyncExternalStore(sound.subscribe, sound.isOn);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setTone(toneAt(32));
      setCurrent(sectionAt(window.innerHeight / 2)?.id ?? "");
      // While the first screen is showing, only the logo and the main actions are visible.
      document.documentElement.dataset.arrival = String(
        window.scrollY < window.innerHeight * 0.4,
      );
      // Once the footer comes into view, the film's timeline is done.
      const foot = document.querySelector(".foot");
      document.documentElement.dataset.ending = String(
        foot !== null && foot.getBoundingClientRect().top < window.innerHeight,
      );
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
          title={soundOn ? "關閉聲音" : "開啟聲音"}
          onClick={sound.toggle}
        >
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

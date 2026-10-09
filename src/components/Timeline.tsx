import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "../lib/motion";
import { FILM_LENGTH, SCENES, scenePositions, timecode } from "../lib/scenes";
import { scrollToY } from "../lib/scroll";
import { toneAt, type Tone } from "../lib/tone";

/** A scrubber styled after the After Effects timeline: the page is the film. */
export function Timeline() {
  const fill = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLDivElement>(null);
  const positions = useRef<number[]>([]);
  const [marks, setMarks] = useState<number[]>([]);
  const [scene, setScene] = useState(0);
  const [tone, setTone] = useState<Tone>("light");

  useEffect(() => {
    let frame = 0;
    const maxScroll = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const at = positions.current;
      let index = 0;
      at.forEach((p, i) => {
        if (y >= p - 2) index = i;
      });
      const start = at[index] ?? 0;
      const end = at[index + 1] ?? maxScroll();
      const from = SCENES[index]?.time ?? 0;
      const to = SCENES[index + 1]?.time ?? FILM_LENGTH;
      const share =
        end > start ? Math.min(1, Math.max(0, (y - start) / (end - start))) : 0;
      if (clock.current)
        clock.current.textContent = timecode(from + share * (to - from));
      if (fill.current)
        fill.current.style.transform = `scaleX(${y / maxScroll()})`;
      setScene(index);
      setTone(toneAt(window.innerHeight - 24));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      positions.current = scenePositions();
      setMarks(positions.current.map((p) => p / maxScroll()));
      schedule();
    };

    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    const first = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(frame);
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  const current = SCENES[scene];

  return (
    <nav className="timeline" data-tone={tone} aria-label="影片時間軸">
      <div className="tl-scene" aria-live="polite">
        <span>{current?.name}</span>
      </div>
      <div className="tl-track">
        <div className="tl-fill" ref={fill} />
        <div className="tl-marks">
          {marks.map((share, i) => {
            const s = SCENES[i];
            if (!s) return null;
            return (
              <button
                key={s.code}
                type="button"
                className={i <= scene ? "is-past" : undefined}
                style={{ left: `${share * 100}%` }}
                aria-label={s.name}
                onClick={() => {
                  scrollToY((positions.current[i] ?? 0) + 2);
                }}
              >
                <span aria-hidden="true">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="tl-tc" ref={clock} aria-hidden="true">
        0:00:00:00
      </div>
    </nav>
  );
}

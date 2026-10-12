import { useEffect, useRef, useSyncExternalStore } from "react";
import { film } from "../lib/film";
import { FILM_EMBED } from "../lib/links";
import { lockScroll } from "../lib/scroll";
import { sound } from "../lib/sound";

/**
 * The intro film in a modal player over the page. The embed loads only when
 * the dialog opens, and the site's own sound and scrolling pause meanwhile.
 */
export function FilmDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = useSyncExternalStore(film.subscribe, film.isOpen, film.isClosed);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    sound.hold(open);
    lockScroll(open);
  }, [open]);

  // A click on the backdrop, outside the player, closes the film.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === el) film.close();
    };
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <dialog
      className="film"
      ref={dialog}
      aria-label="Typomend 介紹影片"
      onClose={film.close}
    >
      {/* First in order, so it takes the focus when the dialog opens and
          Escape works before the player is touched. */}
      <button
        type="button"
        className="film-close glass"
        aria-label="關閉影片"
        onClick={film.close}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className="film-frame">
        {open && (
          <iframe
            src={FILM_EMBED}
            title="Typomend 介紹影片"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </dialog>
  );
}

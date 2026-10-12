import { useEffect } from "react";
import { FilmDialog } from "./components/FilmDialog";
import { GlassLens } from "./components/GlassLens";
import { Hud } from "./components/Hud";
import { Timeline } from "./components/Timeline";
import { ScrollTrigger } from "./lib/motion";
import { startGlass } from "./lib/glass";
import { startHush } from "./lib/hush";
import { startIdleScenes } from "./lib/idle";
import { startMusic } from "./lib/music";
import { startQuality } from "./lib/quality";
import { startSmoothScroll } from "./lib/scroll";
import { tapeGlyphs } from "./lib/tape";
import { Apps } from "./sections/Apps";
import { Control } from "./sections/Control";
import { Finale } from "./sections/Finale";
import { Hero } from "./sections/Hero";
import { Meet } from "./sections/Meet";
import { Problem } from "./sections/Problem";
import { Punch } from "./sections/Punch";
import { Stop } from "./sections/Stop";
import { TryIt } from "./sections/TryIt";
import { World } from "./sections/World";

export function App() {
  useEffect(() => {
    // The story starts at the beginning; restoring a position mid-pin lands between scenes.
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const stop = startSmoothScroll();
    const stopGlass = startGlass();
    const stopMusic = startMusic();
    const stopHush = startHush();
    const stopQuality = startQuality();
    const stopIdle = startIdleScenes();
    // Pin positions come from the layout of the text, which the web font
    // could change. Once the font is in, the scenes are measured again if
    // anything moved. Measuring again re-pins the scenes, which the browser
    // counts as painting the first screen anew, so it is skipped when the
    // font left every section where it was, as it does in practice.
    const layout = () =>
      [...document.querySelectorAll("main section")]
        .map((s) => Math.round(s.getBoundingClientRect().top + window.scrollY))
        .join();
    const before = layout();
    const measure = () => {
      // The scenes type characters the page does not show yet, bopomofo
      // among them. Their font slices are fetched now, while the page
      // starts, because one arriving mid-scroll makes the browser lay out
      // all the text again; on a slow phone that froze a scene for a second.
      // The scenes have all made their tapes by the time this runs.
      void document.fonts
        .load('700 1em "Noto Sans TC"', tapeGlyphs())
        .catch(() => undefined);
      void document.fonts.ready.then(() => {
        if (layout() !== before) ScrollTrigger.refresh();
      });
    };
    // The font's stylesheet loads without blocking the page, and until it
    // applies there is no font for `document.fonts.ready` to wait for.
    const fonts = document.querySelector<HTMLLinkElement>("link#fonts");
    if (fonts && fonts.media !== "all") {
      fonts.addEventListener(
        "load",
        () => {
          // The stylesheet's own handler applies it first; the faces it
          // declares start loading with the next layout.
          requestAnimationFrame(measure);
        },
        { once: true },
      );
    } else measure();
    return () => {
      stop();
      stopGlass();
      stopMusic();
      stopHush();
      stopQuality();
      stopIdle();
    };
  }, []);

  return (
    <>
      <a className="skip" href="#try">
        跳到「自己打打看」
      </a>
      <GlassLens />
      <Hud />
      <Timeline />
      <main id="top">
        <Hero />
        <Problem />
        <Stop />
        <Meet />
        <World />
        <Apps />
        <Punch />
        <Control />
        <TryIt />
        <Finale />
      </main>
      <FilmDialog />
    </>
  );
}

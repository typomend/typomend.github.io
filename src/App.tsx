import { useEffect } from "react";
import { GlassLens } from "./components/GlassLens";
import { Hud } from "./components/Hud";
import { Timeline } from "./components/Timeline";
import { ScrollTrigger } from "./lib/motion";
import { startGlass } from "./lib/glass";
import { startSmoothScroll } from "./lib/scroll";
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
    // Pin lengths depend on the web font's metrics, so measure again once it has loaded.
    void document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
    return () => {
      stop();
      stopGlass();
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
    </>
  );
}

import { useEffect } from "react";
import { Hud } from "./components/Hud";
import { Timeline } from "./components/Timeline";
import { ScrollTrigger } from "./lib/motion";
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
    // Pin lengths depend on the web font's metrics, so measure again once it has loaded.
    void document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
    return stop;
  }, []);

  return (
    <>
      <a className="skip" href="#try">
        跳到「自己打打看」
      </a>
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

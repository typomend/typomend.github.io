// The page follows the intro film's seven scenes. `time` is where each scene
// starts in the 96-second film; the timeline at the bottom of the page maps
// the scroll position onto that clock.

import { ScrollTrigger } from "./motion";

/** Share of the World timeline that plays before the camera pulls back to all four desktops. */
export const WORLD_S5_AT = 8.6 / 24;

export const FILM_LENGTH = 96;

export interface Scene {
  code: string;
  name: string;
  time: number;
  target: string;
  /** For a scene that starts partway through a pinned timeline: the trigger id and share. */
  within?: { id: string; at: number };
}

export const SCENES: Scene[] = [
  { code: "S1", name: "開場", time: 0, target: "#hero" },
  { code: "S2", name: "問題", time: 8, target: "#problem" },
  { code: "S3", name: "登場", time: 24, target: "#meet" },
  { code: "S4", name: "示範", time: 30, target: "#world" },
  {
    code: "S5",
    name: "任何程式",
    time: 46,
    target: "#world",
    within: { id: "world", at: WORLD_S5_AT },
  },
  { code: "S6", name: "控制", time: 68, target: "#control" },
  { code: "S7", name: "收尾", time: 88, target: "#finale" },
];

/** Document scroll position where each scene starts. */
export function scenePositions() {
  return SCENES.map((scene) => {
    if (scene.within) {
      const trigger = ScrollTrigger.getById(scene.within.id);
      if (trigger)
        return trigger.start + scene.within.at * (trigger.end - trigger.start);
    }
    const el = document.querySelector(scene.target);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  });
}

/** Film timecode in AE's H:MM:SS:FF form at 60 fps. */
export function timecode(seconds: number) {
  const frames = Math.floor((seconds % 1) * 60);
  const whole = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `0:${pad(Math.floor(whole / 60))}:${pad(whole % 60)}:${pad(frames)}`;
}

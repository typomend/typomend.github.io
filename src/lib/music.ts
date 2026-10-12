// The score: four stems from the intro film's music that loop together and
// fade in and out with the scene on screen, the way game music adds and drops
// layers (vertical orchestration). The calm opening has only the bed; the
// dark problem scenes swap it for a minor colour; the manual fix falls almost
// silent, as the film cuts its music there; the four desktops bring
// everything in; and at the end the score falls away, so the sonic logo
// plays alone, as in the film. The score sits under the effects and steps
// back for the mend chime.

import { sound } from "./sound";
import { sectionAt } from "./tone";

const STEMS = ["bed", "pulse", "motion", "dark"] as const;
type Stem = (typeof STEMS)[number];
type Mix = Record<Stem, number>;

/** The score's level under the effects. */
const LEVEL = 0.75;
/** How quickly stems follow a change of scene, as a time constant in seconds. */
const BLEND = 0.9;
/** How slowly the score falls away in the closing scene, in the same terms. */
const OUTRO = 1.4;

const MIXES: Record<string, Mix> = {
  hero: { bed: 0.9, pulse: 0, motion: 0.25, dark: 0 },
  problem: { bed: 0, pulse: 0.55, motion: 0, dark: 0.9 },
  stop: { bed: 0, pulse: 0, motion: 0, dark: 0.22 },
  meet: { bed: 0.85, pulse: 0, motion: 0.7, dark: 0 },
  world: { bed: 0.75, pulse: 0.85, motion: 0.8, dark: 0 },
  apps: { bed: 0.75, pulse: 0.85, motion: 0.8, dark: 0 },
  punch: { bed: 0.3, pulse: 0.6, motion: 0, dark: 0.6 },
  control: { bed: 0.8, pulse: 0.45, motion: 0.55, dark: 0 },
  try: { bed: 0.6, pulse: 0, motion: 0.2, dark: 0 },
  finale: { bed: 0, pulse: 0, motion: 0, dark: 0 },
};

const url = (stem: Stem) => `${import.meta.env.BASE_URL}music/${stem}.wav`;

/** Starts the score once audio is allowed. Returns a cleanup function. */
export function startMusic() {
  const root = document.documentElement;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  const gains = new Map<Stem, GainNode>();
  const sources: AudioBufferSourceNode[] = [];
  let scene = "";
  let frame = 0;
  let begun = false;

  const level = () => (sound.isOn() ? LEVEL : 0);

  const follow = () => {
    frame = 0;
    if (!ctx || gains.size === 0) return;
    const id = sectionAt(window.innerHeight / 2)?.id ?? "hero";
    if (id === scene) return;
    scene = id;
    root.dataset.music = id;
    const mix = MIXES[id] ?? MIXES.hero;
    if (!mix) return;
    const fade = id === "finale" ? OUTRO : BLEND;
    for (const stem of STEMS) {
      gains.get(stem)?.gain.setTargetAtTime(mix[stem], ctx.currentTime, fade);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(follow);
  };

  const begin = (audio: AudioContext) => {
    if (begun) return;
    begun = true;
    ctx = audio;
    const out = audio.createGain();
    out.gain.value = 0;
    out.connect(audio.destination);
    master = out;
    void Promise.all(
      STEMS.map(async (stem) => {
        const response = await fetch(url(stem));
        return audio.decodeAudioData(await response.arrayBuffer());
      }),
    ).then((buffers) => {
      // All stems start on the same sample, so the layers stay in time.
      const at = audio.currentTime + 0.1;
      STEMS.forEach((stem, i) => {
        const buffer = buffers[i];
        if (!buffer) return;
        const gain = audio.createGain();
        gain.gain.value = 0;
        gain.connect(out);
        gains.set(stem, gain);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start(at);
        sources.push(source);
      });
      out.gain.setTargetAtTime(level(), audio.currentTime, 1.2);
      follow();
    });
  };

  // An accent such as the mend chime pushes the score down for a moment.
  const duck = () => {
    if (!ctx || !master || !sound.isOn()) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(LEVEL * 0.45, now, 0.03);
    master.gain.setTargetAtTime(LEVEL, now + 0.4, 0.5);
  };

  const onToggle = () => {
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(
        level(),
        ctx.currentTime,
        sound.isOn() ? 0.8 : 0.2,
      );
    }
    root.dataset.musicOn = String(sound.isOn());
  };

  root.dataset.music = "idle";
  root.dataset.musicOn = String(sound.isOn());
  const stopReady = sound.onReady(begin);
  const stopToggle = sound.subscribe(onToggle);
  sound.setDucker(duck);
  window.addEventListener("scroll", schedule, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    stopReady();
    stopToggle();
    sound.setDucker(null);
    window.removeEventListener("scroll", schedule);
    sources.forEach((source) => {
      source.stop();
    });
    master?.disconnect();
  };
}

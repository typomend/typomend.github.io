// CSS animations keep running in scenes that are off screen, such as a caret
// blinking in a window the camera has left, and each one asks the browser to
// restyle on every frame. Scenes out of view are marked idle, and the
// stylesheet pauses their animations until they come back. The margin starts
// them again a little before a scene scrolls into view.

/** Starts marking the scenes out of view. Returns a cleanup function. */
export function startIdleScenes() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute("data-idle", !entry.isIntersecting);
      }
    },
    { rootMargin: "25% 0px" },
  );
  document.querySelectorAll("main section").forEach((section) => {
    observer.observe(section);
  });
  return () => {
    observer.disconnect();
  };
}

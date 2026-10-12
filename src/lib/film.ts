// Whether the intro film's player is open. A tiny store, so any button can
// open it and the dialog can follow.

let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export const film = {
  open: () => {
    set(true);
  },
  close: () => {
    set(false);
  },
  isOpen: () => open,
  /** The film starts closed, including in the HTML written at build time. */
  isClosed: () => false,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** A play symbol: a rounded triangle. */
export function PlayMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="play-mark"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M5 3.2c0-.8.9-1.3 1.6-.9l6.4 4c.6.4.6 1.3 0 1.7l-6.4 4c-.7.4-1.6-.1-1.6-.9z"
        fill="currentColor"
      />
    </svg>
  );
}

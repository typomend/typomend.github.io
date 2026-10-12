import raw from "../assets/lockup-color.svg?raw";

const markup = raw
  .replace(/<title>.*?<\/title>/, "")
  .replace(
    /width="1000" height="[\d.]+"/,
    'class="lockup" role="img" aria-label="Typomend"',
  );

interface LockupProps {
  /** Replaces the SVG's id prefix so two inline copies keep separate gradients. */
  prefix: string;
}

/** The color lockup inlined, so each part of the mark can be animated. */
export function Lockup({ prefix }: LockupProps) {
  return (
    <div
      className="lockup-wrap"
      dangerouslySetInnerHTML={{
        __html: markup.replaceAll("lg40-", `${prefix}-`),
      }}
    />
  );
}

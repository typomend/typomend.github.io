// A displacement map for the glass's lensing: neutral (50% gray) across the
// middle and ramping toward the edges, so the backdrop is pulled inward near
// the rim the way a thick convex edge bends light. Red moves pixels
// horizontally, green vertically.
const ramp = (axis: "x" | "y", channel: "red" | "green") => {
  const on = channel === "red" ? "rgb(255,0,0)" : "rgb(0,255,0)";
  const mid = channel === "red" ? "rgb(128,0,0)" : "rgb(0,128,0)";
  const [x2, y2] = axis === "x" ? ["1", "0"] : ["0", "1"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none"><linearGradient id="g" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${on}"/><stop offset="0.16" stop-color="${mid}"/><stop offset="0.84" stop-color="${mid}"/><stop offset="1" stop-color="rgb(0,0,0)"/></linearGradient><rect width="100" height="100" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/** The SVG filter the glass references in Chromium for real refraction. */
export function GlassLens() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute" }}
    >
      <filter
        id="glass-lens"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={ramp("x", "red")}
          preserveAspectRatio="none"
          result="rx"
        />
        <feImage
          href={ramp("y", "green")}
          preserveAspectRatio="none"
          result="gy"
        />
        <feComposite
          in="rx"
          in2="gy"
          operator="arithmetic"
          k2="1"
          k3="1"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="24"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

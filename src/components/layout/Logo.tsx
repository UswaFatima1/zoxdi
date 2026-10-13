/**
 * The Zoxdi mark: a balance scale inside a rounded, Instagram-gradient tile.
 * The gradient is defined once and reused across the app so the brand feels
 * consistent and bright in both the light and dark themes.
 */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="zoxdi-ig" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="30%" stopColor="#F58529" />
          <stop offset="58%" stopColor="#E1306C" />
          <stop offset="80%" stopColor="#9B30BF" />
          <stop offset="100%" stopColor="#405DE6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#zoxdi-ig)" />
      <path
        d="M24 10V16M16.5 33L24 16L31.5 33"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 33H39" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M11.5 21h9M27.5 21h9"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Simple route diagram for the pickup & drop section: home → car → training branch. Decorative. */
export function PickupVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 400" aria-hidden="true" className={className}>
      <defs>
        <pattern id="pv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#fff" strokeOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="520" height="400" rx="24" fill="#131c43" />
      <rect width="520" height="400" rx="24" fill="url(#pv-grid)" />

      {/* Streets */}
      <path
        d="M-10 250H540M150 -10V410M380 -10V410"
        stroke="#fff"
        strokeOpacity="0.07"
        strokeWidth="26"
      />

      {/* Route */}
      <path
        d="M96 300C96 236 168 240 214 216S330 178 344 124"
        fill="none"
        stroke="#ffc629"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />

      {/* Home */}
      <g transform="translate(60 296)">
        <circle cx="36" cy="34" r="36" fill="#233377" />
        <path d="M36 14 16 31h6v17h28V31h6Z" fill="#fff" />
        <rect x="31" y="35" width="10" height="13" rx="1.5" fill="#233377" />
      </g>
      <text
        x="96"
        y="372"
        textAnchor="middle"
        fontFamily="Inter Variable, Inter, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="#b9caef"
      >
        Your home
      </text>

      {/* Car */}
      <g transform="translate(196 176)">
        <rect x="0" y="14" width="64" height="26" rx="9" fill="#e2352e" />
        <path d="M12 16 20 3Q22 0 26 0h14Q44 0 46 3l8 13Z" fill="#c92a25" />
        <path d="M17 15 23 5h9v10ZM36 15V5h7l6 10Z" fill="#0d1533" opacity="0.9" />
        <circle cx="16" cy="40" r="7" fill="#05081a" />
        <circle cx="48" cy="40" r="7" fill="#05081a" />
        <circle cx="16" cy="40" r="3" fill="#8a94b8" />
        <circle cx="48" cy="40" r="3" fill="#8a94b8" />
      </g>

      {/* Branch pin */}
      <g transform="translate(320 40)">
        <path
          d="M24 0C10.7 0 0 10.7 0 24c0 17 24 44 24 44s24-27 24-44C48 10.7 37.3 0 24 0Z"
          fill="#e2352e"
        />
        <circle cx="24" cy="24" r="10" fill="#fff" />
      </g>
      <text
        x="344"
        y="130"
        textAnchor="middle"
        fontFamily="Inter Variable, Inter, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="#b9caef"
      >
        Our branch
      </text>
    </svg>
  );
}

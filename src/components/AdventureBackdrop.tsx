// Shared atmospheric backdrop — the "explorer map" world behind every page.
// Pure CSS/SVG, no images. Sits at z-0; page content rides above it.
// Deliberately low-contrast so signal data and controls stay legible.
// Heavily muted in dark mode so it never competes with the chart palette.

export function AdventureBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Sky → parchment → meadow wash (light only) */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{ background: 'radial-gradient(ellipse at 50% -8%, #CFEBFF 0%, #E6F5FF 38%, #FBF6E9 78%, #EAF7EC 100%)' }}
      />

      {/* Topographic contour lines — the "map" feel */}
      <svg
        className="absolute inset-0 h-full w-full text-map-brown/[0.07] dark:text-white/[0.025]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M-40 180 C 240 120, 480 240, 760 170 S 1240 90, 1500 200" />
        <path d="M-40 250 C 240 190, 480 310, 760 240 S 1240 160, 1500 270" />
        <path d="M-40 660 C 260 600, 520 720, 820 650 S 1260 560, 1500 680" />
        <path d="M-40 730 C 260 670, 520 790, 820 720 S 1260 630, 1500 750" />
      </svg>

      {/* Dashed explorer trail winding across the page */}
      <svg
        className="absolute inset-0 h-full w-full text-dora-orange/[0.16] dark:text-white/[0.04]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="2 18"
      >
        <path d="M-20 820 C 300 700, 360 520, 640 480 S 980 460, 1080 300 S 1300 140, 1480 90" />
      </svg>

      {/* Footprints tracking along the trail */}
      <svg
        className="absolute inset-0 h-full w-full text-map-brown/[0.10] dark:text-white/[0.03]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="currentColor"
        stroke="none"
      >
        {([
          [120, 790, -28], [185, 742, -34], [262, 690, -40], [352, 612, -52],
          [470, 522, -60], [600, 482, -66], [760, 470, -70], [900, 410, -78],
          [1010, 322, -86], [1130, 246, -92], [1260, 168, -98],
        ] as const).map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse cx="0" cy="0" rx="6" ry="9" />
            <ellipse cx="0" cy="-13" rx="3" ry="3.5" />
          </g>
        ))}
      </svg>

      {/* RF "search" rings — top-left signal motif */}
      <div className="absolute -top-16 -left-16 dark:opacity-40">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="absolute rounded-full border border-sky-blue-d/[0.18] dark:border-white/[0.04]"
            style={{ width: 220 + i * 130, height: 220 + i * 130, top: -i * 65, left: -i * 65 }}
          />
        ))}
      </div>

      {/* Slow-turning compass rose — bottom-right watermark */}
      <svg
        className="absolute -bottom-10 -right-10 w-64 h-64 text-adv-purple/[0.10] dark:text-white/[0.03]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        style={{ animation: 'sweep 90s linear infinite', transformOrigin: '50% 50%' }}
      >
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="34" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        {([0, 45, 90, 135, 180, 225, 270, 315] as const).map(deg => (
          <line
            key={deg}
            x1="50" y1="50" x2="50" y2={deg % 90 === 0 ? 6 : 16}
            transform={`rotate(${deg} 50 50)`}
            strokeWidth={deg % 90 === 0 ? 1.6 : 0.8}
          />
        ))}
        <path d="M50 8 L56 50 L50 46 L44 50 Z" fill="currentColor" stroke="none" />
      </svg>

      {/* Drifting signal sparkles */}
      {([
        { top: '14%', left: '22%', d: '0s',   c: '#FFCA3A' },
        { top: '26%', left: '64%', d: '1.1s', c: '#5BC8F5' },
        { top: '40%', left: '82%', d: '2.2s', c: '#FFCA3A' },
        { top: '58%', left: '14%', d: '0.6s', c: '#9B5DE5' },
        { top: '70%', left: '70%', d: '1.7s', c: '#FF8C42' },
      ] as const).map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle text-[12px] leading-none dark:opacity-30"
          style={{ top: s.top, left: s.left, color: s.c, animationDelay: s.d }}
        >
          ✦
        </span>
      ))}

      {/* Rolling meadow hills at the base (light only) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[16%] dark:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(216,247,228,0) 0%, rgba(176,236,197,0.55) 100%)',
          borderRadius: '60% 60% 0 0 / 36px 36px 0 0',
        }}
      />
    </div>
  )
}

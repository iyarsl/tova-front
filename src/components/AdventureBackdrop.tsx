// Shared atmospheric backdrop behind every page. Pure CSS/SVG, no images.
// Sits at z-0; page content rides above it. Deliberately low-contrast so
// signal data and controls stay legible. Pared back to a calm warm-technical
// wash + faint contour grid + a single slow compass watermark.

export function AdventureBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Cool sky base wash (light only) — echoes original bg-sky-canvas #E3F4FF */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{ background: 'linear-gradient(160deg, #E3F4FF 0%, #EAF1FF 46%, #F2F6FF 100%)' }}
      />

      {/* Soft colour blooms — blue-dominant, warm only as small accent (light only) */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute -top-32 -left-24 w-[620px] h-[620px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(91,200,245,0.26), transparent 68%)' }} />
        <div className="absolute -top-24 right-[-8%] w-[560px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,156,255,0.22), transparent 68%)' }} />
        <div className="absolute bottom-[-18%] left-[14%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(120,180,255,0.18), transparent 70%)' }} />
        <div className="absolute bottom-[-12%] right-[6%] w-[440px] h-[440px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(155,93,229,0.12), transparent 70%)' }} />
        <div className="absolute top-[28%] -right-16 w-[360px] h-[360px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.10), transparent 70%)' }} />
      </div>

      {/* Slow-turning compass rose — bottom-right watermark */}
      <svg
        className="absolute -bottom-10 -right-10 w-64 h-64 text-adv-purple/[0.09] dark:text-white/[0.03]"
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
    </div>
  )
}

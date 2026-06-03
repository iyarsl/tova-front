// Luminous radar "command-center" backdrop for the hero landing.
// Stays on the light Dora theme (bright sky lineage) but cranks production
// value: a large scanning radar dial with a rotating conic sweep, a faint
// perspective grid with a travelling scan line, and soft colour blooms that
// "light" the scene. All CSS/SVG, no images. Motion eases off under
// prefers-reduced-motion.
export function DoraSkyCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Bright sky base — same lineage as the calm shell */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #E3F4FF 0%, #E9F1FF 44%, #F2F6FF 100%)' }}
      />

      {/* Colour blooms — blue-dominant, warm bloom low-right where Dora stands */}
      <div className="absolute -top-24 right-[-6%] w-[560px] h-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(91,200,245,0.30), transparent 68%)' }} />
      <div className="absolute -top-28 -left-24 w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,156,255,0.22), transparent 68%)' }} />
      <div className="absolute bottom-[-22%] right-[10%] w-[620px] h-[620px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.18), transparent 70%)' }} />
      <div className="absolute bottom-[-16%] left-[6%] w-[460px] h-[460px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(155,93,229,0.13), transparent 70%)' }} />

      {/* Perspective scan grid + travelling scan line */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden opacity-70">
        <svg className="absolute inset-0 h-full w-full text-sky-blue-d/25"
          viewBox="0 0 1440 500" preserveAspectRatio="none" fill="none"
          stroke="currentColor" strokeWidth={1}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <line key={`h${i}`} x1="0" y1={60 + i * (440 / 6)} x2="1440" y2={60 + i * (440 / 6)} />
          ))}
          {Array.from({ length: 17 }).map((_, i) => (
            <line key={`v${i}`}
              x1={720 + (i - 8) * 40} y1="60"
              x2={720 + (i - 8) * 300} y2="500" />
          ))}
        </svg>
        <div className="absolute inset-x-0 top-0 h-24 motion-reduce:hidden animate-scan-grid"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(91,200,245,0.35), transparent)' }} />
      </div>

      {/* The radar dial — showpiece, low-centre-right */}
      <div className="absolute left-1/2 top-[52%] -translate-x-[42%] -translate-y-1/2
        w-[min(78vw,760px)] aspect-square">

        {/* Rotating conic sweep, masked to a disc. Stays visible (static) under
            reduced-motion so the radar never looks dead. */}
        <div className="absolute inset-0 rounded-full animate-sweep-slow motion-reduce:animate-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(255,140,66,0.55) 0deg, rgba(255,140,66,0.18) 26deg, rgba(255,140,66,0.04) 60deg, transparent 92deg, transparent 360deg)',
            maskImage: 'radial-gradient(circle, #000 70%, transparent 71%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 70%, transparent 71%)',
          }} />

        {/* Bright leading edge of the sweep — rotates with the wedge */}
        <div className="absolute inset-0 animate-sweep-slow motion-reduce:animate-none">
          <span className="absolute left-1/2 top-1/2 h-[2px] w-1/2 origin-left -translate-y-1/2"
            style={{ background: 'linear-gradient(90deg, rgba(255,140,66,0.9), rgba(255,140,66,0.15), transparent)' }} />
        </div>

        {/* Rings, range ticks, crosshair, bearings */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" fill="none">
          {[60, 110, 160, 196].map((r, i) => (
            <circle key={r} cx="200" cy="200" r={r}
              stroke={i === 3 ? 'rgba(155,93,229,0.30)' : 'rgba(255,140,66,0.22)'}
              strokeWidth={i === 3 ? 1.4 : 1} />
          ))}
          {/* crosshair axes */}
          <line x1="200" y1="4" x2="200" y2="396" stroke="rgba(91,200,245,0.28)" strokeWidth="1" strokeDasharray="2 8" />
          <line x1="4" y1="200" x2="396" y2="200" stroke="rgba(91,200,245,0.28)" strokeWidth="1" strokeDasharray="2 8" />
          {/* range ticks around outer ring */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180
            const r1 = i % 3 === 0 ? 184 : 190
            return (
              <line key={i}
                x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)}
                x2={200 + 196 * Math.cos(a)} y2={200 + 196 * Math.sin(a)}
                stroke="rgba(45,42,62,0.18)" strokeWidth={i % 3 === 0 ? 1.4 : 0.7} />
            )
          })}
          <circle cx="200" cy="200" r="3" fill="rgba(255,140,66,0.8)" />
        </svg>

        {/* Detected-signal blips */}
        {[
          { x: '68%', y: '32%', d: '0s',   c: 'bg-dora-orange' },
          { x: '30%', y: '60%', d: '1.1s', c: 'bg-sky-blue-d' },
          { x: '58%', y: '70%', d: '2.2s', c: 'bg-adv-purple' },
          { x: '40%', y: '26%', d: '1.7s', c: 'bg-meadow-green' },
        ].map((b, i) => (
          <span key={i}
            className={`absolute w-2.5 h-2.5 rounded-full motion-reduce:hidden animate-blip ${b.c}`}
            style={{ left: b.x, top: b.y, animationDelay: b.d, boxShadow: '0 0 10px currentColor' }} />
        ))}
      </div>
    </div>
  )
}

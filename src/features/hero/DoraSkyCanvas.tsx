// Pure CSS illustrated landscape — replaces WaveCanvas on HeroPage.
// No canvas API — just CSS animations and inline SVG shapes.
export function DoraSkyCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* Sky gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #B8E4FF 0%, #E3F4FF 55%, #D8F7E4 100%)',
        }}
      />

      {/* Sparkle stars */}
      {([
        { top: '8%',  left: '12%', delay: '0s',    size: '14px', color: '#FFCA3A' },
        { top: '14%', left: '72%', delay: '0.8s',  size: '10px', color: '#FFCA3A' },
        { top: '22%', left: '88%', delay: '1.6s',  size: '12px', color: '#FFCA3A' },
        { top: '6%',  left: '45%', delay: '2.4s',  size: '8px',  color: '#FFFFFF' },
        { top: '30%', left: '28%', delay: '1.2s',  size: '10px', color: '#FFCA3A' },
        { top: '18%', left: '58%', delay: '3.2s',  size: '8px',  color: '#FFFFFF' },
      ] as const).map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle"
          style={{
            top: s.top, left: s.left,
            animationDelay: s.delay,
            fontSize: s.size,
            color: s.color,
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      ))}

      {/* Cloud 1 — large, left */}
      <div
        className="absolute animate-float"
        style={{ top: '8%', left: '6%', animationDelay: '0s' }}
      >
        <CloudShape width={180} />
      </div>

      {/* Cloud 2 — medium, center-right */}
      <div
        className="absolute animate-float-slow"
        style={{ top: '5%', left: '58%', animationDelay: '2s' }}
      >
        <CloudShape width={130} />
      </div>

      {/* Cloud 3 — small, far right */}
      <div
        className="absolute animate-float"
        style={{ top: '12%', right: '4%', animationDelay: '4s' }}
      >
        <CloudShape width={90} />
      </div>

      {/* Ground strip */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '22%',
          background: 'linear-gradient(180deg, #D8F7E4 0%, #B0ECC5 100%)',
          borderRadius: '60% 60% 0 0 / 30px 30px 0 0',
        }}
      />

      {/* Trees left */}
      <div className="absolute bottom-[18%] left-[4%]">
        <TreeShape height={130} />
      </div>
      <div className="absolute bottom-[18%] left-[9%]">
        <TreeShape height={100} />
      </div>

      {/* Tree right */}
      <div className="absolute bottom-[18%] right-[5%]">
        <TreeShape height={140} />
      </div>

      {/* Flowers in ground strip */}
      {([
        { left: '18%', color: '#FF8C42', delay: '0s'   },
        { left: '32%', color: '#FFCA3A', delay: '0.4s' },
        { left: '48%', color: '#FF5E5B', delay: '0.8s' },
        { left: '62%', color: '#9B5DE5', delay: '0.2s' },
        { left: '76%', color: '#FF8C42', delay: '0.6s' },
      ] as const).map((f, i) => (
        <div
          key={i}
          className="absolute animate-sway"
          style={{
            bottom: '19%',
            left: f.left,
            animationDelay: f.delay,
            transformOrigin: 'bottom center',
          }}
        >
          <FlowerShape color={f.color} />
        </div>
      ))}
    </div>
  )
}

function CloudShape({ width }: { width: number }) {
  const h = Math.round(width * 0.42)
  return (
    <div
      style={{
        width,
        height: h,
        background: '#FFFFFF',
        borderRadius: '50%',
        boxShadow: `
          ${Math.round(width * 0.22)}px ${Math.round(h * 0.15)}px 0 ${Math.round(width * -0.05)}px #FFFFFF,
          ${Math.round(width * 0.55)}px ${Math.round(h * 0.1)}px 0 ${Math.round(width * -0.08)}px #FFFFFF,
          0 ${Math.round(h * 0.3)}px ${Math.round(width * 0.12)}px rgba(200,230,255,0.5)
        `,
        opacity: 0.92,
      }}
    />
  )
}

function TreeShape({ height }: { height: number }) {
  const trunkW = Math.round(height * 0.14)
  const crownR = Math.round(height * 0.38)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: crownR * 2,
          height: crownR * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #6ED882, #3DAD5A)',
          boxShadow: '0 4px 12px rgba(61,173,90,0.35)',
          marginBottom: -Math.round(crownR * 0.4),
        }}
      />
      <div
        style={{
          width: trunkW,
          height: Math.round(height * 0.32),
          background: 'linear-gradient(180deg, #8B6340, #6B4A28)',
          borderRadius: `0 0 ${Math.round(trunkW * 0.4)}px ${Math.round(trunkW * 0.4)}px`,
        }}
      />
    </div>
  )
}

function FlowerShape({ color }: { color: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      {/* Stem */}
      <line x1="10" y1="12" x2="10" y2="24" stroke="#56C271" strokeWidth="2.5" strokeLinecap="round" />
      {/* Petals */}
      {([0, 72, 144, 216, 288] as const).map((deg, i) => (
        <ellipse
          key={i}
          cx={10 + 5 * Math.cos((deg - 90) * Math.PI / 180)}
          cy={6  + 5 * Math.sin((deg - 90) * Math.PI / 180)}
          rx="3.5"
          ry="2"
          fill={color}
          opacity="0.9"
          transform={`rotate(${deg}, ${10 + 5 * Math.cos((deg - 90) * Math.PI / 180)}, ${6 + 5 * Math.sin((deg - 90) * Math.PI / 180)})`}
        />
      ))}
      {/* Center */}
      <circle cx="10" cy="6" r="3" fill="#FFCA3A" />
    </svg>
  )
}

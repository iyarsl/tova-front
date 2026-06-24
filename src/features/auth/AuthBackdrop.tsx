// Calm, static backdrop for the login screen — color blooms only, no
// scanning grid / radar sweep / blips (those belong on the Hero showpiece
// and read as noisy clutter behind a focused sign-in form).
export function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#E3F4FF_0%,#EDF2FF_45%,#FFF6EC_100%)]" />

      <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(91,200,245,0.20),transparent_70%)]" />
      <div className="absolute -top-28 right-[-10%] w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,140,66,0.16),transparent_70%)]" />
      <div className="absolute bottom-[-20%] left-[12%] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(155,93,229,0.13),transparent_72%)]" />
      <div className="absolute bottom-[-14%] right-[8%] w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(86,194,113,0.11),transparent_72%)]" />

      {/* single static ring pair — restrained technical motif, no motion */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] opacity-40"
        viewBox="0 0 400 400" fill="none"
      >
        <circle cx="200" cy="200" r="196" stroke="rgba(45,42,62,0.05)" strokeWidth="1" />
        <circle cx="200" cy="200" r="148" stroke="rgba(45,42,62,0.05)" strokeWidth="1" />
      </svg>
    </div>
  )
}

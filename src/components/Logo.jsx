export default function Logo({ small = false }) {
  return (
    <div className={`relative shrink-0 ${small ? 'h-10 w-10' : 'h-24 w-24 md:h-32 md:w-32'}`}>
      <div className="absolute inset-0 animate-spin rounded-full bg-gradient-to-br from-emerald-200 via-lime-300 to-green-800 shadow-2xl shadow-emerald-900/30" />
      <div className="absolute inset-[7%] overflow-hidden rounded-full bg-[#0c2418] ring-1 ring-white/20">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="mossLight" cx="35%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#e6ffd2" />
              <stop offset="45%" stopColor="#6cbf45" />
              <stop offset="100%" stopColor="#183f25" />
            </radialGradient>
            <radialGradient id="mossDark" cx="65%" cy="75%" r="70%">
              <stop offset="0%" stopColor="#9ae66e" />
              <stop offset="55%" stopColor="#285c30" />
              <stop offset="100%" stopColor="#07140e" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#mossLight)" />
          <path d="M50 2a48 48 0 0 1 0 96c-16 0-24-12-24-24s8-24 24-24 24-12 24-24S66 2 50 2z" fill="url(#mossDark)" />
          <circle cx="50" cy="26" r="8" fill="#082015" />
          <circle cx="50" cy="74" r="8" fill="#dfffc5" />
        </svg>
      </div>
      <div className="absolute -right-1 top-2 rounded-full bg-lime-200 px-1.5 py-0.5 text-xs text-emerald-950 shadow-lg">✦</div>
    </div>
  );
}

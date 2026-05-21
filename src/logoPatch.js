const logoSvg = `
  <svg viewBox="0 0 128 128" class="lakiza-inline-logo__svg" role="img" aria-label="Логотип Лакиза — инь-янь из зелёного и чёрного мха">
    <defs>
      <radialGradient id="lakizaMossGreen" cx="31%" cy="23%" r="78%">
        <stop offset="0" stop-color="#f0ffd8"/>
        <stop offset="0.24" stop-color="#cfff7a"/>
        <stop offset="0.62" stop-color="#76b946"/>
        <stop offset="1" stop-color="#16341f"/>
      </radialGradient>
      <radialGradient id="lakizaMossDark" cx="70%" cy="72%" r="82%">
        <stop offset="0" stop-color="#385f35"/>
        <stop offset="0.42" stop-color="#13281a"/>
        <stop offset="1" stop-color="#030806"/>
      </radialGradient>
      <linearGradient id="lakizaRim" x1="16" y1="10" x2="114" y2="118">
        <stop offset="0" stop-color="#efffd5" stop-opacity=".95"/>
        <stop offset=".45" stop-color="#85bf4c" stop-opacity=".55"/>
        <stop offset="1" stop-color="#0b1b12" stop-opacity=".92"/>
      </linearGradient>
      <filter id="lakizaSoftGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feColorMatrix in="blur" values="0 0 0 0 .64 0 0 0 0 1 0 0 0 0 .28 0 0 0 .55 0"/>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="64" cy="64" r="58" fill="#05120b" filter="url(#lakizaSoftGlow)"/>
    <circle cx="64" cy="64" r="55" fill="none" stroke="url(#lakizaRim)" stroke-width="5"/>
    <circle cx="64" cy="64" r="49" fill="url(#lakizaMossGreen)"/>
    <path d="M64 15a49 49 0 0 1 0 98c-15.5 0-24.5-10.5-24.5-24.5S48.5 64 64 64s24.5-10.5 24.5-24.5S79.5 15 64 15z" fill="url(#lakizaMossDark)"/>
    <circle cx="64" cy="39.5" r="8.5" fill="#07110c"/>
    <circle cx="64" cy="88.5" r="8.5" fill="#d7ff8a"/>
    <g opacity=".24" fill="none" stroke-linecap="round">
      <path d="M32 33c8-8 17-12 30-13" stroke="#efffd5" stroke-width="3"/>
      <path d="M24 64c2 17 11 30 26 38" stroke="#9edc61" stroke-width="2"/>
      <path d="M79 26c17 8 27 24 25 43" stroke="#263529" stroke-width="3"/>
      <path d="M72 104c14-3 24-11 29-24" stroke="#0b160f" stroke-width="2"/>
    </g>
    <circle cx="64" cy="64" r="49" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1"/>
  </svg>
`;

function applyLakizaLogo() {
  document.querySelectorAll('.moss-logo, span.relative.grid.h-11.w-11, span.relative.grid.h-12.w-12, .lakiza-inline-logo').forEach((mark) => {
    if (mark.dataset.logoVersion === 'sharp-128') return;
    mark.dataset.logoApplied = 'true';
    mark.dataset.logoVersion = 'sharp-128';
    mark.className = 'lakiza-inline-logo';
    mark.innerHTML = logoSvg;
  });

  document.querySelectorAll('header button[type="button"]').forEach((button) => {
    const text = button.textContent || '';
    if (text.includes('ЛАКИЗА') || button.querySelector('.lakiza-inline-logo')) {
      button.setAttribute('aria-label', 'Вернуться на главную страницу');
    }
  });
}

const style = document.createElement('style');
style.textContent = `
  .lakiza-inline-logo {
    position: relative;
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
    border-radius: 999px;
    overflow: visible;
    background: transparent;
    transform: translateZ(0);
    filter: drop-shadow(0 0 12px rgba(201,255,116,.34));
  }
  .lakiza-inline-logo__svg {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 999px;
    shape-rendering: geometricPrecision;
    text-rendering: geometricPrecision;
  }
  @media (min-width: 768px) {
    .lakiza-inline-logo { width: 3.35rem; height: 3.35rem; }
  }
`;
document.head.appendChild(style);

const observer = new MutationObserver(applyLakizaLogo);
observer.observe(document.documentElement, { childList: true, subtree: true });
queueMicrotask(applyLakizaLogo);
window.addEventListener('load', applyLakizaLogo, { once: true });

const logoSvg = `
  <svg viewBox="0 0 100 100" class="lakiza-inline-logo__svg" role="img" aria-label="Логотип Лакиза — инь-янь из зелёного и чёрного мха">
    <defs>
      <radialGradient id="lakizaMossGreen" cx="33%" cy="24%" r="72%">
        <stop offset="0" stop-color="#efffd5"/>
        <stop offset="0.22" stop-color="#bfff62"/>
        <stop offset="0.55" stop-color="#6aa83b"/>
        <stop offset="1" stop-color="#102417"/>
      </radialGradient>
      <radialGradient id="lakizaMossDark" cx="70%" cy="70%" r="76%">
        <stop offset="0" stop-color="#244b2b"/>
        <stop offset="0.48" stop-color="#0f2518"/>
        <stop offset="1" stop-color="#020806"/>
      </radialGradient>
      <filter id="lakizaMossTexture" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="9" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
        <feBlend in="SourceGraphic" in2="mono" mode="overlay"/>
      </filter>
      <filter id="lakizaLogoGlow" x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="2.7" result="blur"/>
        <feColorMatrix in="blur" values="0 0 0 0 0.65 0 0 0 0 1 0 0 0 0 0.18 0 0 0 .72 0"/>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="46" fill="#06140d" stroke="rgba(220,255,150,.42)" stroke-width="2" filter="url(#lakizaLogoGlow)"/>
    <g filter="url(#lakizaMossTexture)">
      <circle cx="50" cy="50" r="42" fill="url(#lakizaMossGreen)"/>
      <path d="M50 8a42 42 0 0 1 0 84c-13.8 0-21-9.4-21-21s7.2-21 21-21 21-9.4 21-21S63.8 8 50 8z" fill="url(#lakizaMossDark)"/>
      <circle cx="50" cy="29" r="7.5" fill="#07140e"/>
      <circle cx="50" cy="71" r="7.5" fill="#cfff85"/>
    </g>
    <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
  </svg>
`;

function applyLakizaLogo() {
  document.querySelectorAll('.moss-logo, span.relative.grid.h-11.w-11, span.relative.grid.h-12.w-12').forEach((mark) => {
    if (mark.dataset.logoApplied === 'true') return;
    mark.dataset.logoApplied = 'true';
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
    filter: drop-shadow(0 0 16px rgba(201,255,116,.28));
  }
  .lakiza-inline-logo__svg {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 999px;
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

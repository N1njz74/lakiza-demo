import heroMobileImage from './heroMobileImage.js';

function applyMobileHero() {
  const isMobile = window.matchMedia('(max-width: 767px), (orientation: portrait)').matches;
  if (!isMobile) return;
  const hero = document.querySelector('.lakiza-hero-img');
  if (hero && hero.tagName === 'IMG') {
    hero.src = heroMobileImage;
    hero.style.objectPosition = '50% 45%';
    hero.style.filter = 'saturate(1.08) contrast(1.05) brightness(.92)';
  }
  document.querySelectorAll('[style*="lakiza-hero-massage"]').forEach((node) => {
    node.style.backgroundImage = `linear-gradient(90deg,rgba(4,16,8,.72),rgba(4,16,8,.2)),url(${heroMobileImage})`;
    node.style.backgroundPosition = 'center';
  });
}

const observer = new MutationObserver(applyMobileHero);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('resize', applyMobileHero, { passive: true });
window.addEventListener('orientationchange', applyMobileHero, { passive: true });
queueMicrotask(applyMobileHero);

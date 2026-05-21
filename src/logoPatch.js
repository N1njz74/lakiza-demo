import logoMossYinYang from './logoMossYinYang.js';

function applyLakizaLogo() {
  const headerButton = document.querySelector('header button[type="button"]');
  if (!headerButton) return;

  const mark = headerButton.querySelector('span.relative.grid.h-11.w-11');
  if (!mark || mark.dataset.logoApplied === 'true') return;

  mark.dataset.logoApplied = 'true';
  mark.className = 'relative grid h-12 w-12 shrink-0 place-items-center overflow-visible rounded-full bg-transparent shadow-[0_0_28px_rgba(216,255,135,.32)]';
  mark.innerHTML = `
    <img
      src="${logoMossYinYang}"
      alt="Логотип массажного кабинета Лакиза — инь-янь из зелёного и чёрного мха"
      class="h-12 w-12 rounded-full object-cover drop-shadow-[0_0_16px_rgba(216,255,135,.45)]"
      loading="eager"
    />
  `;
  headerButton.setAttribute('aria-label', 'Вернуться на начало главной страницы');
}

const observer = new MutationObserver(applyLakizaLogo);
observer.observe(document.documentElement, { childList: true, subtree: true });
queueMicrotask(applyLakizaLogo);
window.addEventListener('load', applyLakizaLogo, { once: true });

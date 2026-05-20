const STYLE_ID = 'lakiza-calendar-enhance-style';
const CLOCK_ID = 'lakiza-live-clock';
let rafQueued = false;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .calendar-fx { position: relative !important; border: 1px solid rgba(213,255,151,.12); box-shadow: inset 0 0 28px rgba(213,255,151,.04), 0 18px 50px rgba(0,0,0,.18); }
    .calendar-fx-side { position: absolute !important; top: 54% !important; z-index: 5 !important; width: 38px !important; height: 64px !important; padding: 0 !important; border-radius: 999px !important; border: 1px solid rgba(214,255,158,.22) !important; background: rgba(4,17,9,.42) !important; color: rgba(220,255,166,.96) !important; backdrop-filter: blur(10px); box-shadow: 0 0 24px rgba(199,255,115,.12), inset 0 0 18px rgba(214,255,158,.08); font-size: 26px !important; line-height: 1 !important; opacity: .78; transform: translateY(-50%); }
    .calendar-fx-side:active { transform: translateY(-50%) scale(.94); opacity: 1; }
    .calendar-fx-prev { left: 4px !important; }
    .calendar-fx-next { right: 4px !important; }
    .calendar-fx-grid { will-change: transform, opacity; }
    .calendar-fx.fx-next .calendar-fx-grid { animation: lakizaMonthNext .28s cubic-bezier(.22,1,.36,1); }
    .calendar-fx.fx-prev .calendar-fx-grid { animation: lakizaMonthPrev .28s cubic-bezier(.22,1,.36,1); }
    .calendar-fx button { transition: transform .18s ease, background-color .25s ease, box-shadow .25s ease, opacity .25s ease; }
    .calendar-fx button:hover { box-shadow: 0 0 0 1px rgba(213,255,151,.18), 0 0 24px rgba(213,255,151,.08); }
    #${CLOCK_ID} { margin: 0 0 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid rgba(213,255,151,.13); border-radius: 14px; background: linear-gradient(135deg, rgba(213,255,151,.08), rgba(0,0,0,.18)); padding: 9px 11px; color: #eaffc8; box-shadow: inset 0 0 24px rgba(213,255,151,.04); }
    #${CLOCK_ID} b { font-size: 19px; letter-spacing: .04em; }
    #${CLOCK_ID} span { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .14em; color: rgba(222,255,185,.58); }
    .lakiza-slot { position: relative; isolation: isolate; overflow: hidden; transition: background-color .95s linear, border-color .95s linear, opacity .95s linear, box-shadow .95s linear; }
    .lakiza-slot::before { content: ''; position: absolute; inset: 0; z-index: -1; transform-origin: left center; transform: scaleX(var(--slot-progress-ratio, 0)); background: linear-gradient(90deg, rgba(8,42,24,.56), rgba(207,255,118,.24), rgba(49,111,255,.18)); transition: transform .95s linear; will-change: transform; }
    .lakiza-slot::after { content: ''; position: absolute; top: 0; bottom: 0; left: var(--slot-x, -10px); width: 2px; background: rgba(220,255,150,.95); box-shadow: 0 0 12px rgba(220,255,150,.75); opacity: 0; transition: left .95s linear, opacity .25s ease; pointer-events: none; }
    .lakiza-slot-past { opacity: .52 !important; filter: saturate(.62); background-color: rgba(255,255,255,.035) !important; border-color: rgba(255,255,255,.05) !important; }
    .lakiza-slot-current { opacity: 1 !important; border-color: rgba(212,255,139,.45) !important; box-shadow: 0 0 0 1px rgba(212,255,139,.2), 0 0 20px rgba(212,255,139,.12) !important; }
    .lakiza-slot-current::after { opacity: 1; }
    .lakiza-slot-future { background-color: rgba(255,255,255,.055) !important; border-color: rgba(190,230,255,.12) !important; }
    .lakiza-now-badge { position: absolute; right: 8px; top: 6px; border-radius: 999px; background: rgba(7,20,14,.76); color: #d8ff98; padding: 2px 6px; font-size: 8px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; pointer-events: none; }
    @keyframes lakizaMonthNext { from { opacity: .2; transform: translateX(34px) scale(.985); filter: blur(5px); } to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); } }
    @keyframes lakizaMonthPrev { from { opacity: .2; transform: translateX(-34px) scale(.985); filter: blur(5px); } to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); } }
  `;
  document.head.appendChild(style);
}

function pad(n) { return String(n).padStart(2, '0'); }
function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function clock() {
  const d = new Date();
  const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  return { date: localDate(d), seconds, label: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` };
}
function slotState(date, hour, now) {
  const start = Number(hour.slice(0, 2)) * 3600;
  const end = start + 3600;
  if (date < now.date) return 'past';
  if (date > now.date) return 'future';
  if (now.seconds >= end) return 'past';
  if (now.seconds < start) return 'future';
  return 'current';
}
function findDateFor(el) {
  let node = el;
  for (let i = 0; i < 8 && node; i += 1) {
    const text = node.textContent || '';
    const match = text.match(/20\d{2}-\d{2}-\d{2}/);
    if (match) return match[0];
    node = node.parentElement;
  }
  return clock().date;
}
function progressFor(hour, now, state) {
  if (state === 'past') return 1;
  if (state === 'future') return 0;
  const start = Number(hour.slice(0, 2)) * 3600;
  return Math.max(0, Math.min(1, (now.seconds - start) / 3600));
}

function pulse(root, dir) {
  root.classList.remove('fx-prev', 'fx-next');
  void root.offsetWidth;
  root.classList.add(dir > 0 ? 'fx-next' : 'fx-prev');
  window.setTimeout(() => root.classList.remove('fx-prev', 'fx-next'), 320);
}

function enhanceCalendar() {
  injectStyle();
  const buttons = Array.from(document.querySelectorAll('button'));
  const prev = buttons.find((b) => b.textContent.trim() === '‹');
  const next = buttons.find((b) => b.textContent.trim() === '›');
  if (prev && next) {
    const root = prev.parentElement?.parentElement;
    if (root) {
      root.classList.add('calendar-fx');
      prev.classList.add('calendar-fx-side', 'calendar-fx-prev');
      next.classList.add('calendar-fx-side', 'calendar-fx-next');
      if (!prev.dataset.fxBound) { prev.dataset.fxBound = '1'; prev.addEventListener('click', () => pulse(root, -1), true); }
      if (!next.dataset.fxBound) { next.dataset.fxBound = '1'; next.addEventListener('click', () => pulse(root, 1), true); }
      const grids = Array.from(root.querySelectorAll('div')).filter((el) => el.children.length >= 28);
      grids.at(-1)?.classList.add('calendar-fx-grid');
    }
  }
  buttons.forEach((b) => {
    const t = b.textContent.trim();
    if (t === '+3 мес' || t === '+1 год') b.style.display = 'none';
  });
}

function enhanceClockAndSlots() {
  const now = clock();
  const title = Array.from(document.querySelectorAll('h1')).find((h) => h.textContent.includes('Ежедневник'));
  if (title) {
    let badge = document.getElementById(CLOCK_ID);
    if (!badge) {
      badge = document.createElement('div');
      badge.id = CLOCK_ID;
      title.parentElement?.insertAdjacentElement('afterend', badge);
    }
    badge.innerHTML = `<div><span>текущее время</span><br><b>${now.label}</b></div><div><span>линия времени: 1 сек</span></div>`;
  }

  const labels = Array.from(document.querySelectorAll('span')).filter((s) => /^(0[8-9]|1[0-9]):00$/.test(s.textContent.trim()));
  labels.forEach((label) => {
    const hour = label.textContent.trim();
    const slot = label.nextElementSibling;
    if (!slot) return;
    const date = findDateFor(label);
    const state = slotState(date, hour, now);
    const progress = progressFor(hour, now, state);
    slot.classList.add('lakiza-slot');
    slot.classList.remove('lakiza-slot-past', 'lakiza-slot-current', 'lakiza-slot-future');
    slot.classList.add(`lakiza-slot-${state}`);
    slot.style.setProperty('--slot-progress-ratio', String(progress));
    slot.style.setProperty('--slot-x', `${Math.round(slot.getBoundingClientRect().width * progress)}px`);
    let badge = slot.querySelector(':scope > .lakiza-now-badge');
    if (state === 'current') {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'lakiza-now-badge';
        badge.textContent = 'сейчас';
        slot.appendChild(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  });
}

function run() {
  if (document.hidden) return;
  enhanceCalendar();
  enhanceClockAndSlots();
}
function scheduleRun() {
  if (rafQueued) return;
  rafQueued = true;
  window.requestAnimationFrame(() => { rafQueued = false; run(); });
}

if (!window.__lakizaCalendarEnhance) {
  window.__lakizaCalendarEnhance = true;
  window.addEventListener('load', scheduleRun);
  window.addEventListener('resize', scheduleRun);
  document.addEventListener('visibilitychange', scheduleRun);
  window.setInterval(scheduleRun, 1000);
  const observer = new MutationObserver(scheduleRun);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

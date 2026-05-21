import AdminPro from './AdminPro.jsx';
import ClientPortal from './ClientPortal.jsx';
import AdminStatsConsolePlus from './AdminStatsConsolePlus.jsx';
import StaffScheduleConsole from './StaffScheduleConsole.jsx';
import AdminNavigationMenu from './AdminNavigationMenu.jsx';
import TherapistPortal from './TherapistPortal.jsx';
import MessageHubV4 from './MessageHubV4.jsx';
import './visual-theme.css';
import './messenger-theme.css';
import './hero-bg.css';
import './demo-rich-data.js';

const ACTIVE_BUILD = 'messenger-accent-2026-05-21';
const ADMIN_STAFF_DEFAULTS = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', address: 'адрес доступен администратору', shift: 0, workStart: 8, workEnd: 20, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', address: 'адрес доступен администратору', shift: 1, workStart: 9, workEnd: 21, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', address: 'адрес доступен администратору', shift: 2, workStart: 7, workEnd: 19, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', address: 'адрес доступен администратору', shift: 3, workStart: 8, workEnd: 21, active: true },
];

function name(user) { return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь'; }
function roleLabel(role) { return { admin: 'Администратор', therapist: 'Массажист', client: 'Клиент' }[role] || role; }
function ensureAdminAddressDemoData() {
  try {
    const key = 'lakizaAdminSchedulerStaff';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(current) || current.length === 0) { localStorage.setItem(key, JSON.stringify(ADMIN_STAFF_DEFAULTS)); return; }
    const next = current.map((item) => {
      const fallback = ADMIN_STAFF_DEFAULTS.find((staff) => staff.id === item.id);
      if (!fallback) return item;
      const isHidden = !item.address || item.address === 'служебный адрес скрыт';
      return { ...fallback, ...item, address: isHidden ? fallback.address : item.address, workStart: Number(item.workStart ?? fallback.workStart ?? 8), workEnd: Number(item.workEnd ?? fallback.workEnd ?? 20) };
    });
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

export default function RoleApp({ user, logout, onUserUpdate }) {
  if (user.role === 'admin') { ensureAdminAddressDemoData(); return <Shell user={user} logout={logout}><AdminNavigationMenu role={user.role} /><AdminPro /><AdminStatsConsolePlus /><StaffScheduleConsole /></Shell>; }
  if (user.role === 'client') return <Shell user={user} logout={logout}><ClientPortal user={user} onUserUpdate={onUserUpdate} /></Shell>;
  return <Shell user={user} logout={logout}><TherapistPortal user={user} /></Shell>;
}

function Shell({ user, logout, children }) {
  return <main className="lakiza-shell min-h-screen overflow-x-hidden bg-[#06110b] text-white"><div className="lakiza-bg fixed inset-0" /><div className="lakiza-orb lakiza-orb-a" /><div className="lakiza-orb lakiza-orb-b" /><div className="lakiza-lines" /><SalonDecor /><header className="fixed left-0 right-0 top-0 z-50 px-2 pt-2 md:px-8"><div className="mx-auto max-w-7xl rounded-[1.15rem] border border-white/10 bg-[#06140d]/88 px-3 py-2 shadow-2xl shadow-black/35 backdrop-blur-xl md:px-5 md:py-3"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-3"><MossLogo /><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><div className="truncate text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">массажный кабинет</div><span className="hidden rounded-full border border-lime-200/15 bg-black/20 px-1.5 py-0.5 text-[8px] font-black text-lime-300/55 sm:inline">{ACTIVE_BUILD}</span></div><div className="mt-0.5 truncate text-lg font-black leading-none tracking-[.14em] text-lime-100 md:text-xl">«ЛАКИЗА»</div><div className="truncate text-[11px] font-bold text-emerald-100/55">{roleLabel(user.role)} · {name(user)}</div></div></div><div className="flex shrink-0 flex-col items-end gap-1"><span className="rounded-full border border-lime-200/15 bg-black/20 px-1.5 py-0.5 text-[8px] font-black text-lime-300/55 sm:hidden">{ACTIVE_BUILD}</span><button type="button" onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50 shadow-inner shadow-white/5">Выйти</button></div></div></div></header><section className="relative mx-auto max-w-7xl overflow-x-hidden px-2 pb-24 pt-[98px] md:px-8 md:pt-28">{children}</section><MessageHubV4 user={user} /></main>;
}
function SalonDecor() { return <div className="salon-decor" aria-hidden="true"><div className="salon-decor__couch"><span className="salon-decor__pillow" /><span className="salon-decor__leg salon-decor__leg-a" /><span className="salon-decor__leg salon-decor__leg-b" /></div><div className="salon-decor__hands"><span /><span /></div><div className="salon-decor__leaf salon-decor__leaf-a" /><div className="salon-decor__leaf salon-decor__leaf-b" /><div className="salon-decor__lamp" /></div>; }
function MossLogo() { return <div className="moss-logo" aria-hidden="true"><div className="moss-logo__glow" /><div className="moss-logo__circle"><span className="moss-logo__dot moss-logo__dot-dark" /><span className="moss-logo__dot moss-logo__dot-green" /></div></div>; }

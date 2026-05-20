import Logo from './Logo.jsx';
import { roles } from '../data.js';

export default function Header({ view, setView, role, setRole, onStartDemo }) {
  const tabs = role === 'client'
    ? [['home', 'Главная'], ['services', 'Сеансы'], ['schedule', 'Запись']]
    : role === 'therapist'
      ? [['home', 'Главная'], ['therapist', 'Моё расписание'], ['schedule', 'Запись клиента']]
      : [['home', 'Главная'], ['schedule', 'Запись'], ['therapist', 'Расписание'], ['services', 'Сеансы']];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 md:px-8 md:pt-4">
      <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-[#07140e]/85 px-3 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 md:gap-3">
          <button type="button" onClick={() => setView('home')} className="flex min-w-0 shrink items-center gap-2 text-left md:gap-3">
            <Logo small />
            <div className="min-w-0"><div className="truncate text-xs font-semibold tracking-[0.18em] text-lime-100 md:text-sm md:tracking-[0.22em]">ЛАКИЗА</div><div className="hidden text-xs text-emerald-100/60 sm:block">массажный кабинет</div></div>
          </button>
          <nav className="hidden items-center gap-1 lg:flex">
            {tabs.map(([target, label]) => <button key={target} type="button" onClick={() => setView(target)} className={`rounded-full px-4 py-2 text-sm ${view === target ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/75 hover:bg-white/10'}`}>{label}</button>)}
          </nav>
          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[92px] rounded-full border border-white/10 bg-white/10 px-2 py-2 text-xs font-bold text-lime-50 outline-none sm:max-w-[130px] md:max-w-none md:px-3 md:text-sm">
              {Object.entries(roles).map(([key, item]) => <option key={key} value={key} className="bg-emerald-950">{item.label}</option>)}
            </select>
            <button type="button" onClick={onStartDemo} className="whitespace-nowrap rounded-full bg-blue-600 px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-950/20 md:px-4 md:text-sm">Демо</button>
          </div>
        </div>
      </div>
    </header>
  );
}

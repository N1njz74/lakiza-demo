import { useState } from 'react';

function cx(...items) { return items.filter(Boolean).join(' '); }
function emit(name) { window.dispatchEvent(new CustomEvent(name)); }

export default function AdminNavigationMenu({ role }) {
  const [open, setOpen] = useState(false);
  if (role !== 'admin') return null;
  const actions = [
    { title: 'Главный календарь', text: 'ежедневник, список, загрузка', event: null },
    { title: 'Клиенты и статистика', text: 'история, вес, часы, заметки', event: 'lakiza:open-client-stats' },
    { title: 'Люди и расписания', text: 'графики сотрудников, рабочее время', event: 'lakiza:open-staff-schedule' },
    { title: 'Запросы согласования', text: 'переносы и отмены клиентов', event: 'lakiza:open-client-stats' },
  ];
  const click = (item) => {
    if (item.event) emit(item.event);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    setOpen(false);
  };
  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed left-3 top-[104px] z-[75] rounded-full border border-lime-200/20 bg-[#06140d]/90 px-4 py-3 text-xs font-black text-lime-100 shadow-2xl shadow-black/45 backdrop-blur-xl">
      ☰ Меню
    </button>
    {open && <div className="fixed inset-0 z-[120] bg-black/60 text-white backdrop-blur-sm" onClick={() => setOpen(false)}>
      <aside className="h-full w-[86vw] max-w-sm border-r border-white/10 bg-[#07140e] p-4 shadow-2xl shadow-black" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300/60">администратор</div><h2 className="text-3xl font-black tracking-[-.06em] text-lime-50">Навигация</h2></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">×</button>
        </div>
        <div className="grid gap-2">
          {actions.map((item, index) => <button key={item.title} type="button" onClick={() => click(item)} className={cx('rounded-2xl p-4 text-left transition active:scale-[.99]', index === 2 ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}>
            <b className="block text-base">{item.title}</b>
            <span className="mt-1 block text-xs opacity-65">{item.text}</span>
          </button>)}
        </div>
        <div className="mt-4 rounded-2xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/80">
          Рабочее время сотрудников теперь задаётся индивидуально: например, 07:00–19:00 или 09:00–21:00.
        </div>
      </aside>
    </div>}
  </>;
}

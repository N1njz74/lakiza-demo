import { useMemo, useState } from 'react';

const STORAGE_EVENTS = 'lakizaAdminSchedulerEvents';
const STORAGE_STAFF = 'lakizaAdminSchedulerStaff';
const START_HOUR = 8;
const END_HOUR = 20;

const initialStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', address: 'служебный адрес скрыт', shift: 0, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', address: 'служебный адрес скрыт', shift: 1, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', address: 'служебный адрес скрыт', shift: 2, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', address: 'служебный адрес скрыт', shift: 3, active: true },
];

const services = ['Спина и шея', 'Классический массаж', 'Антистресс', 'Лимфодренаж', 'Курс 4 сеанса'];

function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); }
function dayIndex(date) { return Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000); }
function isWorking(person, date) { return ((dayIndex(date) + Number(person.shift || 0)) % 4) < 2; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function hours() { return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${String(START_HOUR + i).padStart(2, '0')}:00`); }
function makeEvents() {
  const d = today();
  return [
    { id: 'e1', date: d, time: '09:00', duration: 60, staffId: 'kristina', client: 'Ирина Климова', phone: '+7 900 111-22-33', service: 'Спина и шея', status: 'confirmed', note: 'просила мягко' },
    { id: 'e2', date: d, time: '14:00', duration: 90, staffId: 'kristina', client: 'Олег Петров', phone: '+7 900 444-55-66', service: 'Классический массаж', status: 'new', note: 'перезвонить' },
    { id: 'e3', date: d, time: '11:00', duration: 60, staffId: 'vera', client: 'Мария Волкова', phone: '+7 900 222-33-44', service: 'Антистресс', status: 'confirmed', note: '' },
    { id: 'e4', date: addDays(d, 1), time: '16:00', duration: 60, staffId: 'alina', client: 'Денис Серов', phone: '+7 900 555-44-33', service: 'Лимфодренаж', status: 'confirmed', note: '' },
    { id: 'e5', date: addDays(d, 2), time: '18:00', duration: 120, staffId: 'natalia', client: 'Анна Белова', phone: '+7 900 888-77-66', service: 'Курс 4 сеанса', status: 'new', note: '' },
  ];
}
function statusLabel(status) {
  return { new: 'новая заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена' }[status] || status;
}
function staffName(staff, id) { return staff.find((x) => x.id === id)?.name || id; }

export default function AdminPro() {
  const [tab, setTab] = useState('calendar');
  const [mode, setMode] = useState('day');
  const [date, setDate] = useState(today());
  const [filter, setFilter] = useState('all');
  const [staff, setStaff] = useState(() => readJson(STORAGE_STAFF, initialStaff));
  const [events, setEvents] = useState(() => readJson(STORAGE_EVENTS, makeEvents()));

  const activeStaff = staff.filter((x) => x.active !== false);
  const shownStaff = filter === 'all' ? activeStaff : activeStaff.filter((x) => x.id === filter);
  const visibleEvents = events.filter((e) => filter === 'all' || e.staffId === filter);

  const saveStaff = (next) => { setStaff(next); saveJson(STORAGE_STAFF, next); };
  const saveEvents = (next) => { setEvents(next); saveJson(STORAGE_EVENTS, next); };

  const patchEvent = (id, patch) => {
    const item = events.find((e) => e.id === id);
    if (!item) return;
    if (!window.confirm(`Сохранить изменения записи ${item.date} ${item.time}, ${item.client}?`)) return;
    saveEvents(events.map((e) => e.id === id ? { ...e, ...patch } : e));
  };
  const removeEvent = (id) => {
    const item = events.find((e) => e.id === id);
    if (!item) return;
    if (!window.confirm(`Удалить запись ${item.date} ${item.time}, ${item.client}?`)) return;
    saveEvents(events.filter((e) => e.id !== id));
  };
  const patchStaff = (id, patch) => {
    const item = staff.find((s) => s.id === id);
    if (!item) return;
    if (!window.confirm(`Сохранить изменения пользователя ${item.name}?`)) return;
    saveStaff(staff.map((s) => s.id === id ? { ...s, ...patch } : s));
  };
  const removeStaff = (id) => {
    const item = staff.find((s) => s.id === id);
    if (!item) return;
    if (!window.confirm(`Удалить/скрыть массажиста ${item.name}? Его записи останутся в списке.`)) return;
    saveStaff(staff.map((s) => s.id === id ? { ...s, active: false } : s));
  };

  return (
    <div className="grid gap-5">
      <TopTabs tab={tab} setTab={setTab} />
      {tab === 'calendar' && <CalendarView mode={mode} setMode={setMode} date={date} setDate={setDate} staff={activeStaff} shownStaff={shownStaff} events={visibleEvents} filter={filter} setFilter={setFilter} patchEvent={patchEvent} removeEvent={removeEvent} />}
      {tab === 'list' && <ListView events={visibleEvents} staff={activeStaff} filter={filter} setFilter={setFilter} patchEvent={patchEvent} removeEvent={removeEvent} />}
      {tab === 'load' && <LoadView staff={activeStaff} events={events} />}
      {tab === 'users' && <UsersView staff={staff} patchStaff={patchStaff} removeStaff={removeStaff} />}
    </div>
  );
}

function TopTabs({ tab, setTab }) {
  const tabs = [['calendar', 'Календарь'], ['list', 'Список'], ['load', 'Загрузка'], ['users', 'Пользователи']];
  return <div className="grid grid-cols-4 gap-2 rounded-[1.7rem] bg-white/10 p-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cx('rounded-2xl px-2 py-3 text-xs font-black md:text-sm', tab === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{label}</button>)}</div>;
}

function CalendarView({ mode, setMode, date, setDate, staff, shownStaff, events, filter, setFilter, patchEvent, removeEvent }) {
  const dates = mode === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(date, i)) : [date];
  return <Panel title="Ежедневник" note="день / неделя / список, 08:00–20:00, график 2 через 2">
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_260px]">
      <Segment value={mode} setValue={setMode} options={[['day','День'],['week','Неделя'],['agenda','Список']]} />
      <Filter staff={staff} value={filter} setValue={setFilter} />
    </div>
    <MiniCalendar events={events} selected={date} setDate={setDate} />
    {mode === 'agenda' ? <Agenda events={events.filter((e) => e.date === date)} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} /> : <div className="mt-5 grid gap-4">{dates.map((d) => <DayBoard key={d} date={d} staff={shownStaff} events={events.filter((e) => e.date === d)} patchEvent={patchEvent} removeEvent={removeEvent} />)}</div>}
  </Panel>;
}

function Segment({ value, setValue, options }) {
  return <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-1">{options.map(([id, label]) => <button key={id} onClick={() => setValue(id)} className={cx('rounded-xl px-3 py-3 text-xs font-black', value === id ? 'bg-blue-600 text-white' : 'text-emerald-50/70')}>{label}</button>)}</div>;
}

function Filter({ staff, value, setValue }) {
  return <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-4 font-black text-emerald-950"><option value="all">Все массажисты</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>;
}

function MiniCalendar({ events, selected, setDate }) {
  const days = Array.from({ length: 21 }, (_, i) => addDays(today(), i - 3));
  return <div className="grid grid-cols-7 gap-1">{days.map((d) => { const count = events.filter((e) => e.date === d).length; return <button key={d} onClick={() => setDate(d)} className={cx('relative h-16 rounded-2xl text-xs font-black', d === selected ? 'bg-blue-600 text-white ring-4 ring-blue-300/20' : count ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50/60')}><div>{d.slice(8, 10)}</div><div className="text-[9px] opacity-70">{d.slice(5, 7)}</div>{count > 0 && <span className="absolute right-1 top-1 rounded-full bg-emerald-950 px-1.5 py-0.5 text-[9px] text-lime-100">{count}</span>}</button>; })}</div>;
}

function DayBoard({ date, staff, events, patchEvent, removeEvent }) {
  return <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[.05]"><div className="border-b border-white/10 px-4 py-3"><b className="text-xl text-lime-100">{date}</b><div className="text-xs text-emerald-50/50">временная сетка по массажистам</div></div><div className="grid gap-4 p-4">{staff.map((person) => <StaffColumn key={person.id} person={person} date={date} events={events.filter((e) => e.staffId === person.id)} patchEvent={patchEvent} removeEvent={removeEvent} />)}</div></div>;
}

function StaffColumn({ person, date, events, patchEvent, removeEvent }) {
  const working = isWorking(person, date);
  return <div className="rounded-3xl bg-[#07140e]/80 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><b className="text-lime-100">{person.name}</b><div className="text-xs text-emerald-50/50">{person.title} · {person.phone}</div></div><span className={cx('rounded-full px-3 py-1 text-xs font-black', working ? 'bg-lime-200 text-emerald-950' : 'bg-red-500/20 text-red-100')}>{working ? '08:00–20:00' : 'выходной'}</span></div><div className="grid gap-2">{hours().map((h) => { const item = events.find((e) => e.time === h); return <TimeSlot key={h} hour={h} item={item} working={working} patchEvent={patchEvent} removeEvent={removeEvent} />; })}</div></div>;
}

function TimeSlot({ hour, item, working, patchEvent, removeEvent }) {
  if (!working) return <div className="grid grid-cols-[58px_1fr] gap-2"><span className="pt-3 text-xs text-emerald-50/35">{hour}</span><div className="rounded-2xl bg-red-500/10 px-3 py-3 text-sm text-red-100/50">выходной</div></div>;
  if (!item) return <div className="grid grid-cols-[58px_1fr] gap-2"><span className="pt-3 text-xs text-emerald-50/35">{hour}</span><div className="rounded-2xl border border-dashed border-white/10 bg-white/[.03] px-3 py-3 text-sm text-emerald-50/35">свободно</div></div>;
  return <div className="grid grid-cols-[58px_1fr] gap-2"><span className="pt-4 text-xs text-lime-200">{hour}</span><div className="rounded-2xl bg-lime-200 p-3 text-emerald-950 shadow-xl shadow-black/20"><div className="flex items-start justify-between gap-2"><div><b>{item.client}</b><div className="text-sm opacity-80">{item.service} · {item.duration} мин</div><div className="text-xs font-black uppercase tracking-[.12em] opacity-70">{statusLabel(item.status)}</div></div><div className="flex gap-1"><button onClick={() => patchEvent(item.id, { status: item.status === 'confirmed' ? 'done' : 'confirmed' })} className="rounded-full bg-emerald-950 px-2 py-1 text-[10px] font-black text-lime-100">✓</button><button onClick={() => removeEvent(item.id)} className="rounded-full bg-red-700 px-2 py-1 text-[10px] font-black text-white">×</button></div></div></div></div>;
}

function Agenda({ events, staff, patchEvent, removeEvent }) {
  return <div className="mt-5 grid gap-3">{events.length === 0 && <Empty text="На выбранную дату записей нет." />}{events.map((e) => <EventCard key={e.id} event={e} master={staffName(staff, e.staffId)} patchEvent={patchEvent} removeEvent={removeEvent} />)}</div>;
}

function EventCard({ event, master, patchEvent, removeEvent }) {
  return <div className="rounded-3xl bg-white/10 p-4"><b className="text-lime-100">{event.date} · {event.time}</b><div className="mt-1 text-emerald-50/80">{event.client} · {event.service}</div><div className="text-sm text-emerald-50/50">{master} · {event.phone}</div><div className="mt-3 flex gap-2"><button onClick={() => patchEvent(event.id, { status: 'confirmed' })} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Подтвердить</button><button onClick={() => removeEvent(event.id)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить</button></div></div>;
}

function ListView({ events, staff, filter, setFilter, patchEvent, removeEvent }) {
  return <Panel title="Список записей" note="поиск и фильтр по массажисту"><Filter staff={staff} value={filter} setValue={setFilter} /><div className="mt-4 grid gap-3">{events.map((e) => <EventCard key={e.id} event={e} master={staffName(staff, e.staffId)} patchEvent={patchEvent} removeEvent={removeEvent} />)}</div></Panel>;
}

function LoadView({ staff, events }) {
  return <Panel title="Загрузка" note="занятость на 7 дней">{staff.map((s) => { const capacity = Array.from({ length: 7 }, (_, i) => addDays(today(), i)).filter((d) => isWorking(s, d)).length * (END_HOUR - START_HOUR); const busy = events.filter((e) => e.staffId === s.id).length; const pct = capacity ? Math.min(100, Math.round((busy / capacity) * 100)) : 0; return <div key={s.id} className="mb-4 rounded-3xl bg-white/10 p-4"><div className="mb-2 flex justify-between"><b>{s.name}</b><b className="text-lime-200">{pct}%</b></div><div className="h-4 rounded-full bg-white/10"><div className="h-4 rounded-full bg-lime-200" style={{ width: `${pct}%` }} /></div><div className="mt-2 text-xs text-emerald-50/50">{busy} записей из {capacity} рабочих окон</div></div>; })}</Panel>;
}

function UsersView({ staff, patchStaff, removeStaff }) {
  return <Panel title="Пользователи" note="контакты и адреса видны только администратору">{staff.map((s) => <StaffCard key={s.id} person={s} patchStaff={patchStaff} removeStaff={removeStaff} />)}</Panel>;
}

function StaffCard({ person, patchStaff, removeStaff }) {
  const [draft, setDraft] = useState(person);
  const set = (key, value) => setDraft((p) => ({ ...p, [key]: value }));
  return <div className="mb-4 rounded-3xl bg-white/10 p-4"><div className="grid gap-3 md:grid-cols-2"><Input label="ФИО" value={draft.name} set={(v) => set('name', v)} /><Input label="Должность" value={draft.title} set={(v) => set('title', v)} /><Input label="Телефон" value={draft.phone} set={(v) => set('phone', v)} /><Input label="Адрес" value={draft.address} set={(v) => set('address', v)} /></div><div className="mt-3 flex gap-2"><button onClick={() => patchStaff(person.id, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить</button><button onClick={() => removeStaff(person.id)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить</button></div></div>;
}

function Input({ label, value, set }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input value={value || ''} onChange={(e) => set(e.target.value)} className="w-full rounded-2xl bg-white px-4 py-4 font-bold text-emerald-950" /></label>;
}
function Panel({ title, note, children }) { return <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/80 p-5 shadow-2xl shadow-black/30"><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.18em] text-lime-300/70">{note}</div><h1 className="mt-1 text-4xl font-black tracking-[-.06em] text-lime-50">{title}</h1></div>{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center font-bold text-emerald-50/55">{text}</div>; }

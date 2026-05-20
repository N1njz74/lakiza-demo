import { useMemo, useState } from 'react';

const STORAGE_EVENTS = 'lakizaAdminSchedulerEvents';
const STORAGE_STAFF = 'lakizaAdminSchedulerStaff';
const STORAGE_CLIENTS = 'lakizaClientProfiles';
const START_HOUR = 8;
const END_HOUR = 20;

const initialStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', address: 'служебный адрес скрыт', shift: 0, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', address: 'служебный адрес скрыт', shift: 1, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', address: 'служебный адрес скрыт', shift: 2, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', address: 'служебный адрес скрыт', shift: 3, active: true },
];

function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); }
function monthStart(date) { const d = new Date(`${date}T12:00:00`); d.setDate(1); return d.toISOString().slice(0, 10); }
function addMonths(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(1); d.setMonth(d.getMonth() + shift); return d.toISOString().slice(0, 10); }
function monthTitle(date) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function calendarDays(month) { const start = monthStart(month); const first = new Date(`${start}T12:00:00`); const offset = (first.getDay() + 6) % 7; const gridStart = addDays(start, -offset); return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)); }
function dayIndex(date) { return Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000); }
function isWorking(person, date) { return ((dayIndex(date) + Number(person.shift || 0)) % 4) < 2; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function hours() { return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${String(START_HOUR + i).padStart(2, '0')}:00`); }
function makeEvents() {
  const d = today();
  return [
    { id: 'e1', date: d, time: '09:00', duration: 60, staffId: 'kristina', client: 'Ирина Климова', phone: '+7 900 111-22-33', service: 'Спина и шея', status: 'confirmed', note: 'просила мягко', weight: '67', height: '168' },
    { id: 'e2', date: d, time: '14:00', duration: 90, staffId: 'kristina', client: 'Олег Петров', phone: '+7 900 444-55-66', service: 'Классический массаж', status: 'new', note: 'перезвонить', weight: '86', height: '181' },
    { id: 'e3', date: d, time: '11:00', duration: 60, staffId: 'vera', client: 'Мария Волкова', phone: '+7 900 222-33-44', service: 'Антистресс', status: 'confirmed', note: 'не любит сильное давление', weight: '59', height: '165' },
    { id: 'e4', date: addDays(d, 1), time: '16:00', duration: 60, staffId: 'alina', client: 'Денис Серов', phone: '+7 900 555-44-33', service: 'Лимфодренаж', status: 'confirmed', note: 'курс после тренировки' },
    { id: 'e5', date: addDays(d, 2), time: '18:00', duration: 120, staffId: 'natalia', client: 'Анна Белова', phone: '+7 900 888-77-66', service: 'Курс 4 сеанса', status: 'new', note: 'подарочный сертификат' },
  ];
}
function statusLabel(status) { return { new: 'заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена' }[status] || status; }
function staffName(staff, id) { return staff.find((x) => x.id === id)?.name || id; }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function clientIdFromEvent(event) { return event.clientId || `client-${digits(event.phone) || String(event.client || '').toLowerCase().replace(/\s+/g, '-')}`; }
function eventDateTime(event) { return `${event.date}T${event.time || '00:00'}`; }
function bmi(weight, height) { const w = Number(weight); const h = Number(height) / 100; return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '—'; }
function norm(value) { return String(value || '').toLowerCase().replace(/ё/g, 'е').trim(); }
function eventBelongsToClient(event, client) { return clientIdFromEvent(event) === client.id; }
function clientSearchText(client, clientEvents, staff) {
  return norm([
    client.name,
    client.surname,
    client.phone,
    digits(client.phone),
    client.email,
    client.privateNotes,
    staffName(staff, client.assignedStaffId),
    ...clientEvents.flatMap((event) => [event.client, event.phone, digits(event.phone), event.service, event.note, event.status, event.date, event.time]),
  ].join(' '));
}
function searchMatch(client, clientEvents, staff, query) {
  const q = norm(query);
  if (!q) return true;
  const haystack = clientSearchText(client, clientEvents, staff);
  return q.split(/\s+/).filter(Boolean).every((part) => haystack.includes(part) || haystack.includes(digits(part)));
}

function buildClients(baseClients, events) {
  const map = new Map();
  baseClients.forEach((client) => map.set(client.id, client));
  events.forEach((event) => {
    const id = clientIdFromEvent(event);
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: event.client,
        phone: event.phone,
        email: '',
        assignedStaffId: event.staffId,
        privateNotes: event.note ? `Из записи: ${event.note}` : '',
        createdAt: new Date().toISOString(),
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
}

export default function AdminPro() {
  const [tab, setTab] = useState('calendar');
  const [mode, setMode] = useState('day');
  const [date, setDate] = useState(today());
  const [filter, setFilter] = useState('all');
  const [staff, setStaff] = useState(() => readJson(STORAGE_STAFF, initialStaff));
  const [events, setEvents] = useState(() => readJson(STORAGE_EVENTS, makeEvents()));
  const [clients, setClients] = useState(() => readJson(STORAGE_CLIENTS, []));
  const [selectedClientId, setSelectedClientId] = useState(null);

  const activeStaff = staff.filter((x) => x.active !== false);
  const shownStaff = filter === 'all' ? activeStaff : activeStaff.filter((x) => x.id === filter);
  const visibleEvents = events.filter((e) => filter === 'all' || e.staffId === filter);
  const clientList = useMemo(() => buildClients(clients, events), [clients, events]);
  const selectedClient = clientList.find((client) => client.id === selectedClientId) || null;

  const saveStaff = (next) => { setStaff(next); saveJson(STORAGE_STAFF, next); };
  const saveEvents = (next) => { setEvents(next); saveJson(STORAGE_EVENTS, next); };
  const saveClients = (next) => { setClients(next); saveJson(STORAGE_CLIENTS, next); };
  const patchEvent = (id, patch) => { const item = events.find((e) => e.id === id); if (!item) return; if (!window.confirm(`Сохранить изменения записи ${item.date} ${item.time}, ${item.client}?`)) return; saveEvents(events.map((e) => e.id === id ? { ...e, ...patch } : e)); };
  const removeEvent = (id) => { const item = events.find((e) => e.id === id); if (!item) return; if (!window.confirm(`Удалить запись ${item.date} ${item.time}, ${item.client}?`)) return; saveEvents(events.filter((e) => e.id !== id)); };
  const patchStaff = (id, patch) => { const item = staff.find((s) => s.id === id); if (!item) return; if (!window.confirm(`Сохранить изменения пользователя ${item.name}?`)) return; saveStaff(staff.map((s) => s.id === id ? { ...s, ...patch } : s)); };
  const removeStaff = (id) => { const item = staff.find((s) => s.id === id); if (!item) return; if (!window.confirm(`Удалить/скрыть массажиста ${item.name}? Его записи останутся в списке.`)) return; saveStaff(staff.map((s) => s.id === id ? { ...s, active: false } : s)); };
  const patchClient = (id, patch) => {
    const current = clientList.find((client) => client.id === id);
    if (!current) return;
    if (!window.confirm(`Сохранить карточку клиента ${current.name}?`)) return;
    const existingIds = new Set(clients.map((client) => client.id));
    const next = existingIds.has(id) ? clients.map((client) => client.id === id ? { ...client, ...patch } : client) : [...clients, { ...current, ...patch }];
    saveClients(next);
  };
  const openClient = (eventOrClient) => {
    const id = eventOrClient.client ? clientIdFromEvent(eventOrClient) : eventOrClient.id;
    if (!clients.some((client) => client.id === id)) {
      const event = eventOrClient.client ? eventOrClient : events.find((item) => clientIdFromEvent(item) === id);
      if (event) saveClients([...clients, { id, name: event.client, phone: event.phone, email: '', assignedStaffId: event.staffId, privateNotes: event.note ? `Из записи: ${event.note}` : '', createdAt: new Date().toISOString() }]);
    }
    setSelectedClientId(id);
  };

  return (
    <div className="scheduler-fit grid w-full max-w-full gap-3 overflow-hidden">
      <TopTabs tab={tab} setTab={setTab} />
      {tab === 'calendar' && <CalendarView mode={mode} setMode={setMode} date={date} setDate={setDate} staff={activeStaff} shownStaff={shownStaff} events={visibleEvents} filter={filter} setFilter={setFilter} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />}
      {tab === 'list' && <ListView events={visibleEvents} staff={activeStaff} filter={filter} setFilter={setFilter} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />}
      {tab === 'clients' && <ClientsView clients={clientList} events={events} staff={activeStaff} openClient={openClient} />}
      {tab === 'load' && <LoadView staff={activeStaff} events={events} />}
      {tab === 'users' && <UsersView staff={staff} patchStaff={patchStaff} removeStaff={removeStaff} />}
      {selectedClient && <ClientCard client={selectedClient} staff={activeStaff} events={events.filter((event) => eventBelongsToClient(event, selectedClient))} patchClient={patchClient} patchEvent={patchEvent} removeEvent={removeEvent} close={() => setSelectedClientId(null)} />}
    </div>
  );
}

function TopTabs({ tab, setTab }) {
  const tabs = [['calendar', 'Кал.'], ['list', 'Список'], ['clients', 'Клиенты'], ['load', 'Загр.'], ['users', 'Люди']];
  return <div className="sticky top-[86px] z-40 -mx-2 border-y border-white/5 bg-[#06110b]/92 px-2 py-2 backdrop-blur md:top-[104px]"><div className="grid w-full grid-cols-5 gap-1 rounded-[1.1rem] bg-white/8 p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cx('rounded-xl px-1 py-2.5 text-[10px] font-black md:text-xs', tab === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{label}</button>)}</div></div>;
}

function CalendarView({ mode, setMode, date, setDate, staff, shownStaff, events, filter, setFilter, patchEvent, removeEvent, openClient }) {
  const [calendarMonth, setCalendarMonth] = useState(monthStart(date));
  const dates = mode === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(date, i)) : [date];
  const pickDate = (nextDate) => { setDate(nextDate); setCalendarMonth(monthStart(nextDate)); };
  return <Panel title="Ежедневник" note="08:00–20:00 · 2/2">
    <div className="mb-3 grid gap-2 md:grid-cols-[1fr_260px]">
      <Segment value={mode} setValue={setMode} options={[['day','День'],['week','Нед.'],['agenda','Список']]} />
      <Filter staff={staff} value={filter} setValue={setFilter} />
    </div>
    <MiniCalendar events={events} selected={date} setDate={pickDate} month={calendarMonth} setMonth={setCalendarMonth} />
    {mode === 'agenda' ? <Agenda events={events.filter((e) => e.date === date)} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} /> : <div className="mt-3 grid gap-3">{dates.map((d) => <DayBoard key={d} date={d} staff={shownStaff} events={events.filter((e) => e.date === d)} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />)}</div>}
  </Panel>;
}

function Segment({ value, setValue, options }) { return <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1">{options.map(([id, label]) => <button key={id} onClick={() => setValue(id)} className={cx('rounded-lg px-1 py-2 text-[11px] font-black', value === id ? 'bg-blue-600 text-white' : 'text-emerald-50/70')}>{label}</button>)}</div>; }
function Filter({ staff, value, setValue }) { return <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-black text-emerald-950"><option value="all">Все массажисты</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>; }

function MiniCalendar({ events, selected, setDate, month, setMonth }) {
  const days = calendarDays(month);
  const visibleMonth = month.slice(0, 7);
  const jumpToday = () => { const now = today(); setMonth(monthStart(now)); setDate(now); };
  return <div className="w-full overflow-hidden rounded-xl bg-white/[.04] p-2">
    <div className="mb-2 flex items-center justify-between gap-2">
      <button type="button" onClick={() => setMonth(addMonths(month, -1))} className="rounded-lg bg-white/10 px-2 py-2 text-xs font-black text-lime-100">‹</button>
      <div className="min-w-0 text-center"><div className="truncate text-sm font-black capitalize text-lime-100">{monthTitle(month)}</div><div className="text-[9px] font-bold text-emerald-50/45">листание по месяцам</div></div>
      <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg bg-white/10 px-2 py-2 text-xs font-black text-lime-100">›</button>
    </div>
    <div className="mb-2 grid grid-cols-1 gap-1"><button type="button" onClick={jumpToday} className="rounded-lg bg-lime-200 px-2 py-2 text-[10px] font-black text-emerald-950">Сегодня</button></div>
    <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[8px] font-black uppercase tracking-[.08em] text-emerald-50/35"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
    <div className="grid w-full grid-cols-7 gap-1 overflow-hidden">{days.map((d) => { const count = events.filter((e) => e.date === d).length; const outside = d.slice(0, 7) !== visibleMonth; return <button key={d} onClick={() => setDate(d)} className={cx('relative h-9 min-w-0 rounded-lg text-[10px] font-black md:h-11', d === selected ? 'bg-blue-600 text-white ring-2 ring-blue-300/20' : count ? 'bg-lime-200 text-emerald-950' : outside ? 'bg-white/[.04] text-emerald-50/25' : 'bg-white/10 text-emerald-50/60')}><div>{d.slice(8, 10)}</div>{count > 0 && <span className="absolute right-0 top-0 rounded-full bg-emerald-950 px-1 text-[8px] leading-3 text-lime-100">{count}</span>}</button>; })}</div>
  </div>;
}

function DayBoard({ date, staff, events, patchEvent, removeEvent, openClient }) { return <div className="w-full max-w-full overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/[.05]"><div className="border-b border-white/10 px-3 py-2"><b className="text-xl text-lime-100">{date}</b><div className="text-xs text-emerald-50/45">сетка по массажистам</div></div><div className="grid gap-2 p-2">{staff.map((person) => <StaffColumn key={person.id} person={person} date={date} events={events.filter((e) => e.staffId === person.id)} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />)}</div></div>; }
function StaffColumn({ person, date, events, patchEvent, removeEvent, openClient }) { const working = isWorking(person, date); return <div className="w-full max-w-full overflow-hidden rounded-xl bg-[#07140e]/80 p-2"><div className="mb-2 flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-base text-lime-100">{person.name}</b><div className="truncate text-[10px] text-emerald-50/50">{person.title} · {person.phone}</div></div><span className={cx('shrink-0 rounded-full px-2 py-1 text-[10px] font-black', working ? 'bg-lime-200 text-emerald-950' : 'bg-red-500/20 text-red-100')}>{working ? '08–20' : 'вых.'}</span></div><div className="grid gap-1.5">{hours().map((h) => { const item = events.find((e) => e.time === h); return <TimeSlot key={h} hour={h} item={item} working={working} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />; })}</div></div>; }
function TimeSlot({ hour, item, working, patchEvent, removeEvent, openClient }) {
  if (!working) return <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-1.5"><span className="pt-2 text-[10px] text-emerald-50/30">{hour}</span><div className="min-w-0 rounded-lg bg-red-500/10 px-2 py-2 text-xs text-red-100/45">выходной</div></div>;
  if (!item) return <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-1.5"><span className="pt-2 text-[10px] text-emerald-50/35">{hour}</span><div className="min-w-0 rounded-lg border border-dashed border-white/10 bg-white/[.03] px-2 py-2 text-xs text-emerald-50/35">свободно</div></div>;
  return <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-1.5"><span className="pt-3 text-[10px] text-lime-200">{hour}</span><div className="min-w-0 overflow-hidden rounded-lg bg-lime-200 p-2 text-emerald-950 shadow-xl shadow-black/20"><div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><button type="button" onClick={() => openClient(item)} className="block max-w-full truncate text-left text-sm font-black underline decoration-emerald-900/25 underline-offset-2">{item.client}</button><div className="truncate text-xs opacity-80">{item.service} · {item.duration} мин</div><div className="truncate text-[9px] font-black uppercase tracking-[.1em] opacity-70">{statusLabel(item.status)}</div></div><div className="flex shrink-0 gap-1"><button onClick={() => patchEvent(item.id, { status: item.status === 'confirmed' ? 'done' : 'confirmed' })} className="h-7 w-7 rounded-full bg-emerald-950 text-[10px] font-black text-lime-100">✓</button><button onClick={() => removeEvent(item.id)} className="h-7 w-7 rounded-full bg-red-700 text-[10px] font-black text-white">×</button></div></div></div></div>;
}

function Agenda({ events, staff, patchEvent, removeEvent, openClient }) { return <div className="mt-3 grid gap-2">{events.length === 0 && <Empty text="На выбранную дату записей нет." />}{events.map((e) => <EventCard key={e.id} event={e} master={staffName(staff, e.staffId)} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />)}</div>; }
function EventCard({ event, master, patchEvent, removeEvent, openClient }) { return <div className="max-w-full overflow-hidden rounded-xl bg-white/10 p-3"><b className="text-lime-100">{event.date} · {event.time}</b><button type="button" onClick={() => openClient(event)} className="mt-1 block max-w-full truncate text-left text-sm font-black text-emerald-50 underline decoration-lime-200/25 underline-offset-2">{event.client} · {event.service}</button><div className="truncate text-xs text-emerald-50/50">{master} · {event.phone}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => openClient(event)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-lime-100">Карточка</button><button onClick={() => patchEvent(event.id, { status: 'confirmed' })} className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">Подтв.</button><button onClick={() => removeEvent(event.id)} className="rounded-full bg-red-500/20 px-3 py-2 text-xs font-black text-red-100">Удалить</button></div></div>; }
function ListView({ events, staff, filter, setFilter, patchEvent, removeEvent, openClient }) { return <Panel title="Список" note="записи"><Filter staff={staff} value={filter} setValue={setFilter} /><div className="mt-3 grid gap-2">{events.map((e) => <EventCard key={e.id} event={e} master={staffName(staff, e.staffId)} patchEvent={patchEvent} removeEvent={removeEvent} openClient={openClient} />)}</div></Panel>; }

function ClientsView({ clients, events, staff, openClient }) {
  const [query, setQuery] = useState('');
  const filtered = clients.filter((client) => searchMatch(client, events.filter((event) => eventBelongsToClient(event, client)), staff, query));
  return <Panel title="Клиенты" note="поиск по имени, телефону и заметкам">
    <div className="sticky top-[136px] z-30 mb-3 rounded-2xl border border-white/10 bg-[#07140e]/95 p-2 shadow-xl shadow-black/25 backdrop-blur md:top-[154px]">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск: Ирина, Климова, 900, мягко, сертификат..." className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" />
        {query && <button type="button" onClick={() => setQuery('')} className="rounded-xl bg-white/10 px-3 text-xs font-black text-lime-100">×</button>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-black uppercase tracking-[.08em] text-emerald-50/45">
        <span className="rounded-full bg-white/10 px-2 py-1">найдено: {filtered.length}</span>
        <span className="rounded-full bg-white/10 px-2 py-1">всего: {clients.length}</span>
      </div>
    </div>
    <div className="grid gap-2">
      {filtered.length === 0 && <Empty text="Клиенты не найдены. Попробуй имя, фамилию, цифры телефона или слово из заметки." />}
      {filtered.map((client) => {
        const clientEvents = events.filter((event) => eventBelongsToClient(event, client));
        const next = clientEvents.filter((event) => eventDateTime(event) >= `${today()}T00:00`).sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)))[0];
        const noteHit = query && norm(client.privateNotes).includes(norm(query));
        return <button key={client.id} type="button" onClick={() => openClient(client)} className="rounded-xl bg-white/10 p-3 text-left transition hover:bg-white/[.14] active:scale-[.99]">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-lime-100">{client.name}</b><div className="truncate text-xs text-emerald-50/55">{client.phone || 'телефон не указан'} · {staffName(staff, client.assignedStaffId)}</div></div><span className="rounded-full bg-lime-200 px-2 py-1 text-[10px] font-black text-emerald-950">{clientEvents.length} сеанс.</span></div>
          <div className="mt-2 text-xs text-emerald-50/50">Ближайший: {next ? `${next.date} · ${next.time} · ${next.service}` : 'нет будущих записей'}</div>
          {client.privateNotes && <div className={cx('mt-2 line-clamp-2 rounded-lg px-2 py-1 text-[11px]', noteHit ? 'bg-lime-200 text-emerald-950' : 'bg-black/20 text-emerald-50/45')}>Заметка: {client.privateNotes}</div>}
        </button>;
      })}
    </div>
  </Panel>;
}

function ClientCard({ client, staff, events, patchClient, patchEvent, removeEvent, close }) {
  const [draft, setDraft] = useState(client);
  const [section, setSection] = useState('overview');
  const sortedEvents = [...events].sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)));
  const upcoming = sortedEvents.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled');
  const history = sortedEvents.filter((event) => eventDateTime(event) < `${today()}T00:00` || ['done', 'cancelled'].includes(event.status));
  const lastWithMetrics = [...sortedEvents].reverse().find((event) => event.weight || event.height);
  const latestWeight = lastWithMetrics?.weight || '—';
  const latestHeight = lastWithMetrics?.height || '—';
  const privateNoteStaff = draft.assignedStaffId || staff[0]?.id || '';
  const nextEvent = upcoming[0];
  const sections = [
    ['overview', 'Обзор', 'контакты'],
    ['upcoming', 'Будущие', String(upcoming.length)],
    ['history', 'История', String(history.length)],
    ['metrics', 'Вес/рост', bmi(latestWeight, latestHeight)],
    ['notes', 'Пометки', 'закрыто'],
  ];

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-2 backdrop-blur-sm"><div className="mx-auto my-3 max-w-3xl rounded-[1.4rem] border border-white/10 bg-[#07140e] p-3 text-white shadow-2xl md:p-5">
    <div className="sticky top-2 z-20 -mx-1 mb-3 rounded-2xl border border-white/10 bg-[#07140e]/95 p-2 shadow-xl shadow-black/30 backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/65">карточка клиента</div><h2 className="truncate text-2xl font-black tracking-[-.05em] text-lime-50 md:text-3xl">{draft.name || client.name}</h2><p className="truncate text-sm text-emerald-50/55">{draft.phone || 'телефон не указан'} · {draft.email || 'email не указан'}</p></div><button type="button" onClick={close} className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-black">Закрыть</button></div>
      <div className="grid grid-cols-5 gap-1 rounded-xl bg-white/8 p-1">{sections.map(([id, label, mini]) => <button key={id} type="button" onClick={() => setSection(id)} className={cx('rounded-lg px-1 py-2 text-center transition active:scale-[.98]', section === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50/70')}><span className="block text-[10px] font-black md:text-xs">{label}</span><span className="mt-0.5 block truncate text-[8px] font-bold opacity-60">{mini}</span></button>)}</div>
    </div>

    <div className="grid gap-2 sm:grid-cols-4"><Stat label="Всего" value={sortedEvents.length} /><Stat label="Будущие" value={upcoming.length} /><Stat label="Завершено" value={history.length} /><Stat label="ИМТ" value={bmi(latestWeight, latestHeight)} /></div>

    {section === 'overview' && <section className="mt-3 grid gap-3">
      <div className="rounded-xl bg-lime-200/10 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Ближайший сеанс</div><b className="mt-1 block text-lime-100">{nextEvent ? `${nextEvent.date} · ${nextEvent.time}` : 'нет будущих записей'}</b><div className="text-sm text-emerald-50/55">{nextEvent ? `${nextEvent.service} · ${staffName(staff, nextEvent.staffId)}` : 'можно назначить во вкладке Будущие или через календарь'}</div></div>
      <div className="grid gap-2 sm:grid-cols-2"><Input label="Имя клиента" value={draft.name || ''} set={(v) => setDraft((p) => ({ ...p, name: v }))} /><Input label="Телефон" value={draft.phone || ''} set={(v) => setDraft((p) => ({ ...p, phone: v }))} /><Input label="Email" value={draft.email || ''} set={(v) => setDraft((p) => ({ ...p, email: v }))} /><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Закреплённый массажист</span><select value={draft.assignedStaffId || ''} onChange={(e) => setDraft((p) => ({ ...p, assignedStaffId: e.target.value }))} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
      <button type="button" onClick={() => patchClient(client.id, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить общие данные</button>
    </section>}

    {section === 'upcoming' && <ClientScheduleBlock title="Предстоящие сеансы" events={upcoming} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} empty="Будущих записей нет." />}
    {section === 'history' && <ClientScheduleBlock title="История сеансов" events={history} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} empty="История пока пустая." />}
    {section === 'metrics' && <section className="mt-3 grid gap-2"><h3 className="text-xl font-black text-lime-50">Динамика веса и роста</h3>{sortedEvents.length === 0 && <Empty text="Сеансов пока нет." />}{sortedEvents.map((event) => <MetricRow key={event.id} event={event} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} />)}</section>}
    {section === 'notes' && <section className="mt-3 grid gap-2"><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Пометки по клиенту</span><textarea value={draft.privateNotes || ''} onChange={(e) => setDraft((p) => ({ ...p, privateNotes: e.target.value }))} rows={6} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" placeholder={`Видит администратор и закреплённый массажист: ${staffName(staff, privateNoteStaff)}`} /></label><div className="rounded-xl bg-lime-200/10 px-3 py-2 text-[11px] font-bold text-lime-100/80">Пометки участвуют в поиске клиентов. Клиентам и другим массажистам это поле недоступно в интерфейсе.</div><button type="button" onClick={() => patchClient(client.id, draft)} className="w-fit rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить пометки</button></section>}
  </div></div>;
}

function ClientScheduleBlock({ title, events, staff, patchEvent, removeEvent, empty }) { return <section className="mt-3 grid gap-2"><div className="flex items-center justify-between gap-2"><h3 className="text-xl font-black text-lime-50">{title}</h3><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-lime-100">{events.length}</span></div>{events.length === 0 && <Empty text={empty} />}{events.map((event) => <ClientEventEditor key={event.id} event={event} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} />)}</section>; }
function MetricRow({ event, staff, patchEvent, removeEvent }) { return <div className="rounded-xl bg-white/10 p-3"><div className="mb-2 flex items-center justify-between gap-2"><div><b className="text-lime-100">{event.date} · {event.time}</b><div className="text-xs text-emerald-50/50">{event.service} · {staffName(staff, event.staffId)}</div></div><span className="rounded-full bg-lime-200 px-2 py-1 text-[10px] font-black text-emerald-950">ИМТ {bmi(event.weight, event.height)}</span></div><ClientEventEditor event={event} staff={staff} patchEvent={patchEvent} removeEvent={removeEvent} /></div>; }

function ClientEventEditor({ event, staff, patchEvent, removeEvent }) {
  const [draft, setDraft] = useState(event);
  const set = (key, value) => setDraft((p) => ({ ...p, [key]: value }));
  return <div className="rounded-xl bg-white/10 p-3"><div className="mb-2 text-xs font-black uppercase tracking-[.12em] text-lime-200/70">{event.date} · {event.time} · {statusLabel(event.status)}</div><div className="grid gap-2 sm:grid-cols-3"><Input label="Дата" type="date" value={draft.date || ''} set={(v) => set('date', v)} /><Input label="Время" value={draft.time || ''} set={(v) => set('time', v)} /><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Массажист</span><select value={draft.staffId || ''} onChange={(e) => set('staffId', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><Input label="Услуга" value={draft.service || ''} set={(v) => set('service', v)} /><Input label="Длительность" value={String(draft.duration || '')} set={(v) => set('duration', v)} /><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Статус</span><select value={draft.status || 'new'} onChange={(e) => set('status', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950"><option value="new">заявка</option><option value="confirmed">подтверждена</option><option value="done">завершена</option><option value="cancelled">отменена</option></select></label><Input label="Вес, кг" value={String(draft.weight || '')} set={(v) => set('weight', v)} /><Input label="Рост, см" value={String(draft.height || '')} set={(v) => set('height', v)} /><div className="rounded-xl bg-black/20 p-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">ИМТ</span><b className="mt-1 block text-lg text-lime-100">{bmi(draft.weight, draft.height)}</b></div></div><label className="mt-2 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Заметка к сеансу</span><textarea value={draft.note || ''} onChange={(e) => set('note', e.target.value)} rows={2} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" /></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => patchEvent(event.id, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить сеанс</button><button type="button" onClick={() => removeEvent(event.id)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить сеанс</button></div></div>;
}

function Stat({ label, value }) { return <div className="rounded-xl bg-white/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-lime-200/55">{label}</div><b className="mt-1 block text-xl text-lime-100">{value}</b></div>; }
function LoadView({ staff, events }) { return <Panel title="Загрузка" note="на 7 дней">{staff.map((s) => { const capacity = Array.from({ length: 7 }, (_, i) => addDays(today(), i)).filter((d) => isWorking(s, d)).length * (END_HOUR - START_HOUR); const busy = events.filter((e) => e.staffId === s.id).length; const pct = capacity ? Math.min(100, Math.round((busy / capacity) * 100)) : 0; return <div key={s.id} className="mb-3 rounded-xl bg-white/10 p-3"><div className="mb-2 flex justify-between gap-2"><b className="truncate">{s.name}</b><b className="text-lime-200">{pct}%</b></div><div className="h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-lime-200" style={{ width: `${pct}%` }} /></div><div className="mt-2 text-xs text-emerald-50/50">{busy} записей из {capacity} окон</div></div>; })}</Panel>; }
function UsersView({ staff, patchStaff, removeStaff }) { return <Panel title="Люди" note="адреса видны только админу">{staff.map((s) => <StaffCard key={s.id} person={s} patchStaff={patchStaff} removeStaff={removeStaff} />)}</Panel>; }
function StaffCard({ person, patchStaff, removeStaff }) { const [draft, setDraft] = useState(person); const set = (key, value) => setDraft((p) => ({ ...p, [key]: value })); return <div className="mb-3 rounded-xl bg-white/10 p-3"><div className="grid gap-2 md:grid-cols-2"><Input label="ФИО" value={draft.name} set={(v) => set('name', v)} /><Input label="Должность" value={draft.title} set={(v) => set('title', v)} /><Input label="Телефон" value={draft.phone} set={(v) => set('phone', v)} /><Input label="Адрес" value={draft.address} set={(v) => set('address', v)} /></div><div className="mt-3 flex gap-2"><button onClick={() => patchStaff(person.id, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить</button><button onClick={() => removeStaff(person.id)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить</button></div></div>; }
function Input({ label, value, set, type = 'text' }) { return <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value || ''} onChange={(e) => set(e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" /></label>; }
function Panel({ title, note, children }) { return <div className="w-full max-w-full overflow-hidden rounded-[1.2rem] border border-white/10 bg-[#07140e]/80 p-2.5 shadow-2xl shadow-black/30 md:p-5"><div className="mb-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">{note}</div><h1 className="mt-0.5 text-2xl font-black tracking-[-.06em] text-lime-50 md:text-4xl">{title}</h1></div>{children}</div>; }
function Empty({ text }) { return <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5 text-center text-sm font-bold text-emerald-50/55">{text}</div>; }

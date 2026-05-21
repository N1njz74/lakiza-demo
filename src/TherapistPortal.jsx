import { useMemo, useState } from 'react';

const EVENTS_KEY = 'lakizaAdminSchedulerEvents';
const STAFF_KEY = 'lakizaAdminSchedulerStaff';
const CLIENTS_KEY = 'lakizaClientProfiles';
const DEFAULT_START = 8;
const DEFAULT_END = 20;

const fallbackStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', shift: 0, workStart: 8, workEnd: 20, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', shift: 1, workStart: 9, workEnd: 21, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', shift: 2, workStart: 7, workEnd: 19, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', shift: 3, workStart: 8, workEnd: 21, active: true },
];

function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); }
function monthStart(date) { const d = new Date(`${date}T12:00:00`); d.setDate(1); return d.toISOString().slice(0, 10); }
function addMonths(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(1); d.setMonth(d.getMonth() + shift); return d.toISOString().slice(0, 10); }
function monthTitle(date) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function weekday(date) { return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date(`${date}T12:00:00`)); }
function calendarDays(month) { const first = new Date(`${monthStart(month)}T12:00:00`); const offset = (first.getDay() + 6) % 7; const start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d.toISOString().slice(0, 10); }); }
function dayIndex(date) { return Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000); }
function isWorking(person, date) { return ((dayIndex(date) + Number(person.shift || 0)) % 4) < 2; }
function staffStart(person) { return Number(person?.workStart ?? person?.startHour ?? DEFAULT_START); }
function staffEnd(person) { return Number(person?.workEnd ?? person?.endHour ?? DEFAULT_END); }
function staffHours(person) { const start = Math.max(7, Math.min(21, staffStart(person))); const end = Math.max(start + 1, Math.min(22, staffEnd(person))); return { start, end }; }
function staffHoursLabel(person) { const { start, end } = staffHours(person); return `${String(start).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`; }
function hoursFor(person) { const { start, end } = staffHours(person); return Array.from({ length: end - start }, (_, i) => `${String(start + i).padStart(2, '0')}:00`); }
function eventDateTime(event) { return `${event.date || '0000-00-00'}T${event.time || '00:00'}`; }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function clientIdFromEvent(event) { return event.clientId || `client-${digits(event.phone)}`; }
function norm(value) { return String(value || '').toLowerCase().replace(/ё/g, 'е'); }
function statusLabel(status) { return { new: 'заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена', change: 'согласовать' }[status] || status || 'заявка'; }
function statusTone(status) { return status === 'done' ? 'bg-emerald-300 text-emerald-950' : status === 'confirmed' ? 'bg-lime-200 text-emerald-950' : status === 'cancelled' ? 'bg-red-500/20 text-red-100' : status === 'change' ? 'bg-blue-500/25 text-blue-100' : 'bg-white/10 text-emerald-50'; }
function bmi(weight, height) { const w = Number(weight); const h = Number(height) / 100; return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '—'; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function mergeStaffDefaults(items) { const source = Array.isArray(items) && items.length ? items : fallbackStaff; return source.map((item) => { const fallback = fallbackStaff.find((person) => person.id === item.id) || {}; return { ...fallback, ...item, workStart: Number(item.workStart ?? fallback.workStart ?? DEFAULT_START), workEnd: Number(item.workEnd ?? fallback.workEnd ?? DEFAULT_END) }; }).filter((item) => item.active !== false); }
function clientStats(events) { const sorted = [...events].sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b))); const measured = sorted.filter((event) => Number(event.weight) > 0); const hours = sorted.reduce((sum, event) => sum + Number(event.duration || 0), 0) / 60; const delta = measured.length > 1 ? Number(measured.at(-1).weight) - Number(measured[0].weight) : null; return { total: sorted.length, done: sorted.filter((event) => event.status === 'done').length, future: sorted.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled').length, hours: hours.toFixed(1), delta: delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} кг`, last: measured.at(-1) || null }; }

export default function TherapistPortal({ user }) {
  const [tab, setTab] = useState('overview');
  const [staff, setStaff] = useState(() => mergeStaffDefaults(readJson(STAFF_KEY, fallbackStaff)));
  const [events, setEvents] = useState(() => readJson(EVENTS_KEY, []));
  const [clients, setClients] = useState(() => readJson(CLIENTS_KEY, []));
  const [selectedStaffId, setSelectedStaffId] = useState(() => localStorage.getItem('lakizaTherapistStaffId') || 'kristina');
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthStart(today()));
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  const selectedStaff = staff.find((person) => person.id === selectedStaffId) || staff[0] || fallbackStaff[0];
  const myEvents = useMemo(() => events.filter((event) => event.staffId === selectedStaff.id).sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b))), [events, selectedStaff.id]);
  const dayEvents = myEvents.filter((event) => event.date === date).sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const futureEvents = myEvents.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled');
  const requestEvents = myEvents.filter((event) => event.status === 'change' || event.requestedDate || event.requestedCancel);
  const todayEvents = myEvents.filter((event) => event.date === today());
  const doneToday = todayEvents.filter((event) => event.status === 'done').length;

  const saveEvents = (next) => { setEvents(next); saveJson(EVENTS_KEY, next); };
  const saveClients = (next) => { setClients(next); saveJson(CLIENTS_KEY, next); };
  const refresh = () => { setStaff(mergeStaffDefaults(readJson(STAFF_KEY, fallbackStaff))); setEvents(readJson(EVENTS_KEY, [])); setClients(readJson(CLIENTS_KEY, [])); };
  const switchStaff = (id) => { setSelectedStaffId(id); localStorage.setItem('lakizaTherapistStaffId', id); setSelectedClientId(''); };
  const updateEvent = (id, patch) => {
    const item = events.find((event) => event.id === id);
    if (!item || !window.confirm(`Сохранить изменения сеанса ${item.date} ${item.time}, ${item.client}?`)) return;
    saveEvents(events.map((event) => event.id === id ? { ...event, ...patch } : event));
  };
  const approveClientChange = (event) => {
    if (event.requestedCancel) return updateEvent(event.id, { ...event, status: 'cancelled', requestedCancel: false, note: `${event.note || ''} | Отмена согласована массажистом.` });
    if (event.requestedDate || event.requestedTime) return updateEvent(event.id, { ...event, date: event.requestedDate || event.date, time: event.requestedTime || event.time, requestedDate: '', requestedTime: '', status: 'confirmed', note: `${event.note || ''} | Перенос согласован массажистом.` });
  };
  const rejectClientChange = (event) => updateEvent(event.id, { ...event, requestedDate: '', requestedTime: '', requestedCancel: false, status: 'confirmed', note: `${event.note || ''} | Запрос клиента отклонён массажистом.` });
  const finishSession = (event, patch) => updateEvent(event.id, { ...event, ...patch, status: 'done', completedAt: new Date().toISOString(), note: [event.note, patch.sessionNote].filter(Boolean).join(' | ') });
  const saveClientNote = (client, note) => {
    if (!window.confirm(`Сохранить закрытую пометку по клиенту ${client.name}?`)) return;
    const exists = clients.some((item) => item.id === client.id);
    const next = exists ? clients.map((item) => item.id === client.id ? { ...item, privateNotes: note, assignedStaffId: item.assignedStaffId || selectedStaff.id } : item) : [...clients, { ...client, privateNotes: note, assignedStaffId: selectedStaff.id }];
    saveClients(next);
  };

  const clientRows = useMemo(() => buildClientRows(myEvents, clients, selectedStaff.id).filter((row) => {
    const text = norm(`${row.client.name} ${row.client.phone} ${row.client.privateNotes} ${row.events.map((event) => `${event.service} ${event.note} ${event.weight} ${event.height}`).join(' ')}`);
    const query = norm(clientQuery);
    return !query || query.split(/\s+/).every((part) => text.includes(part) || digits(row.client.phone).includes(digits(part)));
  }), [myEvents, clients, selectedStaff.id, clientQuery]);
  const selectedClient = clientRows.find((row) => row.client.id === selectedClientId) || null;

  return <div className="grid gap-3">
    <TherapistTabs tab={tab} setTab={setTab} />
    <Panel eyebrow="профиль массажиста" title="Кабинет массажиста">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Активный профиль</span><select value={selectedStaff.id} onChange={(e) => switchStaff(e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{staff.map((person) => <option key={person.id} value={person.id}>{person.name} · {staffHoursLabel(person)}</option>)}</select></label>
        <button type="button" onClick={refresh} className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black text-lime-100">Обновить</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="Сегодня" value={todayEvents.length} /><Stat label="Завершено" value={doneToday} /><Stat label="Будущие" value={futureEvents.length} /><Stat label="Согласовать" value={requestEvents.length} /></div>
      <div className="mt-3 rounded-xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/80">Рабочее время и график 2/2 задаёт администратор. Массажист видит только свои записи и клиентов, закреплённых за ним.</div>
    </Panel>

    {tab === 'overview' && <Overview selectedStaff={selectedStaff} todayEvents={todayEvents} requestEvents={requestEvents} setTab={setTab} />}
    {tab === 'day' && <DaySchedule selectedStaff={selectedStaff} date={date} setDate={setDate} dayEvents={dayEvents} updateEvent={updateEvent} finishSession={finishSession} approveClientChange={approveClientChange} rejectClientChange={rejectClientChange} />}
    {tab === 'calendar' && <CalendarView selectedStaff={selectedStaff} events={myEvents} date={date} setDate={setDate} month={month} setMonth={setMonth} updateEvent={updateEvent} finishSession={finishSession} approveClientChange={approveClientChange} rejectClientChange={rejectClientChange} />}
    {tab === 'clients' && <ClientsView query={clientQuery} setQuery={setClientQuery} rows={clientRows} selected={selectedClient} setSelected={setSelectedClientId} saveClientNote={saveClientNote} updateEvent={updateEvent} finishSession={finishSession} />}
    {tab === 'requests' && <RequestsView requests={requestEvents} approve={approveClientChange} reject={rejectClientChange} updateEvent={updateEvent} />}
    {tab === 'profile' && <ProfileView person={selectedStaff} />}
  </div>;
}

function buildClientRows(events, clients, staffId) {
  const map = new Map();
  events.forEach((event) => { const id = clientIdFromEvent(event); if (!map.has(id)) map.set(id, []); map.get(id).push(event); });
  return Array.from(map.entries()).map(([id, clientEvents]) => {
    const saved = clients.find((client) => client.id === id) || {};
    const fallback = clientEvents[0] || {};
    const canSeePrivate = !saved.assignedStaffId || saved.assignedStaffId === staffId || clientEvents.some((event) => event.staffId === staffId);
    const client = { id, name: saved.name || fallback.client || 'Клиент', phone: saved.phone || fallback.phone || '', email: saved.email || '', privateNotes: canSeePrivate ? (saved.privateNotes || '') : '', assignedStaffId: saved.assignedStaffId || staffId };
    return { client, events: clientEvents, stat: clientStats(clientEvents) };
  }).sort((a, b) => a.client.name.localeCompare(b.client.name, 'ru'));
}

function TherapistTabs({ tab, setTab }) {
  const tabs = [['overview', 'Обзор'], ['day', 'День'], ['calendar', 'Кал.'], ['clients', 'Клиенты'], ['requests', 'Запросы'], ['profile', 'Профиль']];
  return <div className="sticky top-[76px] z-40 -mx-2 border-y border-white/5 bg-[#06110b]/92 px-2 py-2 backdrop-blur md:top-[104px]"><div className="grid grid-cols-6 gap-1 rounded-[1.1rem] bg-white/8 p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cx('rounded-xl px-1 py-2.5 text-[9px] font-black transition active:scale-[.98] md:text-xs', tab === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{label}</button>)}</div></div>;
}

function Overview({ selectedStaff, todayEvents, requestEvents, setTab }) {
  const next = todayEvents.find((event) => event.status !== 'done' && event.status !== 'cancelled');
  return <Panel eyebrow="рабочий день" title={`${selectedStaff.name} · ${staffHoursLabel(selectedStaff)}`}>
    <div className="rounded-2xl bg-lime-200 p-4 text-emerald-950"><div className="text-[10px] font-black uppercase tracking-[.14em] opacity-60">следующий сеанс сегодня</div><h2 className="mt-1 text-2xl font-black">{next ? `${next.time} · ${next.client}` : 'сегодня активных сеансов нет'}</h2><p className="mt-1 text-sm font-bold opacity-75">{next ? `${next.service} · ${statusLabel(next.status)}` : 'открой календарь или список клиентов'}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setTab('day')} className="rounded-full bg-emerald-950 px-4 py-2 text-xs font-black text-lime-100">Открыть день</button><button onClick={() => setTab('requests')} className="rounded-full bg-white/35 px-4 py-2 text-xs font-black text-emerald-950">Запросы: {requestEvents.length}</button></div></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-3"><Action title="Сеансы дня" text="отметить завершение и замеры" onClick={() => setTab('day')} /><Action title="Клиенты" text="карточки, заметки, история" onClick={() => setTab('clients')} /><Action title="Календарь" text="месяцы, рабочие дни, записи" onClick={() => setTab('calendar')} /></div>
  </Panel>;
}

function DaySchedule({ selectedStaff, date, setDate, dayEvents, updateEvent, finishSession, approveClientChange, rejectClientChange }) {
  const byTime = new Map(dayEvents.map((event) => [event.time, event]));
  const working = isWorking(selectedStaff, date);
  return <Panel eyebrow="расписание" title={`${date} · ${weekday(date)}`}>
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"><Field label="Дата" type="date" value={date} set={setDate} /><button onClick={() => setDate(addDays(date, -1))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">← день</button><button onClick={() => setDate(addDays(date, 1))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">день →</button></div>
    <div className="mt-3 rounded-xl bg-black/20 p-2 text-xs font-bold text-emerald-50/65">{working ? `Рабочий день ${staffHoursLabel(selectedStaff)}` : 'Выходной по графику 2/2'} · записей: {dayEvents.length}</div>
    <div className="mt-3 grid gap-1.5">{hoursFor(selectedStaff).map((hour) => { const item = byTime.get(hour); return <div key={hour} className="grid grid-cols-[48px_minmax(0,1fr)] gap-2"><span className="pt-3 text-[10px] text-emerald-50/45">{hour}</span>{item ? <SessionCard event={item} updateEvent={updateEvent} finishSession={finishSession} approveClientChange={approveClientChange} rejectClientChange={rejectClientChange} /> : <div className={cx('rounded-xl border border-dashed px-3 py-3 text-xs', working ? 'border-white/10 bg-white/5 text-emerald-50/40' : 'border-red-300/10 bg-red-500/10 text-red-100/45')}>{working ? 'свободно' : 'выходной'}</div>}</div>; })}</div>
  </Panel>;
}

function CalendarView({ selectedStaff, events, date, setDate, month, setMonth, updateEvent, finishSession, approveClientChange, rejectClientChange }) {
  const counts = new Map();
  events.forEach((event) => counts.set(event.date, (counts.get(event.date) || 0) + 1));
  const dayEvents = events.filter((event) => event.date === date);
  const visibleMonth = month.slice(0, 7);
  return <Panel eyebrow="месячный календарь" title="Календарь массажиста">
    <div className="rounded-2xl bg-white/10 p-3"><div className="mb-2 flex items-center justify-between gap-2"><button onClick={() => setMonth(addMonths(month, -1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">‹</button><div className="text-center"><b className="capitalize text-lime-100">{monthTitle(month)}</b><div className="text-[10px] text-emerald-50/45">{selectedStaff.name} · {staffHoursLabel(selectedStaff)}</div></div><button onClick={() => setMonth(addMonths(month, 1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">›</button></div><div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-emerald-50/40"><span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span></div><div className="mt-1 grid grid-cols-7 gap-1">{calendarDays(month).map((d) => { const count = counts.get(d) || 0; const working = isWorking(selectedStaff, d); return <button key={d} onClick={() => setDate(d)} className={cx('relative rounded-xl px-1 py-2 text-center', date === d ? 'bg-blue-600 text-white' : count ? 'bg-lime-200 text-emerald-950' : working ? 'bg-white/10 text-emerald-50/65' : 'bg-red-500/10 text-red-100/45', d.slice(0, 7) !== visibleMonth && 'opacity-35')}><b className="block text-xs">{d.slice(8)}</b><span className="text-[8px]">{weekday(d).slice(0,2)}</span>{count > 0 && <em className="absolute right-0 top-0 rounded-full bg-emerald-950 px-1 text-[8px] font-black not-italic text-lime-100">{count}</em>}</button>; })}</div></div>
    <div className="mt-3 grid gap-2"><b className="text-lime-100">{date} · {weekday(date)}</b>{dayEvents.length === 0 && <Empty text="На выбранный день сеансов нет." />}{dayEvents.map((event) => <SessionCard key={event.id} event={event} updateEvent={updateEvent} finishSession={finishSession} approveClientChange={approveClientChange} rejectClientChange={rejectClientChange} />)}</div>
  </Panel>;
}

function ClientsView({ query, setQuery, rows, selected, setSelected, saveClientNote, updateEvent, finishSession }) {
  return <Panel eyebrow="мои клиенты" title="Клиенты массажиста">
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск: имя, телефон, заметка, услуга" className="mb-3 w-full rounded-2xl bg-white px-4 py-4 text-sm font-bold text-emerald-950 outline-none" />
    {!selected ? <div className="grid gap-2 md:grid-cols-2">{rows.length === 0 && <Empty text="Клиенты не найдены." />}{rows.map((row) => <button key={row.client.id} onClick={() => setSelected(row.client.id)} className="rounded-2xl bg-white/10 p-3 text-left"><b className="block truncate text-lg text-lime-100">{row.client.name}</b><span className="text-xs text-emerald-50/55">{row.client.phone || 'телефон не указан'}</span><div className="mt-3 grid grid-cols-3 gap-1"><Mini label="сеансов" value={row.stat.total} /><Mini label="часов" value={row.stat.hours} /><Mini label="вес" value={row.stat.delta} /></div>{row.client.privateNotes && <div className="mt-2 line-clamp-2 rounded-xl bg-black/20 px-2 py-1 text-[11px] text-emerald-50/50">{row.client.privateNotes}</div>}</button>)}</div> : <ClientDetail row={selected} back={() => setSelected('')} saveClientNote={saveClientNote} updateEvent={updateEvent} finishSession={finishSession} />}
  </Panel>;
}

function ClientDetail({ row, back, saveClientNote, updateEvent, finishSession }) {
  const [note, setNote] = useState(row.client.privateNotes || '');
  const [section, setSection] = useState('future');
  const sorted = [...row.events].sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)));
  const future = sorted.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled');
  const history = sorted.filter((event) => eventDateTime(event) < `${today()}T00:00` || ['done','cancelled'].includes(event.status));
  const shown = section === 'history' ? history : section === 'all' ? sorted : future;
  return <div><button onClick={back} className="mb-3 rounded-full bg-white/10 px-4 py-2 text-xs font-black">← список</button><div className="rounded-2xl bg-lime-200/10 p-3"><h3 className="text-2xl font-black text-lime-50">{row.client.name}</h3><p className="text-sm text-emerald-50/55">{row.client.phone || 'телефон не указан'} · {row.client.email || 'email не указан'}</p></div><div className="mt-3 grid grid-cols-3 gap-2"><Stat label="Сеансы" value={row.stat.total} /><Stat label="Часы" value={row.stat.hours} /><Stat label="ИМТ" value={bmi(row.stat.last?.weight, row.stat.last?.height)} /></div><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1"><SmallTab id="future" value={section} setValue={setSection} label="Будущие" /><SmallTab id="history" value={section} setValue={setSection} label="История" /><SmallTab id="all" value={section} setValue={setSection} label="Все" /></div><label className="mt-3 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">закрытая пометка массажиста</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950" /></label><button onClick={() => saveClientNote(row.client, note)} className="mt-2 rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить пометку</button><div className="mt-3 grid gap-2">{shown.map((event) => <SessionCard key={event.id} event={event} updateEvent={updateEvent} finishSession={finishSession} compact />)}</div></div>;
}

function RequestsView({ requests, approve, reject, updateEvent }) {
  return <Panel eyebrow="согласования" title="Запросы клиентов">
    <div className="grid gap-2">{requests.length === 0 && <Empty text="Запросов на согласование нет." />}{requests.map((event) => <div key={event.id} className="rounded-2xl bg-white/10 p-3"><b className="text-lime-100">{event.client} · {event.date} {event.time}</b><div className="mt-1 text-sm text-emerald-50/60">{event.requestedCancel ? 'клиент просит отмену' : event.requestedDate ? `клиент просит перенос на ${event.requestedDate} ${event.requestedTime}` : statusLabel(event.status)}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => approve(event)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Согласовать</button><button onClick={() => reject(event)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Отклонить</button><button onClick={() => updateEvent(event.id, { ...event, status: 'confirmed' })} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-100">Оставить подтверждённым</button></div></div>)}</div>
  </Panel>;
}

function ProfileView({ person }) {
  return <Panel eyebrow="мой профиль" title={person.name}><div className="grid gap-2 sm:grid-cols-2"><Info label="Должность" value={person.title} /><Info label="Телефон" value={person.phone} /><Info label="График" value={`2/2 · ${staffHoursLabel(person)}`} /><Info label="Сегодня" value={isWorking(person, today()) ? 'рабочий день' : 'выходной'} /></div><div className="mt-3 rounded-xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/80">Изменение ФИО, адреса, рабочего времени и графика доступно администратору в разделе «Люди · расписания».</div></Panel>;
}

function SessionCard({ event, updateEvent, finishSession, approveClientChange, rejectClientChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...event, sessionNote: '' });
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  return <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-lime-100">{event.time} · {event.client || 'Клиент'}</b><div className="truncate text-sm text-emerald-50/70">{event.date} · {weekday(event.date)} · {event.service}</div><div className="text-xs text-emerald-50/45">{event.phone || 'телефон не указан'} · {event.duration || 60} мин</div>{event.requestedDate && <div className="mt-2 rounded-xl bg-blue-500/15 px-2 py-1 text-xs font-bold text-blue-100">Клиент просит перенос: {event.requestedDate} · {event.requestedTime}</div>}{event.requestedCancel && <div className="mt-2 rounded-xl bg-red-500/15 px-2 py-1 text-xs font-bold text-red-100">Клиент просит отмену</div>}</div><span className={cx('shrink-0 rounded-full px-2 py-1 text-[10px] font-black', statusTone(event.status))}>{statusLabel(event.status)}</span></div>{(event.weight || event.height) && <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-2"><Mini label="вес" value={event.weight ? `${event.weight} кг` : '—'} /><Mini label="рост" value={event.height ? `${event.height} см` : '—'} /><Mini label="ИМТ" value={bmi(event.weight, event.height)} /></div>}
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setOpen(!open)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Открыть сеанс</button>{event.status === 'change' && approveClientChange && <button onClick={() => approveClientChange(event)} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Согласовать</button>}{event.status === 'change' && rejectClientChange && <button onClick={() => rejectClientChange(event)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Отклонить</button>}</div>
    {open && <div className="mt-3 grid gap-2 rounded-xl bg-black/20 p-2"><div className="grid gap-2 sm:grid-cols-3"><Field label="Дата" type="date" value={draft.date || ''} set={(v) => set('date', v)} /><Field label="Время" value={draft.time || ''} set={(v) => set('time', v)} /><SelectStatus value={draft.status || 'new'} set={(v) => set('status', v)} /><Field label="Услуга" value={draft.service || ''} set={(v) => set('service', v)} /><Field label="Минут" value={String(draft.duration || '')} set={(v) => set('duration', v)} /><Field label="Вес, кг" value={String(draft.weight || '')} set={(v) => set('weight', v)} /><Field label="Рост, см" value={String(draft.height || '')} set={(v) => set('height', v)} /></div><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">заметка после сеанса</span><textarea value={draft.sessionNote || ''} onChange={(e) => set('sessionNote', e.target.value)} rows={2} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label><div className="flex flex-wrap gap-2"><button onClick={() => updateEvent(event.id, draft)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-100">Сохранить</button><button onClick={() => finishSession(event, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Завершить с замерами</button><button onClick={() => updateEvent(event.id, { ...draft, status: 'change', note: `${draft.note || ''} Требуется согласование изменения массажистом.`.trim() })} className="rounded-full bg-blue-500/25 px-4 py-2 text-xs font-black text-blue-100">Перенести / согласовать</button></div></div>}
  </div>;
}

function Action({ title, text, onClick }) { return <button onClick={onClick} className="rounded-2xl bg-white/10 p-3 text-left transition hover:bg-white/[.14] active:scale-[.99]"><b className="block text-lime-100">{title}</b><span className="text-xs text-emerald-50/50">{text}</span></button>; }
function SmallTab({ id, value, setValue, label }) { return <button onClick={() => setValue(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', value === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50/70')}>{label}</button>; }
function Stat({ label, value }) { return <div className="rounded-xl bg-white/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-lime-200/55">{label}</div><b className="mt-1 block text-xl text-lime-100">{value}</b></div>; }
function Mini({ label, value }) { return <div className="rounded-xl bg-black/20 px-2 py-1"><div className="text-[8px] font-black uppercase tracking-[.1em] text-lime-200/50">{label}</div><b className="text-xs text-lime-100">{value}</b></div>; }
function Info({ label, value }) { return <div className="rounded-xl bg-white/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-lime-200/55">{label}</div><b className="mt-1 block text-lime-100">{value || '—'}</b></div>; }
function SelectStatus({ value, set }) { return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Статус</span><select value={value} onChange={(e) => set(e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950"><option value="new">заявка</option><option value="confirmed">подтверждена</option><option value="done">завершена</option><option value="change">согласовать</option><option value="cancelled">отменена</option></select></label>; }
function Field({ label, value, set, type = 'text' }) { return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value || ''} onChange={(e) => set(e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label>; }
function Panel({ eyebrow, title, children }) { return <section className="rounded-[1.2rem] border border-white/10 bg-[#07140e]/80 p-3 shadow-2xl shadow-black/30 md:p-5"><div className="mb-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">{eyebrow}</div><h1 className="mt-0.5 text-2xl font-black tracking-[-.06em] text-lime-50 md:text-4xl">{title}</h1></div>{children}</section>; }
function Empty({ text }) { return <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5 text-center text-sm font-bold text-emerald-50/55">{text}</div>; }

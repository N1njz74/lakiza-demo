import { useMemo, useState } from 'react';

const STORAGE_EVENTS = 'lakizaAdminSchedulerEvents';
const STORAGE_STAFF = 'lakizaAdminSchedulerStaff';
const STORAGE_CLIENTS = 'lakizaClientProfiles';
const START_HOUR = 8;
const END_HOUR = 20;

const defaultStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', shift: 0, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', shift: 1, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', shift: 2, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', shift: 3, active: true },
];

const services = [
  { id: 'back', title: 'Спина и шея', duration: 60, price: 'от 2 000 ₽' },
  { id: 'classic', title: 'Классический массаж', duration: 90, price: 'от 2 800 ₽' },
  { id: 'stress', title: 'Антистресс', duration: 60, price: 'от 2 200 ₽' },
  { id: 'lymph', title: 'Лимфодренаж', duration: 60, price: 'от 2 500 ₽' },
  { id: 'course', title: 'Курс массажа', duration: 120, price: 'индивидуально' },
];

function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); }
function monthStart(date) { const d = new Date(`${date}T12:00:00`); d.setDate(1); return d.toISOString().slice(0, 10); }
function addMonths(date, shift) { const d = new Date(`${date}T12:00:00`); d.setDate(1); d.setMonth(d.getMonth() + shift); return d.toISOString().slice(0, 10); }
function monthTitle(date) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function weekday(date) { return new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date(`${date}T12:00:00`)); }
function calendarDays(month) { const start = monthStart(month); const first = new Date(`${start}T12:00:00`); const offset = (first.getDay() + 6) % 7; const gridStart = new Date(first); gridStart.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d.toISOString().slice(0, 10); }); }
function dayIndex(date) { return Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000); }
function isWorking(person, date) { return ((dayIndex(date) + Number(person.shift || 0)) % 4) < 2; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function phoneKey(value) { const raw = digits(value); return raw.startsWith('7') ? raw.slice(1) : raw.startsWith('8') ? raw.slice(1) : raw; }
function formatPhone(value) { const d = phoneKey(value).slice(0, 10); return `+7${d ? ' ' + d.slice(0,3) : ''}${d.length > 3 ? ' ' + d.slice(3,6) : ''}${d.length > 6 ? '-' + d.slice(6,8) : ''}${d.length > 8 ? '-' + d.slice(8,10) : ''}`; }
function fullName(user) { return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Клиент'; }
function eventDateTime(event) { return `${event.date}T${event.time || '00:00'}`; }
function staffName(staff, id) { return staff.find((x) => x.id === id)?.name || 'любой массажист'; }
function bmi(weight, height) { const w = Number(weight); const h = Number(height) / 100; return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '—'; }
function statusLabel(status) { return { new: 'заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена', change: 'ожидает согласования' }[status] || status; }
function statusTone(status) { return status === 'confirmed' ? 'bg-lime-200 text-emerald-950' : status === 'done' ? 'bg-white/15 text-emerald-50' : status === 'cancelled' ? 'bg-red-500/20 text-red-100' : 'bg-blue-500/20 text-blue-100'; }
function clientMatches(event, user) { const userPhone = phoneKey(user?.phone || user?.login); const eventPhone = phoneKey(event.phone); return Boolean(userPhone && eventPhone && userPhone === eventPhone); }
function hours() { return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${String(START_HOUR + i).padStart(2, '0')}:00`); }
function serviceByTitle(title) { return services.find((service) => service.title === title) || services[0]; }

export default function ClientPortal({ user, onUserUpdate }) {
  const [tab, setTab] = useState('home');
  const [staff] = useState(() => readJson(STORAGE_STAFF, defaultStaff).filter((person) => person.active !== false));
  const [events, setEvents] = useState(() => readJson(STORAGE_EVENTS, []));
  const [clients, setClients] = useState(() => readJson(STORAGE_CLIENTS, []));
  const [profile, setProfile] = useState(() => makeProfile(user, readJson(STORAGE_CLIENTS, [])));
  const [draft, setDraft] = useState(() => makeBookingDraft(user, staff));

  const myEvents = useMemo(() => events.filter((event) => clientMatches(event, user)).sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b))), [events, user]);
  const upcoming = myEvents.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled');
  const history = myEvents.filter((event) => eventDateTime(event) < `${today()}T00:00` || ['done', 'cancelled'].includes(event.status));
  const nextEvent = upcoming[0];
  const lastMetrics = [...myEvents].reverse().find((event) => event.weight || event.height) || null;

  const saveEvents = (next) => { setEvents(next); saveJson(STORAGE_EVENTS, next); };
  const saveProfile = () => {
    if (!window.confirm('Сохранить изменения профиля клиента?')) return;
    const clientId = `client-${phoneKey(profile.phone || user.login)}`;
    const item = { id: clientId, name: profile.name, phone: profile.phone, email: profile.email, assignedStaffId: profile.preferredStaffId, clientPublicNote: profile.clientPublicNote || '', privateNotes: '', createdAt: new Date().toISOString() };
    const exists = clients.some((client) => client.id === clientId);
    const nextClients = exists ? clients.map((client) => client.id === clientId ? { ...client, ...item } : client) : [...clients, item];
    setClients(nextClients);
    saveJson(STORAGE_CLIENTS, nextClients);
    onUserUpdate?.({ ...user, name: profile.name.split(' ')[0] || user.name, surname: profile.name.split(' ').slice(1).join(' ') || user.surname, phone: profile.phone, email: profile.email });
  };

  const createBooking = () => {
    if (!draft.date || !draft.time || !draft.service) return alert('Выбери дату, время и услугу.');
    if (!window.confirm(`Отправить заявку на ${draft.date} ${draft.time}?`)) return;
    const service = serviceByTitle(draft.service);
    const nextEvent = {
      id: `client-${Date.now()}`,
      date: draft.date,
      time: draft.time,
      duration: Number(draft.duration || service.duration),
      staffId: draft.staffId,
      client: profile.name || fullName(user),
      phone: profile.phone || user.phone || user.login,
      service: draft.service,
      status: 'new',
      note: draft.comment,
      source: 'client',
      metricsSource: 'therapist_after_session',
    };
    saveEvents([...events, nextEvent]);
    setDraft(makeBookingDraft({ ...user, phone: profile.phone }, staff));
    setTab('appointments');
  };

  const requestChange = (event, patch) => {
    if (!window.confirm(`Отправить запрос переноса записи ${event.date} ${event.time}?`)) return;
    const changeText = `Клиент просит перенос: ${event.date} ${event.time} → ${patch.date} ${patch.time}. ${patch.note || ''}`.trim();
    saveEvents(events.map((item) => item.id === event.id ? { ...item, requestedDate: patch.date, requestedTime: patch.time, status: 'change', note: [item.note, changeText].filter(Boolean).join(' | ') } : item));
  };
  const cancelEvent = (event) => {
    if (!window.confirm(`Отправить запрос отмены записи ${event.date} ${event.time}?`)) return;
    saveEvents(events.map((item) => item.id === event.id ? { ...item, requestedCancel: true, status: 'change', note: [item.note, 'Клиент просит отменить запись'].filter(Boolean).join(' | ') } : item));
  };

  return <div className="grid gap-3">
    <ClientTabs tab={tab} setTab={setTab} />
    {tab === 'home' && <HomeSection user={user} nextEvent={nextEvent} upcoming={upcoming} history={history} lastMetrics={lastMetrics} staff={staff} setTab={setTab} />}
    {tab === 'appointments' && <AppointmentsSection allEvents={myEvents} upcoming={upcoming} history={history} staff={staff} requestChange={requestChange} cancelEvent={cancelEvent} />}
    {tab === 'book' && <BookingSection draft={draft} setDraft={setDraft} staff={staff} createBooking={createBooking} events={events} />}
    {tab === 'profile' && <ProfileSection profile={profile} setProfile={setProfile} staff={staff} saveProfile={saveProfile} />}
    {tab === 'messages' && <MessagesSection nextEvent={nextEvent} />}
  </div>;
}

function makeProfile(user, clients) {
  const phone = formatPhone(user?.phone || user?.login || '+7');
  const client = clients.find((item) => phoneKey(item.phone) === phoneKey(phone));
  return {
    name: client?.name || fullName(user),
    phone: client?.phone || phone,
    email: client?.email || user?.email || '',
    preferredStaffId: client?.assignedStaffId || 'kristina',
    clientPublicNote: client?.clientPublicNote || '',
  };
}
function makeBookingDraft(user, staff) {
  return {
    date: addDays(today(), 1),
    time: '10:00',
    staffId: staff?.[0]?.id || 'kristina',
    service: services[0].title,
    duration: services[0].duration,
    comment: '',
  };
}

function ClientTabs({ tab, setTab }) {
  const tabs = [['home', 'Главная'], ['appointments', 'Сеансы'], ['book', 'Запись'], ['profile', 'Профиль'], ['messages', 'Чат']];
  return <div className="sticky top-[76px] z-40 -mx-2 border-y border-white/5 bg-[#06110b]/92 px-2 py-2 backdrop-blur md:top-[104px]"><div className="grid grid-cols-5 gap-1 rounded-[1.1rem] bg-white/8 p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cx('rounded-xl px-1 py-2.5 text-[10px] font-black transition active:scale-[.98] md:text-xs', tab === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{label}</button>)}</div></div>;
}

function HomeSection({ user, nextEvent, upcoming, history, lastMetrics, staff, setTab }) {
  return <Panel eyebrow="личный кабинет" title={`Здравствуйте, ${user.name || 'клиент'}`}>
    <div className="grid gap-2 sm:grid-cols-4"><Stat label="Будущие" value={upcoming.length} /><Stat label="История" value={history.length} /><Stat label="Последний вес" value={lastMetrics?.weight || '—'} /><Stat label="ИМТ" value={bmi(lastMetrics?.weight, lastMetrics?.height)} /></div>
    <div className="mt-3 rounded-xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/85">Вес, рост и ИМТ вносит массажист после сеанса в кабинете. Клиент здесь только видит последние замеры.</div>
    <div className="mt-3 rounded-2xl bg-lime-200 p-4 text-emerald-950 shadow-xl shadow-black/20">
      <div className="text-[10px] font-black uppercase tracking-[.14em] opacity-60">ближайший сеанс</div>
      <h2 className="mt-1 text-2xl font-black">{nextEvent ? `${nextEvent.date} · ${weekday(nextEvent.date)} · ${nextEvent.time}` : 'пока нет записи'}</h2>
      <p className="mt-1 text-sm font-bold opacity-75">{nextEvent ? `${nextEvent.service} · ${staffName(staff, nextEvent.staffId)} · ${statusLabel(nextEvent.status)}` : 'можно отправить заявку на удобное время'}</p>
      <button type="button" onClick={() => setTab(nextEvent ? 'appointments' : 'book')} className="mt-4 rounded-full bg-emerald-950 px-4 py-2 text-xs font-black text-lime-100">{nextEvent ? 'Открыть сеансы' : 'Записаться'}</button>
    </div>
    <QuickActions setTab={setTab} />
  </Panel>;
}
function QuickActions({ setTab }) { return <div className="mt-3 grid gap-2 sm:grid-cols-3"><Action title="Новая запись" text="выбрать дату и услугу" onClick={() => setTab('book')} /><Action title="Мои сеансы" text="перенос или отмена" onClick={() => setTab('appointments')} /><Action title="Данные профиля" text="телефон, email, пожелания" onClick={() => setTab('profile')} /></div>; }
function Action({ title, text, onClick }) { return <button type="button" onClick={onClick} className="rounded-2xl bg-white/10 p-3 text-left transition hover:bg-white/[.14] active:scale-[.99]"><b className="block text-lime-100">{title}</b><span className="text-xs text-emerald-50/50">{text}</span></button>; }

function AppointmentsSection({ allEvents, upcoming, history, staff, requestChange, cancelEvent }) {
  const [mode, setMode] = useState('upcoming');
  const [month, setMonth] = useState(monthStart(today()));
  const [selectedDate, setSelectedDate] = useState(today());
  const list = mode === 'upcoming' ? upcoming : mode === 'history' ? history : allEvents;
  const dayEvents = allEvents.filter((event) => event.date === selectedDate);
  return <Panel eyebrow="личное расписание" title="Мои сеансы">
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/10 p-1">
      {[['upcoming', `Будущие · ${upcoming.length}`], ['history', `История · ${history.length}`], ['all', `Все · ${allEvents.length}`], ['calendar', 'Календарь']].map(([id, label]) => <button key={id} onClick={() => setMode(id)} className={cx('rounded-lg px-1 py-2 text-[10px] font-black', mode === id ? 'bg-blue-600 text-white' : 'text-emerald-50/70')}>{label}</button>)}
    </div>
    {mode === 'calendar' ? <ClientCalendar events={allEvents} staff={staff} month={month} setMonth={setMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dayEvents={dayEvents} requestChange={requestChange} cancelEvent={cancelEvent} /> : <div className="mt-3 grid gap-2">{list.length === 0 && <Empty text={mode === 'upcoming' ? 'Предстоящих сеансов нет.' : mode === 'history' ? 'История пока пустая.' : 'Сеансов пока нет.'} />}{list.map((event) => <ClientEventCard key={event.id} event={event} staff={staff} requestChange={requestChange} cancelEvent={cancelEvent} />)}</div>}
  </Panel>;
}
function ClientCalendar({ events, staff, month, setMonth, selectedDate, setSelectedDate, dayEvents, requestChange, cancelEvent }) {
  const visibleMonth = month.slice(0, 7);
  const counts = new Map();
  events.forEach((event) => counts.set(event.date, (counts.get(event.date) || 0) + 1));
  return <div className="mt-3 grid gap-3">
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><button onClick={() => setMonth(addMonths(month, -1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">‹</button><div className="text-center"><b className="capitalize text-lime-100">{monthTitle(month)}</b><div className="text-[10px] text-emerald-50/45">дни недели и записи</div></div><button onClick={() => setMonth(addMonths(month, 1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">›</button></div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-emerald-50/40"><span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span></div>
      <div className="mt-1 grid grid-cols-7 gap-1">{calendarDays(month).map((d) => { const count = counts.get(d) || 0; const outside = d.slice(0, 7) !== visibleMonth; return <button key={d} type="button" onClick={() => setSelectedDate(d)} className={cx('relative rounded-xl px-1 py-2 text-center', selectedDate === d ? 'bg-blue-600 text-white' : count ? 'bg-lime-200 text-emerald-950' : outside ? 'bg-white/5 text-emerald-50/20' : 'bg-white/10 text-emerald-50/45')}><b className="block text-xs">{d.slice(8)}</b><span className="text-[8px]">{weekday(d).slice(0, 2)}</span>{count > 0 && <em className="absolute right-0 top-0 rounded-full bg-emerald-950 px-1 text-[8px] font-black not-italic text-lime-100">{count}</em>}</button>; })}</div>
    </div>
    <div className="rounded-2xl bg-white/10 p-3"><b className="text-lime-100">{selectedDate} · {weekday(selectedDate)}</b><div className="mt-2 grid gap-2">{dayEvents.length === 0 && <Empty text="На этот день записей нет." />}{dayEvents.map((event) => <ClientEventCard key={event.id} event={event} staff={staff} requestChange={requestChange} cancelEvent={cancelEvent} />)}</div></div>
  </div>;
}
function ClientEventCard({ event, staff, requestChange, cancelEvent }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ date: event.requestedDate || event.date, time: event.requestedTime || event.time, note: 'Прошу перенести запись' });
  const locked = ['done', 'cancelled', 'change'].includes(event.status);
  return <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-lime-100">{event.date} · {weekday(event.date)} · {event.time}</b><div className="truncate text-sm text-emerald-50/70">{event.service} · {staffName(staff, event.staffId)}</div><div className="mt-1 text-xs text-emerald-50/45">{event.duration} мин · {event.note || 'без комментария'}</div>{event.requestedDate && <div className="mt-2 rounded-xl bg-blue-500/15 px-2 py-1 text-xs font-bold text-blue-100">Запрошен перенос на {event.requestedDate} · {weekday(event.requestedDate)} · {event.requestedTime}</div>}{event.requestedCancel && <div className="mt-2 rounded-xl bg-red-500/15 px-2 py-1 text-xs font-bold text-red-100">Запрошена отмена. Ожидается согласование администратора.</div>}</div><span className={cx('shrink-0 rounded-full px-2 py-1 text-[10px] font-black', statusTone(event.status))}>{statusLabel(event.status)}</span></div>
    {(event.weight || event.height) && <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-2"><MiniMetric label="Вес" value={event.weight ? `${event.weight} кг` : '—'} /><MiniMetric label="Рост" value={event.height ? `${event.height} см` : '—'} /><MiniMetric label="ИМТ" value={bmi(event.weight, event.height)} /></div>}
    {!event.weight && !event.height && event.status === 'done' && <div className="mt-3 rounded-xl bg-white/5 p-2 text-xs text-emerald-50/45">Замеры ещё не внесены массажистом.</div>}
    {!locked && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setOpen(!open)} className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">Перенести</button><button type="button" onClick={() => cancelEvent(event)} className="rounded-full bg-red-500/20 px-3 py-2 text-xs font-black text-red-100">Запросить отмену</button></div>}
    {event.status === 'change' && <div className="mt-3 rounded-xl bg-blue-500/10 p-2 text-xs font-bold text-blue-100">Заявка отправлена. Сейчас требуется согласование администратора.</div>}
    {open && <div className="mt-3 grid gap-2 rounded-xl bg-black/20 p-2"><div className="grid grid-cols-2 gap-2"><Input label="Новая дата" type="date" value={draft.date} set={(v) => setDraft((p) => ({ ...p, date: v }))} /><Input label="Новое время" value={draft.time} set={(v) => setDraft((p) => ({ ...p, time: v }))} /></div><Input label="Причина / комментарий" value={draft.note} set={(v) => setDraft((p) => ({ ...p, note: v }))} /><button type="button" onClick={() => requestChange(event, draft)} className="w-fit rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Отправить на согласование</button></div>}
  </div>;
}
function MiniMetric({ label, value }) { return <div><div className="text-[8px] font-black uppercase tracking-[.12em] text-lime-200/45">{label}</div><b className="text-sm text-lime-100">{value}</b></div>; }

function BookingSection({ draft, setDraft, staff, createBooking, events }) {
  const service = serviceByTitle(draft.service);
  const busySlots = events.filter((event) => event.date === draft.date && (draft.staffId === 'any' || event.staffId === draft.staffId)).map((event) => event.time);
  const selectedStaff = staff.find((person) => person.id === draft.staffId) || staff[0];
  const availableHours = hours().filter((hour) => !busySlots.includes(hour) && (!selectedStaff || isWorking(selectedStaff, draft.date)));
  const set = (key, value) => setDraft((p) => ({ ...p, [key]: value }));
  return <Panel eyebrow="новая запись" title="Выбор времени">
    <div className="grid gap-2 sm:grid-cols-2"><Input label="Дата" type="date" value={draft.date} set={(v) => set('date', v)} /><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Массажист</span><select value={draft.staffId} onChange={(e) => set('staffId', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="block sm:col-span-2"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Услуга</span><select value={draft.service} onChange={(e) => { const next = serviceByTitle(e.target.value); setDraft((p) => ({ ...p, service: next.title, duration: next.duration })); }} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{services.map((item) => <option key={item.id} value={item.title}>{item.title} · {item.duration} мин · {item.price}</option>)}</select></label></div>
    <div className="mt-3 rounded-2xl bg-white/8 p-3"><div className="mb-2 flex items-center justify-between"><b className="text-lime-100">Свободное время</b><span className="text-xs text-emerald-50/45">занятые скрыты</span></div><div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">{hours().map((hour) => { const free = availableHours.includes(hour); return <button key={hour} type="button" disabled={!free} onClick={() => set('time', hour)} className={cx('rounded-xl px-2 py-2 text-xs font-black', draft.time === hour ? 'bg-blue-600 text-white' : free ? 'bg-lime-200 text-emerald-950' : 'bg-white/5 text-emerald-50/25')}>{hour}</button>; })}</div></div>
    <div className="mt-3 rounded-xl border border-lime-200/15 bg-lime-200/10 p-3 text-sm text-lime-100/85"><b className="block text-lime-100">Вес и рост не вводятся клиентом.</b><span className="text-emerald-50/65">Взвешивание проходит в кабинете. После сеанса замеры вносит массажист, а клиент потом видит их в истории сеансов.</span></div>
    <label className="mt-3 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Комментарий администратору</span><textarea value={draft.comment} onChange={(e) => set('comment', e.target.value)} rows={3} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" placeholder="Пожелания, больные зоны, удобное окно для звонка" /></label>
    <div className="mt-3 rounded-xl bg-lime-200/10 p-3 text-sm text-emerald-50/70">Заявка уйдёт администратору. До подтверждения она отмечается как «заявка».</div>
    <button type="button" onClick={createBooking} className="mt-3 w-full rounded-full bg-lime-200 px-5 py-4 text-sm font-black text-emerald-950">Отправить заявку · {service.duration} мин</button>
  </Panel>;
}

function ProfileSection({ profile, setProfile, staff, saveProfile }) {
  const set = (key, value) => setProfile((p) => ({ ...p, [key]: key === 'phone' ? formatPhone(value) : value }));
  return <Panel eyebrow="мои данные" title="Профиль клиента">
    <div className="grid gap-2 sm:grid-cols-2"><Input label="ФИО" value={profile.name} set={(v) => set('name', v)} /><Input label="Телефон" value={profile.phone} set={(v) => set('phone', v)} /><Input label="Email для напоминаний" value={profile.email} set={(v) => set('email', v)} /><label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Предпочитаемый массажист</span><select value={profile.preferredStaffId} onChange={(e) => set('preferredStaffId', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label></div>
    <label className="mt-3 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Мои пожелания</span><textarea value={profile.clientPublicNote} onChange={(e) => set('clientPublicNote', e.target.value)} rows={4} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" placeholder="Например: не делать сильное давление, болит поясница, удобнее вечером" /></label>
    <div className="mt-3 rounded-xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/80">Административные закрытые пометки клиента здесь не показываются. Вес/рост клиент не редактирует: эти данные вносит массажист после сеанса.</div>
    <button type="button" onClick={saveProfile} className="mt-3 rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить профиль</button>
  </Panel>;
}

function MessagesSection({ nextEvent }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([{ from: 'Администратор', text: 'Здесь будет переписка по записи. Пока это демонстрационный чат.', at: 'сейчас' }]);
  const send = () => { if (!text.trim()) return; setMessages([...messages, { from: 'Вы', text: text.trim(), at: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }]); setText(''); };
  return <Panel eyebrow="сообщения" title="Чат с кабинетом"><div className="rounded-2xl bg-white/8 p-3"><div className="mb-3 text-xs text-emerald-50/50">Контекст: {nextEvent ? `${nextEvent.date} · ${nextEvent.time} · ${nextEvent.service}` : 'общий вопрос'}</div><div className="grid gap-2">{messages.map((msg, index) => <div key={index} className={cx('max-w-[85%] rounded-2xl p-3 text-sm', msg.from === 'Вы' ? 'ml-auto bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}><b className="block text-xs opacity-65">{msg.from} · {msg.at}</b>{msg.text}</div>)}</div><div className="mt-3 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение..." className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" /><button type="button" onClick={send} className="rounded-xl bg-lime-200 px-4 text-xs font-black text-emerald-950">Отпр.</button></div></div></Panel>;
}

function Stat({ label, value }) { return <div className="rounded-xl bg-white/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-lime-200/55">{label}</div><b className="mt-1 block text-xl text-lime-100">{value}</b></div>; }
function Input({ label, value, set, type = 'text' }) { return <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value || ''} onChange={(e) => set(e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none" /></label>; }
function Panel({ eyebrow, title, children }) { return <section className="rounded-[1.2rem] border border-white/10 bg-[#07140e]/80 p-3 shadow-2xl shadow-black/30 md:p-5"><div className="mb-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">{eyebrow}</div><h1 className="mt-0.5 text-2xl font-black tracking-[-.06em] text-lime-50 md:text-4xl">{title}</h1></div>{children}</section>; }
function Empty({ text }) { return <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-5 text-center text-sm font-bold text-emerald-50/55">{text}</div>; }

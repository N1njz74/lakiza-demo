import { useEffect, useMemo, useState } from 'react';

const EVENTS_KEY = 'lakizaAdminSchedulerEvents';
const STAFF_KEY = 'lakizaAdminSchedulerStaff';
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

const fallbackStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', phone: '+7 900 100-10-01', address: 'адрес доступен администратору', shift: 0, workStart: 8, workEnd: 20, active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', phone: '+7 900 100-10-02', address: 'адрес доступен администратору', shift: 1, workStart: 9, workEnd: 21, active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', phone: '+7 900 100-10-03', address: 'адрес доступен администратору', shift: 2, workStart: 7, workEnd: 19, active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', phone: '+7 900 100-10-04', address: 'адрес доступен администратору', shift: 3, workStart: 8, workEnd: 21, active: true },
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
function staffStart(person) { return Number(person?.workStart ?? person?.startHour ?? DEFAULT_START_HOUR); }
function staffEnd(person) { return Number(person?.workEnd ?? person?.endHour ?? DEFAULT_END_HOUR); }
function staffHours(person) { const start = Math.max(7, Math.min(21, staffStart(person))); const end = Math.max(start + 1, Math.min(22, staffEnd(person))); return { start, end }; }
function staffHoursLabel(person) { const { start, end } = staffHours(person); return `${String(start).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`; }
function hoursFor(person) { const { start, end } = staffHours(person); return Array.from({ length: end - start }, (_, i) => `${String(start + i).padStart(2, '0')}:00`); }
function eventDateTime(event) { return `${event.date || '0000-00-00'}T${event.time || '00:00'}`; }
function statusLabel(status) { return { new: 'заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена', change: 'согласовать' }[status] || status || 'заявка'; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function mergeStaffDefaults(items) { const source = Array.isArray(items) && items.length ? items : fallbackStaff; return source.map((item) => { const fallback = fallbackStaff.find((person) => person.id === item.id) || {}; return { ...fallback, ...item, workStart: Number(item.workStart ?? item.startHour ?? fallback.workStart ?? DEFAULT_START_HOUR), workEnd: Number(item.workEnd ?? item.endHour ?? fallback.workEnd ?? DEFAULT_END_HOUR) }; }); }

export default function StaffScheduleConsole() {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState(() => mergeStaffDefaults(readJson(STAFF_KEY, fallbackStaff)));
  const [events, setEvents] = useState(() => readJson(EVENTS_KEY, []));
  const [selectedStaffId, setSelectedStaffId] = useState(staff.find((item) => item.active !== false)?.id || staff[0]?.id || '');
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthStart(today()));
  const [mode, setMode] = useState('day');

  const selectedStaff = staff.find((item) => item.id === selectedStaffId) || staff[0];
  const staffEvents = useMemo(() => events.filter((event) => event.staffId === selectedStaffId).sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b))), [events, selectedStaffId]);
  const dayEvents = staffEvents.filter((event) => event.date === date).sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const saveStaff = (next) => { setStaff(next); saveJson(STAFF_KEY, next); };
  const saveEvents = (next) => { setEvents(next); saveJson(EVENTS_KEY, next); };
  const refresh = () => { setStaff(mergeStaffDefaults(readJson(STAFF_KEY, fallbackStaff))); setEvents(readJson(EVENTS_KEY, [])); };

  useEffect(() => {
    const openFromMenu = () => { refresh(); setOpen(true); };
    window.addEventListener('lakiza:open-staff-schedule', openFromMenu);
    return () => window.removeEventListener('lakiza:open-staff-schedule', openFromMenu);
  }, []);

  const updateStaff = (id, patch) => {
    const item = staff.find((person) => person.id === id);
    if (!item) return;
    const normalized = { ...patch, workStart: Number(patch.workStart ?? DEFAULT_START_HOUR), workEnd: Number(patch.workEnd ?? DEFAULT_END_HOUR) };
    if (normalized.workEnd <= normalized.workStart) return alert('Конец рабочего дня должен быть позже начала.');
    if (!window.confirm(`Сохранить изменения сотрудника ${item.name}?`)) return;
    saveStaff(staff.map((person) => person.id === id ? { ...person, ...normalized } : person));
  };
  const updateEvent = (id, patch) => {
    const item = events.find((event) => event.id === id);
    if (!item || !window.confirm(`Сохранить запись ${item.date} ${item.time}, ${item.client}?`)) return;
    saveEvents(events.map((event) => event.id === id ? { ...event, ...patch } : event));
  };
  const removeEvent = (id) => {
    const item = events.find((event) => event.id === id);
    if (!item || !window.confirm(`Удалить запись ${item.date} ${item.time}, ${item.client}?`)) return;
    saveEvents(events.filter((event) => event.id !== id));
  };

  return <>
    <button type="button" onClick={() => { refresh(); setOpen(true); }} className="fixed bottom-40 right-3 z-[70] rounded-full bg-blue-500 px-4 py-3 text-xs font-black text-white shadow-2xl shadow-black/50">
      Люди · расписания
    </button>
    {open && <div className="fixed inset-0 z-[92] overflow-y-auto bg-black/70 p-2 text-white backdrop-blur-sm">
      <div className="mx-auto my-4 max-w-5xl rounded-[1.5rem] border border-white/10 bg-[#07140e] p-3 shadow-2xl shadow-black md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/60">раздел люди</div><h2 className="text-3xl font-black tracking-[-.06em] text-lime-50">Расписания сотрудников</h2><p className="mt-1 text-sm text-emerald-50/55">индивидуальное рабочее время, график 2/2, записи и переносы</p></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">Закрыть</button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[290px_1fr]">
          <aside className="grid gap-2 content-start">
            {staff.map((person) => {
              const count = events.filter((event) => event.staffId === person.id).length;
              const todayCount = events.filter((event) => event.staffId === person.id && event.date === today()).length;
              return <button key={person.id} type="button" onClick={() => { setSelectedStaffId(person.id); setMode('day'); }} className={cx('rounded-2xl p-3 text-left transition active:scale-[.99]', selectedStaffId === person.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}>
                <b className="block truncate text-base">{person.name}</b>
                <span className="block truncate text-xs opacity-70">{person.title} · {person.phone}</span>
                <span className="mt-2 inline-flex rounded-full bg-black/15 px-2 py-1 text-[10px] font-black">{staffHoursLabel(person)} · {count} записей · сегодня {todayCount}</span>
              </button>;
            })}
          </aside>

          <section className="min-w-0 rounded-2xl bg-white/8 p-3">
            {selectedStaff && <StaffProfile person={selectedStaff} updateStaff={updateStaff} />}
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-white/10 p-1">
              <Tab id="day" value={mode} setValue={setMode} label="День" />
              <Tab id="calendar" value={mode} setValue={setMode} label="Календарь" />
              <Tab id="all" value={mode} setValue={setMode} label="Все записи" />
            </div>
            {mode === 'calendar' && <StaffMonthCalendar staffEvents={staffEvents} selectedStaff={selectedStaff} date={date} setDate={setDate} month={month} setMonth={setMonth} />}
            {mode === 'day' && <DaySchedule selectedStaff={selectedStaff} date={date} setDate={setDate} dayEvents={dayEvents} allStaff={staff} updateEvent={updateEvent} removeEvent={removeEvent} />}
            {mode === 'all' && <AllStaffEvents events={staffEvents} staff={staff} updateEvent={updateEvent} removeEvent={removeEvent} />}
          </section>
        </div>
      </div>
    </div>}
  </>;
}

function StaffProfile({ person, updateStaff }) {
  const [draft, setDraft] = useState(person);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: ['shift', 'workStart', 'workEnd'].includes(key) ? Number(value) : value }));
  return <div className="rounded-2xl bg-black/20 p-3">
    <div className="mb-2 flex items-start justify-between gap-2"><div><h3 className="text-xl font-black text-lime-50">{person.name}</h3><p className="text-xs text-emerald-50/55">2/2 · {staffHoursLabel(person)} · сегодня {isWorking(person, today()) ? 'рабочий день' : 'выходной'}</p></div><button type="button" onClick={() => updateStaff(person.id, draft)} className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">Сохранить сотрудника</button></div>
    <div className="grid gap-2 sm:grid-cols-2"><Field label="ФИО" value={draft.name || ''} set={(v) => set('name', v)} /><Field label="Должность" value={draft.title || ''} set={(v) => set('title', v)} /><Field label="Телефон" value={draft.phone || ''} set={(v) => set('phone', v)} /><Field label="Адрес" value={draft.address || ''} set={(v) => set('address', v)} /><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Начало рабочего дня</span><select value={draft.workStart ?? DEFAULT_START_HOUR} onChange={(e) => set('workStart', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{Array.from({ length: 8 }, (_, i) => 7 + i).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Конец рабочего дня</span><select value={draft.workEnd ?? DEFAULT_END_HOUR} onChange={(e) => set('workEnd', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950">{Array.from({ length: 8 }, (_, i) => 15 + i).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Сдвиг графика 2/2</span><select value={draft.shift || 0} onChange={(e) => set('shift', e.target.value)} className="w-full rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950"><option value="0">пара 0</option><option value="1">пара 1</option><option value="2">пара 2</option><option value="3">пара 3</option></select></label></div>
  </div>;
}

function StaffMonthCalendar({ staffEvents, selectedStaff, date, setDate, month, setMonth }) {
  const visibleMonth = month.slice(0, 7);
  const counts = new Map();
  staffEvents.forEach((event) => counts.set(event.date, (counts.get(event.date) || 0) + 1));
  return <div className="mt-3 rounded-2xl bg-white/10 p-3">
    <div className="mb-2 flex items-center justify-between gap-2"><button onClick={() => setMonth(addMonths(month, -1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">‹</button><div className="text-center"><b className="capitalize text-lime-100">{monthTitle(month)}</b><div className="text-[10px] text-emerald-50/45">{selectedStaff?.name} · {selectedStaff ? staffHoursLabel(selectedStaff) : ''}</div></div><button onClick={() => setMonth(addMonths(month, 1))} className="rounded-xl bg-white/10 px-3 py-2 font-black">›</button></div>
    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-emerald-50/40"><span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span></div>
    <div className="mt-1 grid grid-cols-7 gap-1">{calendarDays(month).map((d) => { const count = counts.get(d) || 0; const working = selectedStaff ? isWorking(selectedStaff, d) : false; const outside = d.slice(0, 7) !== visibleMonth; return <button key={d} type="button" onClick={() => setDate(d)} className={cx('relative rounded-xl px-1 py-2 text-center', date === d ? 'bg-blue-600 text-white' : count ? 'bg-lime-200 text-emerald-950' : working ? 'bg-white/10 text-emerald-50/65' : 'bg-red-500/10 text-red-100/45', outside && 'opacity-35')}><b className="block text-xs">{d.slice(8)}</b><span className="text-[8px]">{weekday(d).slice(0,2)}</span>{count > 0 && <em className="absolute right-0 top-0 rounded-full bg-emerald-950 px-1 text-[8px] font-black not-italic text-lime-100">{count}</em>}</button>; })}</div>
  </div>;
}

function DaySchedule({ selectedStaff, date, setDate, dayEvents, allStaff, updateEvent, removeEvent }) {
  const byTime = new Map(dayEvents.map((event) => [event.time, event]));
  const working = selectedStaff ? isWorking(selectedStaff, date) : false;
  return <div className="mt-3 rounded-2xl bg-white/10 p-3">
    <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><Field label="Дата" type="date" value={date} set={setDate} /><button type="button" onClick={() => setDate(addDays(date, -1))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">← день</button><button type="button" onClick={() => setDate(addDays(date, 1))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">день →</button></div>
    <div className="mb-2 rounded-xl bg-black/20 p-2 text-xs font-bold text-emerald-50/65">{date} · {weekday(date)} · {working ? `рабочий день ${staffHoursLabel(selectedStaff)}` : 'выходной по графику 2/2'}</div>
    <div className="grid gap-1.5">{hoursFor(selectedStaff).map((hour) => {
      const item = byTime.get(hour);
      return <div key={hour} className="grid grid-cols-[48px_minmax(0,1fr)] gap-2"><span className="pt-3 text-[10px] text-emerald-50/45">{hour}</span>{item ? <StaffEventEditor event={item} allStaff={allStaff} updateEvent={updateEvent} removeEvent={removeEvent} /> : <div className={cx('rounded-xl border border-dashed px-3 py-3 text-xs', working ? 'border-white/10 bg-white/5 text-emerald-50/40' : 'border-red-300/10 bg-red-500/10 text-red-100/45')}>{working ? 'свободно' : 'выходной'}</div>}</div>;
    })}</div>
  </div>;
}

function AllStaffEvents({ events, staff, updateEvent, removeEvent }) {
  const [filter, setFilter] = useState('future');
  const list = events.filter((event) => filter === 'all' || (filter === 'future' ? eventDateTime(event) >= `${today()}T00:00` : eventDateTime(event) < `${today()}T00:00`));
  return <div className="mt-3 rounded-2xl bg-white/10 p-3"><div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-white/10 p-1"><Tab id="future" value={filter} setValue={setFilter} label="Будущие" /><Tab id="past" value={filter} setValue={setFilter} label="История" /><Tab id="all" value={filter} setValue={setFilter} label="Все" /></div><div className="grid gap-2">{list.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-emerald-50/55">Записей нет.</div>}{list.map((event) => <StaffEventEditor key={event.id} event={event} allStaff={staff} updateEvent={updateEvent} removeEvent={removeEvent} />)}</div></div>;
}

function StaffEventEditor({ event, allStaff, updateEvent, removeEvent }) {
  const [draft, setDraft] = useState(event);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const markChange = () => updateEvent(event.id, { ...draft, status: 'change', note: `${draft.note || ''} Требуется согласование изменения расписания.`.trim() });
  return <div className="min-w-0 rounded-xl bg-lime-200 p-3 text-emerald-950 shadow-xl shadow-black/20">
    <div className="mb-2 flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-sm">{event.client || 'Клиент'} · {event.service || 'сеанс'}</b><div className="truncate text-xs opacity-70">{event.date} · {weekday(event.date)} · {event.time} · {statusLabel(event.status)}</div>{event.requestedDate && <div className="mt-1 rounded-lg bg-blue-500/15 px-2 py-1 text-[11px] font-black text-blue-900">клиент просит: {event.requestedDate} · {event.requestedTime}</div>}{event.requestedCancel && <div className="mt-1 rounded-lg bg-red-500/15 px-2 py-1 text-[11px] font-black text-red-900">клиент просит отмену</div>}</div></div>
    <div className="grid gap-2 sm:grid-cols-3"><Field label="Дата" type="date" value={draft.date || ''} set={(v) => set('date', v)} dark /><Field label="Время" value={draft.time || ''} set={(v) => set('time', v)} dark /><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-950/60">Сотрудник</span><select value={draft.staffId || ''} onChange={(e) => set('staffId', e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950">{allStaff.map((person) => <option key={person.id} value={person.id}>{person.name} · {staffHoursLabel(person)}</option>)}</select></label><Field label="Услуга" value={draft.service || ''} set={(v) => set('service', v)} dark /><Field label="Минут" value={String(draft.duration || '')} set={(v) => set('duration', v)} dark /><label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-950/60">Статус</span><select value={draft.status || 'new'} onChange={(e) => set('status', e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950"><option value="new">заявка</option><option value="confirmed">подтверждена</option><option value="done">завершена</option><option value="change">согласовать</option><option value="cancelled">отменена</option></select></label></div>
    <label className="mt-2 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-950/60">Заметка</span><textarea value={draft.note || ''} onChange={(e) => set('note', e.target.value)} rows={2} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label>
    <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => updateEvent(event.id, draft)} className="rounded-full bg-emerald-950 px-4 py-2 text-xs font-black text-lime-100">Сохранить запись</button><button type="button" onClick={markChange} className="rounded-full bg-blue-700 px-4 py-2 text-xs font-black text-white">Перенести / согласовать</button><button type="button" onClick={() => removeEvent(event.id)} className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white">Удалить</button></div>
  </div>;
}

function Tab({ id, value, setValue, label }) { return <button type="button" onClick={() => setValue(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', value === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50/70')}>{label}</button>; }
function Field({ label, value, set, type = 'text', dark = false }) { return <label><span className={cx('mb-1 block text-[10px] font-black uppercase tracking-[.14em]', dark ? 'text-emerald-950/60' : 'text-lime-200/60')}>{label}</span><input type={type} value={value || ''} onChange={(e) => set(e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label>; }

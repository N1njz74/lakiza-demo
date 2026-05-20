import { useMemo, useState } from 'react';

const EVENTS_KEY = 'lakizaAdminSchedulerEvents';
const CLIENTS_KEY = 'lakizaClientProfiles';

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function today() { return new Date().toISOString().slice(0, 10); }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function clientId(event) { return event.clientId || `client-${digits(event.phone)}`; }
function eventDateTime(event) { return `${event.date || '0000-00-00'}T${event.time || '00:00'}`; }
function norm(value) { return String(value || '').toLowerCase().replace(/ё/g, 'е'); }
function bmi(weight, height) {
  const w = Number(weight);
  const h = Number(height) / 100;
  return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '—';
}
function stats(events) {
  const sorted = [...events].sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)));
  const measured = sorted.filter((event) => Number(event.weight) > 0);
  const hours = sorted.reduce((sum, event) => sum + Number(event.duration || 0), 0) / 60;
  const weightDelta = measured.length > 1 ? Number(measured.at(-1).weight) - Number(measured[0].weight) : null;
  return {
    total: sorted.length,
    done: sorted.filter((event) => event.status === 'done').length,
    future: sorted.filter((event) => eventDateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled').length,
    hours: hours.toFixed(1),
    delta: weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} кг`,
    measured,
  };
}

export default function AdminStatsConsole() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [version, setVersion] = useState(0);
  const events = useMemo(() => readJson(EVENTS_KEY, []), [version]);
  const clients = useMemo(() => readJson(CLIENTS_KEY, []), [version]);
  const rows = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const id = clientId(event);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(event);
    });
    return Array.from(map.entries()).map(([id, clientEvents]) => {
      const saved = clients.find((client) => client.id === id) || {};
      const fallback = clientEvents[0] || {};
      const client = { id, name: saved.name || fallback.client || 'Клиент', phone: saved.phone || fallback.phone || '', email: saved.email || '', privateNotes: saved.privateNotes || fallback.note || '', assignedStaffId: saved.assignedStaffId || fallback.staffId || '' };
      return { id, client, events: clientEvents, stat: stats(clientEvents) };
    }).sort((a, b) => a.client.name.localeCompare(b.client.name, 'ru'));
  }, [events, clients]);
  const filtered = rows.filter((row) => {
    const haystack = norm(`${row.client.name} ${row.client.phone} ${row.client.email} ${row.client.privateNotes} ${row.events.map((event) => `${event.service} ${event.note} ${event.weight} ${event.height}`).join(' ')}`);
    return !query || query.split(/\s+/).every((part) => haystack.includes(norm(part)) || haystack.includes(digits(part)));
  });
  const selected = rows.find((row) => row.id === selectedId) || null;

  const refresh = () => setVersion((value) => value + 1);
  const saveNote = (client, note) => {
    const exists = clients.some((item) => item.id === client.id);
    const next = exists ? clients.map((item) => item.id === client.id ? { ...item, privateNotes: note } : item) : [...clients, { ...client, privateNotes: note }];
    saveJson(CLIENTS_KEY, next);
    refresh();
  };
  const updateEvent = (id, patch) => {
    const item = events.find((event) => event.id === id);
    if (!item || !window.confirm(`Сохранить изменения сеанса ${item.date} ${item.time}?`)) return;
    saveJson(EVENTS_KEY, events.map((event) => event.id === id ? { ...event, ...patch } : event));
    refresh();
  };
  const removeEvent = (id) => {
    const item = events.find((event) => event.id === id);
    if (!item || !window.confirm(`Удалить сеанс ${item.date} ${item.time}?`)) return;
    saveJson(EVENTS_KEY, events.filter((event) => event.id !== id));
    refresh();
  };
  const removeClient = (client) => {
    if (!window.confirm(`Удалить клиента ${client.name} и все его сеансы?`)) return;
    saveJson(EVENTS_KEY, events.filter((event) => clientId(event) !== client.id));
    saveJson(CLIENTS_KEY, clients.filter((item) => item.id !== client.id));
    setSelectedId('');
    refresh();
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-24 right-3 z-[70] rounded-full bg-lime-200 px-4 py-3 text-xs font-black text-emerald-950 shadow-2xl shadow-black/50">
        Статистика
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 p-2 text-white backdrop-blur-sm">
          <div className="mx-auto my-4 max-w-4xl rounded-[1.5rem] border border-white/10 bg-[#07140e] p-3 shadow-2xl shadow-black md:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/60">администратор</div>
                <h2 className="text-3xl font-black tracking-[-.06em] text-lime-50">Глубокая статистика</h2>
                <p className="mt-1 text-sm text-emerald-50/55">клиенты, сеансы, часы, вес, рост, закрытые заметки</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">Закрыть</button>
            </div>
            {!selected ? (
              <ClientList query={query} setQuery={setQuery} rows={filtered} select={setSelectedId} />
            ) : (
              <ClientDetail row={selected} saveNote={saveNote} updateEvent={updateEvent} removeEvent={removeEvent} removeClient={removeClient} back={() => setSelectedId('')} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ClientList({ query, setQuery, rows, select }) {
  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск: имя, телефон, услуга, вес, заметка" className="mb-3 w-full rounded-2xl bg-white px-4 py-4 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" />
      <div className="grid gap-2 md:grid-cols-2">
        {rows.length === 0 && <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-emerald-50/60">Ничего не найдено.</div>}
        {rows.map((row) => (
          <button key={row.id} type="button" onClick={() => select(row.id)} className="rounded-2xl bg-white/10 p-3 text-left transition active:scale-[.99]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <b className="block truncate text-lg text-lime-100">{row.client.name}</b>
                <span className="block truncate text-xs text-emerald-50/55">{row.client.phone || 'телефон не указан'}</span>
              </div>
              <span className="rounded-full bg-lime-200 px-2 py-1 text-[10px] font-black text-emerald-950">{row.stat.total} сеанс.</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              <Mini label="часов" value={row.stat.hours} />
              <Mini label="будущих" value={row.stat.future} />
              <Mini label="вес" value={row.stat.delta} />
            </div>
            {row.client.privateNotes && <div className="mt-2 line-clamp-2 rounded-xl bg-black/20 px-2 py-1 text-[11px] text-emerald-50/50">{row.client.privateNotes}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientDetail({ row, saveNote, updateEvent, removeEvent, removeClient, back }) {
  const [note, setNote] = useState(row.client.privateNotes || '');
  const sorted = [...row.events].sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)));
  return (
    <div>
      <button type="button" onClick={back} className="mb-3 rounded-full bg-white/10 px-4 py-2 text-xs font-black">← список</button>
      <div className="mb-3 rounded-2xl bg-lime-200/10 p-3">
        <h3 className="text-2xl font-black text-lime-50">{row.client.name}</h3>
        <p className="text-sm text-emerald-50/55">{row.client.phone || 'телефон не указан'} · {row.client.email || 'email не указан'}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        <Stat label="сеансов" value={row.stat.total} />
        <Stat label="часов" value={row.stat.hours} />
        <Stat label="завершено" value={row.stat.done} />
        <Stat label="будущие" value={row.stat.future} />
        <Stat label="вес" value={row.stat.delta} />
      </div>
      <WeightChart events={row.stat.measured} />
      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">закрытые пометки</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950" />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => saveNote(row.client, note)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить заметку</button>
        <button type="button" onClick={() => removeClient(row.client)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить клиента и записи</button>
      </div>
      <h4 className="mt-5 text-xl font-black text-lime-50">Сеансы</h4>
      <div className="mt-2 grid gap-2">
        {sorted.map((event) => <EventEditor key={event.id} event={event} updateEvent={updateEvent} removeEvent={removeEvent} />)}
      </div>
    </div>
  );
}

function EventEditor({ event, updateEvent, removeEvent }) {
  const [draft, setDraft] = useState(event);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="mb-2 text-xs font-black uppercase tracking-[.12em] text-lime-200/70">{event.date} · {event.time}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Дата" type="date" value={draft.date || ''} onChange={(v) => set('date', v)} />
        <Field label="Время" value={draft.time || ''} onChange={(v) => set('time', v)} />
        <Field label="Услуга" value={draft.service || ''} onChange={(v) => set('service', v)} />
        <Field label="Минут" value={String(draft.duration || '')} onChange={(v) => set('duration', v)} />
        <Field label="Вес, кг" value={String(draft.weight || '')} onChange={(v) => set('weight', v)} />
        <Field label="Рост, см" value={String(draft.height || '')} onChange={(v) => set('height', v)} />
      </div>
      <label className="mt-2 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">заметка</span>
        <textarea value={draft.note || ''} onChange={(event) => set('note', event.target.value)} rows={2} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => updateEvent(event.id, draft)} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Сохранить сеанс</button>
        <button type="button" onClick={() => removeEvent(event.id)} className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-100">Удалить сеанс</button>
      </div>
    </div>
  );
}

function WeightChart({ events }) {
  if (events.length < 2) return <div className="mt-3 rounded-2xl border border-dashed border-white/20 p-5 text-center text-emerald-50/55">Для графика нужно минимум два замера веса.</div>;
  const weights = events.map((event) => Number(event.weight));
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  return (
    <div className="mt-3 rounded-2xl bg-white/10 p-3">
      <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[.12em] text-lime-200/60"><span>график веса</span><span>{weights[0]} → {weights.at(-1)} кг</span></div>
      <div className="relative h-36 overflow-hidden rounded-xl bg-black/25">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        {events.map((event, index) => {
          const x = events.length === 1 ? 50 : (index / (events.length - 1)) * 100;
          const y = 100 - ((Number(event.weight) - min) / (max - min)) * 100;
          return <div key={event.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}><span className="mx-auto block h-3 w-3 rounded-full bg-lime-200 shadow-lg shadow-lime-800/50" /><b className="mt-1 block rounded bg-emerald-950/80 px-1 text-[9px] text-lime-100">{event.weight}</b></div>;
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label>;
}
function Stat({ label, value }) { return <div className="rounded-xl bg-white/10 p-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-lime-200/55">{label}</div><b className="mt-1 block text-xl text-lime-100">{value}</b></div>; }
function Mini({ label, value }) { return <div className="rounded-xl bg-black/20 px-2 py-1"><div className="text-[8px] font-black uppercase tracking-[.1em] text-lime-200/50">{label}</div><b className="text-xs text-lime-100">{value}</b></div>; }

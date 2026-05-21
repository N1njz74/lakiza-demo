import { useEffect, useMemo, useState } from 'react';

const THREADS = 'lakizaMessengerThreads';
const EVENTS = 'lakizaAdminSchedulerEvents';
const CLIENTS = 'lakizaClientProfiles';
const DEMO_CLIENTS = 'lakizaDemoClients';
const STAFF = 'lakizaAdminSchedulerStaff';

const fallbackStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', active: true },
];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value) })); } catch {} }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function phoneKey(value) { const d = digits(value); return d.startsWith('7') || d.startsWith('8') ? d.slice(1) : d; }
function norm(value) { return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); }
function cleanId(value) { return String(value || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || `client-${Date.now()}`; }
function nowIso() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }
function dateTime(event) { return `${event.date || '0000-00-00'}T${event.time || '00:00'}`; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function fullName(client) { return [client?.name, client?.surname].filter(Boolean).join(' ') || client?.client || client?.clientName || client?.login || 'Клиент'; }
function staffName(staff, id) { return staff.find((item) => item.id === id)?.name || 'не назначен'; }
function formatDate(value) { return value ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'; }
function statusLabel(status) { return { new: 'заявка', confirmed: 'подтверждена', done: 'завершена', cancelled: 'отменена', change: 'согласовать' }[status] || status || 'заявка'; }

function findMessengerButton() { return document.querySelector('button[aria-label="Сообщения"]'); }
function findMessengerPanel() { const button = findMessengerButton(); const panel = button?.nextElementSibling; return panel instanceof HTMLElement ? panel : null; }
function openMessenger() { const button = findMessengerButton(); if (button) button.click(); }
function findClientFromStores(seed) {
  const clients = read(CLIENTS, []);
  const demoClients = read(DEMO_CLIENTS, []);
  const events = read(EVENTS, []);
  const raw = seed || {};
  const queryName = norm(raw.name || raw.client || raw.clientName || '');
  const queryPhone = phoneKey(raw.phone || raw.login || '');
  const queryId = String(raw.clientId || raw.id || '').replace(/^client:/, '');

  const candidates = [
    ...clients.map((client) => ({ ...client, source: 'profile' })),
    ...demoClients.map((client) => ({ ...client, source: 'demo' })),
    ...events.map((event) => ({ id: event.clientId || phoneKey(event.phone) || cleanId(event.client || event.clientName), name: event.client || event.clientName, phone: event.phone, assignedStaffId: event.staffId, privateNotes: event.note, source: 'event' })),
  ];

  const found = candidates.find((item) => {
    const id = String(item.id || '').replace(/^client-/, '').replace(/^client:/, '');
    const itemPhone = phoneKey(item.phone || item.login || '');
    const itemName = norm(fullName(item));
    return (queryId && (id === queryId || item.id === queryId || item.id === `client-${queryId}`)) || (queryPhone && itemPhone === queryPhone) || (queryName && itemName === queryName);
  });

  if (found) return normalizeClient(found);
  if (queryName || queryPhone) return normalizeClient({ id: queryId || queryPhone || cleanId(queryName), name: raw.name || raw.client || raw.clientName || 'Клиент', phone: raw.phone || '', assignedStaffId: raw.staffId || '' });
  return null;
}

function normalizeClient(client) {
  const id = String(client.id || phoneKey(client.phone || client.login) || cleanId(fullName(client))).replace(/^client:/, '');
  const clean = id.startsWith('client-') ? id : `client-${id}`;
  return {
    id: clean,
    contactId: clean.replace(/^client-/, ''),
    name: fullName(client),
    phone: client.phone || client.login || '',
    email: client.email || '',
    assignedStaffId: client.assignedStaffId || client.staffId || '',
    privateNotes: client.privateNotes || client.clientPrivateNotes || client.adminNote || client.note || '',
    clientPublicNote: client.clientPublicNote || client.wishes || client.preferences || '',
  };
}

function clientEvents(client) {
  const p = phoneKey(client.phone);
  const n = norm(client.name);
  const ids = new Set([client.id, client.contactId, `client-${client.contactId}`].filter(Boolean));
  return read(EVENTS, []).filter((event) => ids.has(event.clientId) || (p && phoneKey(event.phone) === p) || (n && norm(event.client || event.clientName) === n)).sort((a, b) => dateTime(a).localeCompare(dateTime(b)));
}

function upsertClient(client, patch) {
  const list = read(CLIENTS, []);
  const exists = list.some((item) => item.id === client.id || phoneKey(item.phone) === phoneKey(client.phone));
  const nextClient = { ...client, ...patch, id: client.id, name: patch.name || client.name, phone: patch.phone || client.phone, updatedAt: nowIso() };
  save(CLIENTS, exists ? list.map((item) => (item.id === client.id || phoneKey(item.phone) === phoneKey(client.phone)) ? { ...item, ...nextClient } : item) : [...list, nextClient]);
  return nextClient;
}

function ensureThread(client, actorName = 'Администратор') {
  const threads = read(THREADS, []);
  const clientId = client.contactId || client.id.replace(/^client-/, '');
  const existing = threads.find((thread) => thread.clientId === clientId || phoneKey(thread.phone) === phoneKey(client.phone));
  if (existing) return existing;
  const thread = {
    id: `thread-client-${clientId}-${Date.now()}`,
    type: 'direct',
    title: client.name,
    subject: 'Беседа',
    clientId,
    clientName: client.name,
    staffId: client.assignedStaffId || '',
    staffName: '',
    status: 'open',
    updatedAt: nowIso(),
    messages: [{ id: `msg-${Date.now()}`, role: 'system', name: 'Система', text: `Создан диалог с клиентом ${client.name}.`, at: nowIso() }],
  };
  save(THREADS, [thread, ...threads]);
  return thread;
}

function openDialogForClient(client) {
  ensureThread(client);
  openMessenger();
  setTimeout(() => {
    const panel = findMessengerPanel();
    const buttons = [...(panel?.querySelectorAll('button') || [])];
    const dialogButton = buttons.find((button) => norm(button.textContent).includes(norm(client.name)) || (client.phone && digits(button.textContent).includes(digits(client.phone))));
    if (dialogButton) dialogButton.click();
  }, 220);
}

function extractClientFromMessengerHeader(target) {
  const panel = findMessengerPanel();
  if (!panel || !target || !panel.contains(target)) return null;
  const header = target.closest('section')?.querySelector('h3');
  const clickedTitle = target.closest('h3');
  if (!clickedTitle || clickedTitle !== header) return null;
  const info = clickedTitle.parentElement?.querySelector('p')?.textContent || '';
  if (!norm(info).includes('клиент')) return null;
  return findClientFromStores({ name: clickedTitle.textContent || '' });
}

function injectMessageButtons() {
  const overlays = [...document.querySelectorAll('.fixed.inset-0.z-\[90\]')];
  overlays.forEach((overlay) => {
    const title = overlay.querySelector('h3');
    const phone = title?.parentElement?.querySelector('p')?.textContent || '';
    if (!title || title.dataset.messengerBridge === '1') return;
    const client = findClientFromStores({ name: title.textContent || '', phone });
    if (!client) return;
    title.dataset.messengerBridge = '1';
    const box = title.parentElement;
    if (!box) return;
    box.classList.add('relative');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '✉ Сообщение';
    button.className = 'mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-xl shadow-blue-950/30';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDialogForClient(client);
    });
    box.appendChild(button);
  });
}

export default function ClientMessengerBridge({ user }) {
  const [card, setCard] = useState(null);
  const [returnMode, setReturnMode] = useState('chat');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onClick = (event) => {
      const client = extractClientFromMessengerHeader(event.target);
      if (client) {
        event.preventDefault();
        event.stopPropagation();
        setReturnMode('chat');
        setCard(client);
      }
    };

    document.addEventListener('click', onClick, true);
    const observer = new MutationObserver(injectMessageButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    injectMessageButtons();

    const refresh = () => { setVersion((value) => value + 1); setTimeout(injectMessageButtons, 80); };
    window.addEventListener('storage', refresh);
    return () => {
      document.removeEventListener('click', onClick, true);
      observer.disconnect();
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const events = useMemo(() => card ? clientEvents(card) : [], [card, version]);

  if (!card) return null;

  const close = () => setCard(null);
  const updatedCard = findClientFromStores(card) || card;

  return <ClientCardOverlay user={user} client={updatedCard} events={events} close={close} returnMode={returnMode} bump={() => setVersion((value) => value + 1)} />;
}

function ClientCardOverlay({ user, client, events, close, bump }) {
  const staff = read(STAFF, fallbackStaff).filter((item) => item.active !== false);
  const nearest = events.find((event) => dateTime(event) >= `${today()}T00:00` && event.status !== 'cancelled');
  const [note, setNote] = useState(client.privateNotes || '');
  const [publicNote, setPublicNote] = useState(client.clientPublicNote || '');
  const [appointment, setAppointment] = useState({ date: today(), time: '10:00', service: 'Массаж', duration: '60', staffId: client.assignedStaffId || staff[0]?.id || 'kristina', note: '' });
  const [move, setMove] = useState({ eventId: nearest?.id || '', date: nearest?.date || today(), time: nearest?.time || '10:00' });

  const saveNotes = () => {
    upsertClient(client, { privateNotes: note, clientPublicNote: publicNote, assignedStaffId: appointment.staffId });
    bump();
  };

  const createAppointment = () => {
    if (!appointment.date || !appointment.time) return;
    const list = read(EVENTS, []);
    const event = {
      id: `event-${Date.now()}`,
      clientId: client.id,
      client: client.name,
      phone: client.phone,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service || 'Массаж',
      duration: Number(appointment.duration || 60),
      staffId: appointment.staffId,
      status: 'confirmed',
      note: appointment.note,
      createdAt: nowIso(),
    };
    save(EVENTS, [...list, event]);
    upsertClient(client, { assignedStaffId: appointment.staffId });
    bump();
    alert('Сеанс добавлен.');
  };

  const moveAppointment = () => {
    if (!move.eventId || !move.date || !move.time) return;
    const list = read(EVENTS, []);
    save(EVENTS, list.map((event) => event.id === move.eventId ? { ...event, date: move.date, time: move.time, status: 'change', note: `${event.note || ''} Перенос согласуется через сообщения.`.trim(), updatedAt: nowIso() } : event));
    bump();
    alert('Перенос сохранён как согласование.');
  };

  const openDialog = () => {
    close();
    openDialogForClient(client);
  };

  return (
    <div className="fixed inset-0 z-[135] overflow-y-auto bg-black/72 p-2 text-white backdrop-blur-md">
      <div className="mx-auto my-4 max-w-3xl rounded-[1.6rem] border border-white/10 bg-[#06140d] p-3 shadow-2xl shadow-black md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-sky-200/65">карточка клиента из сообщений</div>
            <button type="button" onClick={openDialog} className="mt-1 block max-w-full truncate text-left text-3xl font-black tracking-[-.05em] text-lime-50 underline decoration-sky-300/30 underline-offset-4">
              {client.name}
            </button>
            <div className="mt-1 text-sm font-bold text-emerald-50/55">{client.phone || 'телефон не указан'} · закреплён: {staffName(staff, client.assignedStaffId)}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={openDialog} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Сообщения</button>
            <button type="button" onClick={close} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">Назад</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="Всего сеансов" value={events.length} />
          <Info label="Ближайший" value={nearest ? `${nearest.date} ${nearest.time}` : '—'} />
          <Info label="Статус" value={nearest ? statusLabel(nearest.status) : 'нет записи'} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h3 className="text-lg font-black text-sky-100">Записать на сеанс</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="Дата" type="date" value={appointment.date} onChange={(v) => setAppointment((p) => ({ ...p, date: v }))} />
              <Field label="Время" type="time" value={appointment.time} onChange={(v) => setAppointment((p) => ({ ...p, time: v }))} />
              <Field label="Услуга" value={appointment.service} onChange={(v) => setAppointment((p) => ({ ...p, service: v }))} />
              <Field label="Минут" value={appointment.duration} onChange={(v) => setAppointment((p) => ({ ...p, duration: v }))} />
            </div>
            <label className="mt-2 block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">Массажист</span>
              <select value={appointment.staffId} onChange={(e) => setAppointment((p) => ({ ...p, staffId: e.target.value }))} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950">
                {staff.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <textarea value={appointment.note} onChange={(e) => setAppointment((p) => ({ ...p, note: e.target.value }))} rows={2} placeholder="Комментарий к сеансу" className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" />
            <button type="button" onClick={createAppointment} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-3 text-sm font-black text-emerald-950">Добавить запись</button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h3 className="text-lg font-black text-sky-100">Перенести сеанс</h3>
            <select value={move.eventId} onChange={(e) => setMove((p) => ({ ...p, eventId: e.target.value }))} className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950">
              <option value="">Выбрать сеанс</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.date} · {event.time} · {event.service || 'сеанс'} · {statusLabel(event.status)}</option>)}
            </select>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Новая дата" type="date" value={move.date} onChange={(v) => setMove((p) => ({ ...p, date: v }))} />
              <Field label="Новое время" type="time" value={move.time} onChange={(v) => setMove((p) => ({ ...p, time: v }))} />
            </div>
            <button type="button" onClick={moveAppointment} className="mt-2 w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-black text-white">Сохранить перенос</button>

            <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs leading-5 text-emerald-50/55">
              Перенос помечается статусом «согласовать», чтобы администратор или массажист видел изменение в расписании.
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <h3 className="text-lg font-black text-sky-100">Заметки и корректировки</h3>
          <label className="mt-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">Закрытые заметки администратора/массажиста</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full resize-none rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" />
          </label>
          <label className="mt-2 block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">Публичные пожелания клиента</span>
            <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} rows={2} className="w-full resize-none rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" />
          </label>
          <button type="button" onClick={saveNotes} className="mt-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">Сохранить корректировки</button>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-950" /></label>;
}
function Info({ label, value }) {
  return <div className="rounded-2xl bg-white/8 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-sky-200/50">{label}</div><b className="mt-1 block truncate text-xl text-lime-50">{value}</b></div>;
}

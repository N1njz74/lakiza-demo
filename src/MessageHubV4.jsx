import { useEffect, useMemo, useState } from 'react';

const THREADS = 'lakizaMessengerThreads';
const EVENTS = 'lakizaAdminSchedulerEvents';
const STAFF = 'lakizaAdminSchedulerStaff';
const CLIENTS = 'lakizaClientProfiles';
const DEMO_CLIENTS = 'lakizaDemoClients';

const STAFF_FALLBACK = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', active: true },
];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function now() { return new Date().toISOString(); }
function cx(...items) { return items.filter(Boolean).join(' '); }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function phoneKey(value) { const d = digits(value); return d.startsWith('7') || d.startsWith('8') ? d.slice(1) : d; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || `id-${Date.now()}`; }
function norm(value) { return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9+@.\s-]/gi, ' ').replace(/\s+/g, ' ').trim(); }
function blob(...items) { return norm(items.flat(Infinity).filter(Boolean).join(' ')); }
function queryWords(query) { return norm(query).split(' ').filter(Boolean); }
function matches(searchText, query) { const words = queryWords(query); if (!words.length) return true; const text = blob(searchText); const nums = digits(query); return words.every((word) => text.includes(word)) || Boolean(nums && digits(text).includes(nums)); }
function displayName(user) { return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь'; }
function clientId(user) { return phoneKey(user?.phone || user?.login) || slug(user?.login || 'client'); }
function formatTime(value) { return value ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : ''; }
function cut(value, limit = 90) { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > limit ? `${text.slice(0, limit)}…` : text; }
function msgRole(message) { return message.role || message.authorRole || 'client'; }
function msgName(message) { return message.name || message.authorName || 'Пользователь'; }
function msgText(message) { return message.text || ''; }
function makeMsg(role, name, text) { return { id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, name, text, at: now() }; }
function roleLabel(kind) { return kind === 'employee' ? 'сотрудник' : kind === 'client' ? 'клиент' : kind === 'admin' ? 'админ' : 'чат'; }
function statusLabel(status) { return { open: 'открыт', pending: 'в работе', resolved: 'закрыт' }[status] || status || 'открыт'; }
function color(kind, active = false) { if (active) return 'border-lime-200 bg-lime-200 text-emerald-950'; if (kind === 'employee') return 'border-sky-300/25 bg-sky-400/15 text-sky-50'; if (kind === 'client') return 'border-lime-200/20 bg-lime-200/10 text-lime-50'; return 'border-white/10 bg-white/10 text-emerald-50'; }
function staffName(staff, id) { return staff.find((item) => item.id === id)?.name || 'Массажист'; }
function therapistId(user, staff) { const name = norm(displayName(user)); return user?.staffId || user?.therapistId || staff.find((item) => name && norm(item.name).includes(name))?.id || staff[0]?.id || 'kristina'; }
function assignedStaff(user, staff, clients, demoClients, events) { const p = phoneKey(user?.phone || user?.login); const profile = clients.find((item) => phoneKey(item.phone) === p); const demo = demoClients.find((item) => phoneKey(item.phone || item.login) === p); const event = events.find((item) => phoneKey(item.phone) === p && item.staffId); return profile?.assignedStaffId || demo?.assignedStaffId || event?.staffId || staff[0]?.id || 'kristina'; }
function eventIndex(event) { return blob(event.client, event.clientName, event.phone, event.service, event.note, event.notes, event.privateNotes, event.adminNote, event.therapistNote, event.clientPublicNote, event.date, event.time, event.status, event.weight, event.height, event.requestedDate, event.requestedTime, event.requestedCancel ? 'отмена отменить' : '', event.requestedDate ? 'перенос перенести' : ''); }
function relatedEvents(events, id, phone, name) { const p = phoneKey(phone); const n = norm(name); return events.filter((event) => (id && event.clientId === id) || (p && phoneKey(event.phone) === p) || (n && norm(event.client || event.clientName) === n)); }
function clientIndex(client, events, id) { const name = [client.name, client.surname].filter(Boolean).join(' ') || client.name || client.login; return blob(client.name, client.surname, client.login, client.phone, client.email, client.privateNotes, client.clientPrivateNotes, client.adminNote, client.adminNotes, client.therapistNote, client.therapistNotes, client.clientPublicNote, client.note, client.notes, client.healthNote, client.medicalNote, client.wishes, client.preferences, client.assignedStaffId, relatedEvents(events, id, client.phone || client.login, name).map(eventIndex)); }
function addContact(map, contact) { if (!contact?.id) return; const old = map.get(contact.id); map.set(contact.id, old ? { ...old, ...contact, searchText: blob(old.searchText, contact.searchText, old.name, contact.name, old.subtitle, contact.subtitle) } : contact); }

function buildContacts(user, staff, clients, demoClients, events, threads) {
  const map = new Map();
  const myStaffId = therapistId(user, staff);
  const assigned = assignedStaff(user, staff, clients, demoClients, events);

  if (user.role !== 'client') addContact(map, { id: 'staff:general', kind: 'employee', name: 'Общий чат сотрудников', subtitle: 'администратор и массажисты', staffId: 'general', searchText: blob('общий чат сотрудники администратор массажисты команда служебный') });

  if (user.role === 'client') {
    addContact(map, { id: 'admin', kind: 'admin', name: 'Администратор', subtitle: 'запись, перенос, отмена, оплата', searchText: blob('администратор запись перенос отмена оплата вопрос') });
    addContact(map, { id: `staff:${assigned}`, kind: 'employee', name: staffName(staff, assigned), subtitle: 'закреплённый массажист', staffId: assigned, searchText: blob(staffName(staff, assigned), 'закрепленный массажист самочувствие пожелания подготовка') });
    return [...map.values()];
  }

  if (user.role === 'admin') staff.forEach((person) => addContact(map, { id: `staff:${person.id}`, kind: 'employee', name: person.name, subtitle: person.title || 'сотрудник', staffId: person.id, phone: person.phone || '', searchText: blob(person.name, person.title, person.phone, person.address, person.note, person.notes, person.privateNotes, 'сотрудник массажист расписание') }));

  const addClient = (raw, forcedId) => {
    const id = forcedId || raw.id || phoneKey(raw.phone || raw.login) || slug(raw.name || raw.login || raw.client || raw.clientName);
    const name = [raw.name, raw.surname].filter(Boolean).join(' ') || raw.name || raw.login || raw.client || raw.clientName || 'Клиент';
    addContact(map, { id: `client:${id}`, kind: 'client', name, subtitle: raw.phone || raw.email || 'клиент', clientId: id, phone: raw.phone || '', staffId: raw.assignedStaffId || raw.staffId || '', searchText: clientIndex(raw, events, id) });
  };

  if (user.role === 'admin') {
    clients.forEach((client) => addClient(client, client.id || phoneKey(client.phone)));
    demoClients.forEach((client) => addClient(client, phoneKey(client.phone || client.login)));
    events.forEach((event) => addClient({ name: event.client || event.clientName, phone: event.phone, staffId: event.staffId, note: event.note, service: event.service }, event.clientId || phoneKey(event.phone) || slug(event.client || event.clientName)));
  } else {
    events.filter((event) => event.staffId === myStaffId).forEach((event) => addClient({ name: event.client || event.clientName, phone: event.phone, staffId: event.staffId, note: event.note, service: event.service }, event.clientId || phoneKey(event.phone) || slug(event.client || event.clientName)));
  }

  threads.forEach((thread) => {
    const threadText = blob(thread.title, thread.subject, thread.clientName, thread.staffName, thread.note, thread.notes, (thread.messages || []).map((message) => [msgName(message), msgText(message)]));
    if (thread.clientId) addContact(map, { id: `client:${thread.clientId}`, kind: 'client', name: thread.clientName || thread.title || 'Клиент', subtitle: thread.staffName ? `закреплён: ${thread.staffName}` : 'из переписки', clientId: thread.clientId, staffId: thread.staffId || '', searchText: threadText });
    if (user.role === 'admin' && thread.staffId && !thread.clientId && thread.staffId !== 'general') addContact(map, { id: `staff:${thread.staffId}`, kind: 'employee', name: thread.staffName || staffName(staff, thread.staffId), subtitle: 'сотрудник', staffId: thread.staffId, searchText: threadText });
  });

  return [...map.values()].sort((a, b) => `${a.kind}-${a.name}`.localeCompare(`${b.kind}-${b.name}`, 'ru'));
}

function threadContactId(thread, user) { if (thread.id === 'staff-general' || thread.type === 'staff-general') return 'staff:general'; if (user.role === 'client') return thread.type === 'therapist' && thread.staffId ? `staff:${thread.staffId}` : 'admin'; if (user.role === 'therapist') return thread.clientId ? `client:${thread.clientId}` : 'staff:general'; if (thread.clientId) return `client:${thread.clientId}`; if (thread.staffId) return `staff:${thread.staffId}`; return thread.contactId || `thread:${thread.id}`; }
function threadsForRole(threads, user, staff) { if (user.role === 'admin') return threads; if (user.role === 'therapist') { const id = therapistId(user, staff); return threads.filter((thread) => thread.id === 'staff-general' || thread.type === 'staff-general' || (thread.staffId === id && thread.type !== 'support')); } const id = clientId(user); return threads.filter((thread) => thread.clientId === id || thread.id === `support-${id}` || String(thread.id).startsWith(`therapist-${id}-`)); }
function buildDialogs(threads, contacts, user) {
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const groups = new Map();
  threads.forEach((thread) => { const key = threadContactId(thread, user); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(thread); });
  return [...groups.entries()].map(([id, group]) => {
    const sortedThreads = [...group].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const messages = group.flatMap((thread) => (thread.messages || []).map((message) => ({ ...message, role: msgRole(message), name: msgName(message), text: msgText(message), threadId: thread.id, subject: thread.subject }))).sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const lastThread = sortedThreads[0];
    const contact = contactMap.get(id) || { id, kind: id.startsWith('staff:') ? 'employee' : 'client', name: lastThread?.clientName || lastThread?.staffName || lastThread?.title || 'Контакт', subtitle: lastThread?.subject || '', searchText: blob(lastThread?.title, lastThread?.subject) };
    const status = group.some((thread) => thread.status === 'pending') ? 'pending' : group.every((thread) => thread.status === 'resolved') ? 'resolved' : 'open';
    const searchText = blob(contact.searchText, contact.name, contact.subtitle, group.map((thread) => [thread.title, thread.subject, thread.clientName, thread.staffName, thread.note, thread.notes]), messages.map((message) => [message.name, message.text, message.subject]));
    return { id, kind: contact.kind, contact, threads: group, primaryThreadId: lastThread?.id, messages, lastMessage: messages[messages.length - 1], updatedAt: lastThread?.updatedAt || messages[messages.length - 1]?.at || '', status, searchText };
  }).sort((a, b) => {
    if (a.id === 'staff:general') return -1;
    if (b.id === 'staff:general') return 1;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}
function ensureBaseThreads(threads, user, staff, clients, demoClients, events) {
  const next = [...threads];
  const has = (id) => next.some((thread) => thread.id === id);
  if (user.role !== 'client' && !has('staff-general')) next.push({ id: 'staff-general', type: 'staff-general', title: 'Общий чат сотрудников', subject: 'Общий чат сотрудников', status: 'open', updatedAt: now(), messages: [makeMsg('system', 'Система', 'Общий чат для администратора и массажистов.')] });
  if (user.role === 'client') {
    const id = clientId(user);
    const assigned = assignedStaff(user, staff, clients, demoClients, events);
    if (!has(`support-${id}`)) next.push({ id: `support-${id}`, type: 'support', title: 'Администратор', subject: 'Администратор', clientId: id, clientName: displayName(user), status: 'open', updatedAt: now(), messages: [makeMsg('admin', 'Администратор', 'Здесь можно написать по записи, переносу, отмене или оплате.')] });
    if (!has(`therapist-${id}-${assigned}`)) next.push({ id: `therapist-${id}-${assigned}`, type: 'therapist', title: staffName(staff, assigned), subject: 'Закреплённый массажист', clientId: id, clientName: displayName(user), staffId: assigned, staffName: staffName(staff, assigned), status: 'open', updatedAt: now(), messages: [makeMsg('therapist', staffName(staff, assigned), 'Напишите сюда вопросы по самочувствию, пожеланиям и подготовке к сеансу.')] });
  }
  return next;
}

export default function MessageHubV4({ user }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('dialogs');
  const [filter, setFilter] = useState('all');
  const [mobile, setMobile] = useState('list');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState('');
  const [reply, setReply] = useState('');
  const [draft, setDraft] = useState({ contactId: '', text: '' });
  const [tick, setTick] = useState(0);
  const [threads, setThreads] = useState(() => read(THREADS, []));

  const staff = useMemo(() => read(STAFF, STAFF_FALLBACK).filter((item) => item.active !== false), [open, tick]);
  const clients = useMemo(() => read(CLIENTS, []), [open, tick]);
  const demoClients = useMemo(() => read(DEMO_CLIENTS, []), [open, tick]);
  const events = useMemo(() => read(EVENTS, []), [open, tick]);
  const contacts = useMemo(() => buildContacts(user, staff, clients, demoClients, events, threads), [user, staff, clients, demoClients, events, threads]);
  const dialogs = useMemo(() => buildDialogs(threadsForRole(threads, user, staff), contacts, user), [threads, user, staff, contacts]);
  const active = dialogs.find((dialog) => dialog.id === activeId) || dialogs[0] || null;
  const unread = dialogs.filter((dialog) => dialog.status !== 'resolved' && dialog.lastMessage?.role !== user.role).length;
  const visibleDialogs = dialogs.filter((dialog) => (filter === 'all' || dialog.kind === filter) && matches(dialog.searchText, query));
  const visibleContacts = contacts.filter((contact) => (filter === 'all' || contact.kind === filter) && matches(blob(contact.searchText, contact.name, contact.subtitle, contact.phone, contact.clientId, contact.staffId), query));

  useEffect(() => { const next = ensureBaseThreads(threads, user, staff, clients, demoClients, events); if (next.length !== threads.length) { setThreads(next); save(THREADS, next); } }, []);
  useEffect(() => { if (!activeId && dialogs[0]) setActiveId(dialogs[0].id); }, [activeId, dialogs]);

  const persist = (next) => { setThreads(next); save(THREADS, next); setTick((n) => n + 1); };
  const append = (dialog, message, patch = {}) => persist(threads.map((thread) => thread.id === dialog.primaryThreadId ? { ...thread, ...patch, status: patch.status || (thread.status === 'resolved' ? 'open' : thread.status), updatedAt: now(), messages: [...(thread.messages || []), message] } : thread));
  const makeThread = (contact, message) => ({ id: `thread-${contact.id}-${Date.now()}`.replace(/:/g, '-'), type: 'direct', title: contact.name, subject: 'Беседа', clientId: contact.kind === 'client' ? contact.clientId || contact.id.replace('client:', '') : user.role === 'client' ? clientId(user) : '', clientName: contact.kind === 'client' ? contact.name : user.role === 'client' ? displayName(user) : '', staffId: contact.kind === 'employee' && contact.id !== 'staff:general' ? contact.staffId || contact.id.replace('staff:', '') : contact.staffId || '', staffName: contact.kind === 'employee' && contact.id !== 'staff:general' ? contact.name : '', status: 'open', updatedAt: now(), messages: [message] });
  const sendNew = () => { const contact = contacts.find((item) => item.id === draft.contactId); const text = draft.text.trim(); if (!contact || !text) return; const message = makeMsg(user.role, displayName(user), text); const existing = dialogs.find((dialog) => dialog.id === contact.id); if (existing) { append(existing, message); setActiveId(existing.id); } else { persist([makeThread(contact, message), ...threads]); setActiveId(contact.id); } setDraft({ contactId: '', text: '' }); setView('dialogs'); setMobile('chat'); };
  const sendReply = () => { if (!active || !reply.trim()) return; append(active, makeMsg(user.role, displayName(user), reply.trim())); setReply(''); };
  const setStatus = (status) => { if (!active) return; append(active, makeMsg('system', 'Система', `Статус: ${statusLabel(status)}.`), { status }); };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-[95] grid h-14 w-14 place-items-center rounded-full border border-lime-200/30 bg-lime-200 text-2xl font-black text-emerald-950 shadow-2xl shadow-black/45 md:bottom-6 md:right-6" aria-label="Сообщения">✉{unread > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">{unread}</span>}</button>
    {open && <div className="fixed bottom-20 right-2 z-[96] flex h-[84vh] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#05110b]/96 text-white shadow-2xl shadow-black/60 backdrop-blur-xl md:bottom-6 md:right-24 md:h-[790px] md:max-h-[calc(100vh-3rem)]">
      <div className="grid min-h-0 flex-1 md:grid-cols-[390px_1fr]">
        <aside className={cx('flex min-h-0 flex-col border-b border-white/10 md:border-b-0 md:border-r', mobile === 'chat' ? 'hidden md:flex' : 'flex')}>
          <div className="border-b border-white/10 p-3"><div className="flex items-center justify-between gap-2"><h2 className="text-2xl font-black tracking-[-.05em] text-lime-50">Сообщения</h2><div className="flex gap-2"><button onClick={() => setView(view === 'compose' ? 'dialogs' : 'compose')} className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">{view === 'compose' ? 'Чаты' : '+ Новый'}</button><button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white">×</button></div></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" /><FilterTabs filter={filter} setFilter={setFilter} user={user} /></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">{view === 'compose' ? <Compose contacts={visibleContacts} draft={draft} setDraft={setDraft} send={sendNew} query={query} /> : <DialogList dialogs={visibleDialogs} activeId={active?.id} pick={(id) => { setActiveId(id); setMobile('chat'); }} query={query} />}</div>
        </aside>
        <section className={cx('min-h-0 flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(190,255,120,.08),transparent_36%)] md:flex', mobile === 'chat' ? 'flex' : 'hidden')}>{active ? <Chat dialog={active} user={user} reply={reply} setReply={setReply} send={sendReply} setStatus={setStatus} back={() => setMobile('list')} /> : <EmptyChat setView={setView} />}</section>
      </div>
    </div>}
  </>;
}

function FilterTabs({ filter, setFilter, user }) { const items = user.role === 'client' ? [['all', 'Все'], ['admin', 'Админ'], ['employee', 'Массажист']] : [['all', 'Все'], ['employee', 'Сотрудники'], ['client', 'Клиенты']]; return <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-white/8 p-1">{items.map(([id, label]) => <button key={id} onClick={() => setFilter(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', filter === id ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65')}>{label}</button>)}</div>; }
function DialogList({ dialogs, activeId, pick, query }) { return <div className="grid gap-1.5">{dialogs.length === 0 && <Empty text={query ? 'Ничего не найдено.' : 'Чатов пока нет. Нажмите «+ Новый».'} />}{dialogs.map((dialog) => <button key={dialog.id} onClick={() => pick(dialog.id)} className={cx('rounded-2xl border p-3 text-left transition active:scale-[.99]', color(dialog.kind, activeId === dialog.id))}><div className="flex gap-3"><Avatar contact={dialog.contact} active={activeId === dialog.id} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><b className="truncate text-sm">{dialog.contact.name}</b><span className="shrink-0 text-[10px] font-black opacity-45">{formatTime(dialog.updatedAt)}</span></div><div className="truncate text-xs opacity-60">{roleLabel(dialog.kind)} · {statusLabel(dialog.status)}</div><div className="mt-1 truncate text-[12px] opacity-70">{dialog.lastMessage ? `${dialog.lastMessage.name}: ${cut(dialog.lastMessage.text)}` : 'Нет сообщений'}</div></div></div></button>)}</div>; }
function Compose({ contacts, draft, setDraft, send, query }) { const selected = contacts.find((contact) => contact.id === draft.contactId); return <div className="grid gap-2"><div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Новая беседа</div><select value={draft.contactId} onChange={(e) => setDraft((d) => ({ ...d, contactId: e.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-xs font-black text-emerald-950"><option value="">Выберите получателя</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{roleLabel(contact.kind)} · {contact.name}</option>)}</select>{selected && <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/20 p-2"><Avatar contact={selected} /><div className="min-w-0"><b className="block truncate text-sm text-lime-50">{selected.name}</b><span className="block truncate text-[11px] text-emerald-50/45">{selected.subtitle}</span></div></div>}<textarea value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} rows={5} placeholder="Сообщение" className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" /><button onClick={send} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-3 text-sm font-black text-emerald-950">Отправить</button></div><div className="rounded-2xl bg-white/5 p-2"><div className="px-2 py-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/35">Получатели {query ? 'по поиску' : ''}</div>{contacts.map((contact) => <button key={contact.id} onClick={() => setDraft((d) => ({ ...d, contactId: contact.id }))} className={cx('mt-1 flex w-full items-center gap-2 rounded-xl border p-2 text-left', color(contact.kind, draft.contactId === contact.id))}><Avatar contact={contact} active={draft.contactId === contact.id} /><div className="min-w-0"><b className="block truncate text-sm">{contact.name}</b><span className="block truncate text-[11px] opacity-55">{contact.subtitle}</span></div></button>)}</div></div>; }
function Chat({ dialog, user, reply, setReply, send, setStatus, back }) { return <><div className="border-b border-white/10 px-4 py-3"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><button onClick={back} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white md:hidden">‹</button><Avatar contact={dialog.contact} /><div className="min-w-0"><h3 className="truncate text-lg font-black text-lime-50">{dialog.contact.name}</h3><p className="truncate text-xs text-emerald-50/55">{roleLabel(dialog.kind)} · {statusLabel(dialog.status)}</p></div></div>{['admin', 'therapist'].includes(user.role) && dialog.id !== 'staff:general' && <div className="hidden gap-1 sm:flex"><button onClick={() => setStatus('open')} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white">Открыт</button><button onClick={() => setStatus('pending')} className="rounded-full bg-blue-600 px-3 py-2 text-[10px] font-black text-white">В работе</button><button onClick={() => setStatus('resolved')} className="rounded-full bg-lime-200 px-3 py-2 text-[10px] font-black text-emerald-950">Закрыть</button></div>}</div></div><div className="min-h-0 flex-1 overflow-y-auto px-4 py-4"><div className="mx-auto grid max-w-3xl gap-2">{dialog.messages.map((message) => <Bubble key={message.id} message={message} self={message.role === user.role} />)}</div></div><div className="border-t border-white/10 bg-black/10 p-3"><div className="mx-auto flex max-w-3xl gap-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} className="min-w-0 flex-1 resize-none rounded-2xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none" placeholder="Сообщение" /><button onClick={send} className="rounded-2xl bg-lime-200 px-4 text-xs font-black text-emerald-950">➤</button></div></div></>; }
function Bubble({ message, self }) { const system = message.role === 'system'; return <div className={cx('max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-lg', system ? 'mx-auto bg-white/8 text-center text-xs font-bold text-emerald-50/50' : self ? 'ml-auto bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}><div className="mb-1 text-[10px] font-black uppercase tracking-[.1em] opacity-55">{system ? formatTime(message.at) : `${message.name} · ${formatTime(message.at)}`}</div><div className="whitespace-pre-line leading-5">{message.text}</div></div>; }
function Avatar({ contact, active = false }) { const icon = contact.id === 'staff:general' ? '👥' : String(contact.name || '?').slice(0, 1).toUpperCase(); return <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full border text-xs font-black', color(contact.kind, active))}>{icon}</span>; }
function Empty({ text }) { return <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs font-bold text-emerald-50/45">{text}</div>; }
function EmptyChat({ setView }) { return <div className="grid flex-1 place-items-center p-6 text-center"><div className="max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-6"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-200 text-2xl text-emerald-950">✉</div><h3 className="mt-4 text-2xl font-black text-lime-50">Выберите чат</h3><p className="mt-2 text-sm leading-6 text-emerald-50/55">Слева список бесед. Для новой переписки нажмите «+ Новый».</p><button onClick={() => setView('compose')} className="mt-4 rounded-full bg-lime-200 px-5 py-3 text-sm font-black text-emerald-950">Новая беседа</button></div></div>; }

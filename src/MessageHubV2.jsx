import { useEffect, useMemo, useState } from 'react';

const THREADS = 'lakizaMessengerThreads';
const EVENTS = 'lakizaAdminSchedulerEvents';
const STAFF = 'lakizaAdminSchedulerStaff';
const CLIENTS = 'lakizaClientProfiles';
const DEMO_CLIENTS = 'lakizaDemoClients';

const defaultStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', active: true },
];

const requestTypes = [
  ['question', 'Общий вопрос', 'admin'],
  ['reschedule', 'Перенос сеанса', 'admin'],
  ['cancel', 'Отмена сеанса', 'admin'],
  ['therapist', 'Лично массажисту', 'therapist'],
];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function now() { return new Date().toISOString(); }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function phoneKey(value) { const raw = digits(value); return raw.startsWith('7') || raw.startsWith('8') ? raw.slice(1) : raw; }
function idText(value) { return String(value || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || `id-${Date.now()}`; }
function fullName(user) { return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь'; }
function clientId(user) { return phoneKey(user?.phone || user?.login) || idText(user?.login || 'client'); }
function time(value) { return value ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'сейчас'; }
function cx(...items) { return items.filter(Boolean).join(' '); }
function textCut(value, limit = 90) { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > limit ? `${text.slice(0, limit)}…` : text; }
function staffName(staff, id) { return staff.find((item) => item.id === id)?.name || 'Массажист'; }
function staffIdFor(user, staff) { const name = fullName(user).toLowerCase(); return user?.staffId || user?.therapistId || staff.find((item) => name && item.name.toLowerCase().includes(name))?.id || staff[0]?.id || 'kristina'; }
function assignedStaff(user, staff, clients, demoClients, events) {
  const phone = phoneKey(user?.phone || user?.login);
  const profile = clients.find((item) => phoneKey(item.phone) === phone);
  const demo = demoClients.find((item) => phoneKey(item.phone || item.login) === phone);
  const event = events.find((item) => phoneKey(item.phone) === phone && item.staffId);
  return profile?.assignedStaffId || demo?.assignedStaffId || event?.staffId || staff[0]?.id || 'kristina';
}
function msg(role, name, text) { return { id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, name, text, at: now() }; }
function badge(kind) { return kind === 'employee' ? 'сотрудник' : kind === 'client' ? 'клиент' : 'админ'; }
function colors(kind, active = false) {
  if (active) return 'bg-lime-200 text-emerald-950';
  if (kind === 'employee') return 'bg-blue-600/25 text-blue-100 border-blue-300/20';
  if (kind === 'client') return 'bg-lime-200/15 text-lime-100 border-lime-200/20';
  return 'bg-white/10 text-emerald-50 border-white/10';
}
function statusText(status) { return { open: 'открыт', pending: 'в работе', resolved: 'закрыт' }[status] || status || 'открыт'; }
function typeText(type) { return { support: 'админ', therapist: 'массажист', question: 'вопрос', reschedule: 'перенос', cancel: 'отмена', direct: 'беседа' }[type] || type || 'чат'; }

function add(map, contact) { if (contact?.id && !map.has(contact.id)) map.set(contact.id, contact); }
function buildContacts(user, staff, clients, demoClients, events, threads) {
  const map = new Map();
  const assigned = assignedStaff(user, staff, clients, demoClients, events);
  const therapist = staffIdFor(user, staff);

  if (user.role === 'client') {
    add(map, { id: 'admin', kind: 'admin', name: 'Администратор', subtitle: 'запись, переносы, оплата' });
    add(map, { id: `staff:${assigned}`, kind: 'employee', name: staffName(staff, assigned), subtitle: 'закреплённый массажист', staffId: assigned });
    return [...map.values()];
  }

  if (user.role === 'admin') {
    staff.forEach((item) => add(map, { id: `staff:${item.id}`, kind: 'employee', name: item.name, subtitle: item.title || 'сотрудник', staffId: item.id, phone: item.phone || '' }));
    clients.forEach((item) => { const id = phoneKey(item.phone) || idText(item.id || item.name); add(map, { id: `client:${id}`, kind: 'client', name: item.name || 'Клиент', subtitle: item.phone || item.email || 'клиент', clientId: id, phone: item.phone || '', staffId: item.assignedStaffId || '' }); });
    demoClients.forEach((item) => { const id = phoneKey(item.phone || item.login) || idText(item.login || item.name); add(map, { id: `client:${id}`, kind: 'client', name: [item.name, item.surname].filter(Boolean).join(' ') || item.login || 'Клиент', subtitle: item.phone || item.email || 'клиент', clientId: id, phone: item.phone || '', staffId: item.assignedStaffId || '' }); });
    events.forEach((item) => { const id = phoneKey(item.phone) || idText(item.client || item.clientName); add(map, { id: `client:${id}`, kind: 'client', name: item.client || item.clientName || 'Клиент', subtitle: item.phone || 'клиент из записи', clientId: id, phone: item.phone || '', staffId: item.staffId || '' }); });
    threads.forEach((item) => {
      if (item.clientId) add(map, { id: `client:${item.clientId}`, kind: 'client', name: item.clientName || item.title || 'Клиент', subtitle: item.staffName ? `закреплён: ${item.staffName}` : 'из диалога', clientId: item.clientId, staffId: item.staffId || '' });
      if (item.staffId && !item.clientId) add(map, { id: `staff:${item.staffId}`, kind: 'employee', name: item.staffName || staffName(staff, item.staffId), subtitle: 'сотрудник', staffId: item.staffId });
    });
    return [...map.values()].sort((a, b) => `${a.kind}-${a.name}`.localeCompare(`${b.kind}-${b.name}`));
  }

  add(map, { id: 'admin', kind: 'admin', name: 'Администратор', subtitle: 'служебные вопросы' });
  events.filter((item) => item.staffId === therapist).forEach((item) => { const id = phoneKey(item.phone) || idText(item.client || item.clientName); add(map, { id: `client:${id}`, kind: 'client', name: item.client || item.clientName || 'Клиент', subtitle: item.phone || 'мой клиент', clientId: id, phone: item.phone || '', staffId: therapist }); });
  threads.filter((item) => item.staffId === therapist && item.clientId).forEach((item) => add(map, { id: `client:${item.clientId}`, kind: 'client', name: item.clientName || item.title || 'Клиент', subtitle: 'мой клиент', clientId: item.clientId, staffId: therapist }));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function threadKey(thread, user) {
  if (user.role === 'client') return thread.type === 'therapist' && thread.staffId ? `staff:${thread.staffId}` : 'admin';
  if (user.role === 'therapist') return thread.clientId ? `client:${thread.clientId}` : 'admin';
  if (thread.clientId) return `client:${thread.clientId}`;
  if (thread.staffId) return `staff:${thread.staffId}`;
  return thread.contactId || `thread:${thread.id}`;
}
function visibleThreads(threads, user, staff) {
  if (user.role === 'admin') return threads;
  if (user.role === 'therapist') { const id = staffIdFor(user, staff); return threads.filter((item) => item.staffId === id && item.type !== 'support'); }
  const id = clientId(user);
  return threads.filter((item) => item.clientId === id || item.id === `support-${id}` || String(item.id).startsWith(`therapist-${id}-`));
}
function buildConversations(threads, contacts, user) {
  const cMap = new Map(contacts.map((item) => [item.id, item]));
  const groups = new Map();
  threads.forEach((thread) => { const key = threadKey(thread, user); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(thread); });
  return [...groups.entries()].map(([id, items]) => {
    const messages = items.flatMap((thread) => (thread.messages || []).map((m) => ({ ...m, threadId: thread.id, threadType: thread.type, subject: thread.subject }))).sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const sorted = [...items].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const lastThread = sorted[0];
    const contact = cMap.get(id) || { id, kind: id.startsWith('staff:') ? 'employee' : 'client', name: lastThread?.clientName || lastThread?.staffName || lastThread?.title || 'Контакт', subtitle: lastThread?.subject || '' };
    const status = items.some((thread) => thread.status === 'pending') ? 'pending' : items.every((thread) => thread.status === 'resolved') ? 'resolved' : 'open';
    return { id, contact, threads: items, primaryThreadId: lastThread?.id, messages, lastMessage: messages.at(-1), updatedAt: lastThread?.updatedAt || messages.at(-1)?.at || '', status };
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function ensureBaseThreads(threads, user, staff, clients, demoClients, events) {
  const next = [...threads];
  const has = (id) => next.some((item) => item.id === id);
  if (user.role === 'client') {
    const id = clientId(user);
    const assigned = assignedStaff(user, staff, clients, demoClients, events);
    if (!has(`support-${id}`)) next.push({ id: `support-${id}`, type: 'support', title: 'Администратор', subject: 'Общие вопросы', clientId: id, clientName: fullName(user), status: 'open', updatedAt: now(), messages: [msg('admin', 'Администратор', 'Напишите сюда вопрос по записи, оплате, переносу или отмене.')] });
    if (!has(`therapist-${id}-${assigned}`)) next.push({ id: `therapist-${id}-${assigned}`, type: 'therapist', title: staffName(staff, assigned), subject: 'Закреплённый массажист', clientId: id, clientName: fullName(user), staffId: assigned, staffName: staffName(staff, assigned), status: 'open', updatedAt: now(), messages: [msg('therapist', staffName(staff, assigned), 'Здесь можно уточнить самочувствие, пожелания и детали перед сеансом.')] });
  }
  return next;
}

export default function MessageHubV2({ user }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('dialogs');
  const [mobile, setMobile] = useState('dialogs');
  const [activeId, setActiveId] = useState('');
  const [reply, setReply] = useState('');
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [threads, setThreads] = useState(() => read(THREADS, []));
  const [newChat, setNewChat] = useState({ contactId: '', text: '' });
  const [contactDraft, setContactDraft] = useState({ kind: 'client', name: '', phone: '', title: '' });
  const [request, setRequest] = useState({ type: 'question', appointmentId: '', requestedDate: '', requestedTime: '', text: '' });
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));

  const staff = useMemo(() => read(STAFF, defaultStaff).filter((item) => item.active !== false), [open, tick]);
  const clients = useMemo(() => read(CLIENTS, []), [open, tick]);
  const demoClients = useMemo(() => read(DEMO_CLIENTS, []), [open, tick]);
  const events = useMemo(() => read(EVENTS, []), [open, tick]);
  const contacts = useMemo(() => buildContacts(user, staff, clients, demoClients, events, threads), [user, staff, clients, demoClients, events, threads]);
  const conversations = useMemo(() => buildConversations(visibleThreads(threads, user, staff), contacts, user), [threads, user, staff, contacts]);
  const active = conversations.find((item) => item.id === activeId) || conversations[0] || null;
  const shownContacts = contacts.filter((item) => `${item.name} ${item.subtitle} ${item.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  const shownDialogs = conversations.filter((item) => `${item.contact.name} ${item.contact.subtitle} ${item.lastMessage?.text || ''}`.toLowerCase().includes(query.toLowerCase()));
  const unread = conversations.filter((item) => item.status !== 'resolved' && item.lastMessage?.role !== user.role).length;

  useEffect(() => { const next = ensureBaseThreads(threads, user, staff, clients, demoClients, events); if (next.length !== threads.length) { setThreads(next); save(THREADS, next); } }, []);
  useEffect(() => { if (!activeId && conversations[0]) setActiveId(conversations[0].id); }, [activeId, conversations]);

  const persist = (next) => { setThreads(next); save(THREADS, next); };
  const askPermission = async () => {
    if (!('Notification' in window)) return setPermission('unsupported');
    if (Notification.permission === 'denied') return setPermission('denied');
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') new Notification('Лакиза', { body: 'Уведомления включены.' });
  };

  const makeThread = (contact, first, type = 'direct', subject = 'Новая беседа') => {
    const client = contact.kind === 'client';
    const employee = contact.kind === 'employee';
    return { id: `thread-${contact.id}-${Date.now()}`.replace(/:/g, '-'), type, title: contact.name, subject, clientId: client ? contact.clientId || contact.id.replace('client:', '') : user.role === 'client' ? clientId(user) : '', clientName: client ? contact.name : user.role === 'client' ? fullName(user) : '', staffId: employee ? contact.staffId || contact.id.replace('staff:', '') : contact.staffId || (user.role === 'therapist' ? staffIdFor(user, staff) : ''), staffName: employee ? contact.name : contact.staffId ? staffName(staff, contact.staffId) : '', status: type === 'direct' ? 'open' : 'pending', updatedAt: now(), messages: [first] };
  };
  const append = (conversation, message, patch = {}) => {
    const next = threads.map((thread) => thread.id === conversation.primaryThreadId ? { ...thread, ...patch, status: patch.status || (thread.status === 'resolved' ? 'open' : thread.status), updatedAt: now(), messages: [...(thread.messages || []), message] } : thread);
    persist(next);
  };
  const start = (contact, text, type = 'direct', subject = 'Новая беседа') => {
    const message = msg(user.role, fullName(user), text);
    const old = conversations.find((item) => item.id === contact.id);
    if (old) { append(old, message, { status: type === 'direct' ? 'open' : 'pending', subject }); setActiveId(old.id); }
    else { persist([makeThread(contact, message, type, subject), ...threads]); setActiveId(contact.id); }
    setMobile('chat'); setPanel('dialogs');
  };
  const sendReply = () => { if (!active || !reply.trim()) return; append(active, msg(user.role, fullName(user), reply.trim())); setReply(''); };
  const setStatus = (status) => { if (!active) return; append(active, msg('system', 'Система', `Статус: ${statusText(status)}.`), { status }); };
  const createChat = () => { const contact = contacts.find((item) => item.id === newChat.contactId); if (!contact || !newChat.text.trim()) return; start(contact, newChat.text.trim()); setNewChat({ contactId: '', text: '' }); };
  const createContact = () => {
    if (user.role !== 'admin' || !contactDraft.name.trim()) return;
    if (contactDraft.kind === 'employee') save(STAFF, [...staff, { id: idText(contactDraft.name), name: contactDraft.name.trim(), title: contactDraft.title.trim() || 'Сотрудник', phone: contactDraft.phone.trim(), active: true }]);
    else save(CLIENTS, [...clients, { id: `client-${phoneKey(contactDraft.phone) || idText(contactDraft.name)}`, name: contactDraft.name.trim(), phone: contactDraft.phone.trim(), assignedStaffId: '', createdAt: now() }]);
    setContactDraft({ kind: 'client', name: '', phone: '', title: '' }); setTick((n) => n + 1); setPanel('contacts');
  };
  const createRequest = () => {
    if (user.role !== 'client') return;
    const type = requestTypes.find(([id]) => id === request.type) || requestTypes[0];
    const contact = contacts.find((item) => item.id === (type[2] === 'therapist' ? `staff:${assignedStaff(user, staff, clients, demoClients, events)}` : 'admin'));
    const event = events.find((item) => item.id === request.appointmentId);
    const lines = [type[1], event ? `Сеанс: ${event.date} · ${event.time} · ${event.service || 'услуга'}` : '', request.type === 'reschedule' && request.requestedDate ? `Желаемое время: ${request.requestedDate} · ${request.requestedTime || 'уточнить'}` : '', request.text.trim()].filter(Boolean);
    if (!contact || lines.length < 2) return;
    start(contact, lines.join('\n'), request.type, type[1]);
    setRequest({ type: 'question', appointmentId: '', requestedDate: '', requestedTime: '', text: '' });
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-[95] grid h-14 w-14 place-items-center rounded-full border border-lime-200/30 bg-lime-200 text-2xl font-black text-emerald-950 shadow-2xl shadow-black/45 md:bottom-6 md:right-6">✉{unread > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">{unread}</span>}</button>
    {open && <div className="fixed bottom-20 right-2 z-[96] flex h-[84vh] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#06140d]/96 shadow-2xl shadow-black/60 backdrop-blur-xl md:bottom-6 md:right-24 md:h-[780px] md:max-h-[calc(100vh-3rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300/65">мессенджер</div><h2 className="text-xl font-black text-lime-50">Центр сообщений</h2></div><div className="flex gap-2"><button onClick={askPermission} className="rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white">{permission === 'granted' ? 'Уведомления включены' : 'Уведомления'}</button><button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Закрыть</button></div></div>
      <div className="grid grid-cols-3 gap-1 border-b border-white/10 p-2 md:hidden">{['dialogs', 'contacts', 'new'].map((id) => <button key={id} onClick={() => { setMobile(id); setPanel(id); }} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', mobile === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{id === 'dialogs' ? 'Диалоги' : id === 'contacts' ? 'Контакты' : 'Новая беседа'}</button>)}</div>
      <div className="grid min-h-0 flex-1 md:grid-cols-[360px_1fr]">
        <aside className={cx('min-h-0 overflow-y-auto border-b border-white/10 p-3 md:block md:border-b-0 md:border-r', mobile === 'chat' ? 'hidden' : 'block')}>
          <div className="hidden grid-cols-3 gap-1 rounded-2xl bg-white/8 p-1 md:grid">{['dialogs', 'contacts', 'new'].map((id) => <button key={id} onClick={() => setPanel(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', panel === id ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65')}>{id === 'dialogs' ? 'Диалоги' : id === 'contacts' ? 'Контакты' : 'Новая'}</button>)}</div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" className="mt-3 w-full rounded-2xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none" />
          {panel === 'dialogs' && <DialogList items={shownDialogs} active={active?.id} pick={(id) => { setActiveId(id); setMobile('chat'); }} />}
          {panel === 'contacts' && <ContactPanel contacts={shownContacts} pick={(c) => { setNewChat((p) => ({ ...p, contactId: c.id })); setPanel('new'); setMobile('new'); }} user={user} draft={contactDraft} setDraft={setContactDraft} createContact={createContact} />}
          {panel === 'new' && <NewChat contacts={shownContacts} state={newChat} setState={setNewChat} create={createChat} />}
          {user.role === 'client' && <RequestForm state={request} setState={setRequest} events={events.filter((e) => phoneKey(e.phone) === phoneKey(user.phone || user.login))} create={createRequest} />}
        </aside>
        <section className={cx('min-h-0 flex-col md:flex', mobile === 'chat' ? 'flex' : 'hidden')}>{active ? <Chat active={active} user={user} reply={reply} setReply={setReply} send={sendReply} setStatus={setStatus} back={() => setMobile('dialogs')} /> : <EmptyState text="Выберите диалог." />}</section>
      </div>
    </div>}
  </>;
}

function DialogList({ items, active, pick }) { return <div className="mt-3 grid gap-2"><HeaderCount title="Диалоги" count={items.length} />{items.length === 0 && <EmptyState text="Диалогов пока нет." />}{items.map((item) => <button key={item.id} onClick={() => pick(item.id)} className={cx('rounded-2xl p-3 text-left', active === item.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}><div className="flex gap-2"><Avatar contact={item.contact} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="truncate text-sm">{item.contact.name}</b><span className="rounded-full bg-black/15 px-2 py-1 text-[8px] font-black">{badge(item.contact.kind)}</span></div><div className="truncate text-xs opacity-60">{item.contact.subtitle || typeText(item.threads.at(-1)?.type)}</div><div className="mt-1 truncate text-[11px] opacity-60">{item.lastMessage ? `${item.lastMessage.name}: ${textCut(item.lastMessage.text)}` : 'Нет сообщений'}</div><div className="mt-1 flex justify-between text-[10px] font-black opacity-50"><span>{statusText(item.status)}</span><span>{time(item.updatedAt)}</span></div></div></div></button>)}</div>; }
function ContactPanel({ contacts, pick, user, draft, setDraft, createContact }) { const groups = [['employee', 'Сотрудники'], ['client', 'Клиенты'], ['admin', 'Служебные']]; return <div className="mt-3 grid gap-3"><HeaderCount title="Контакты" count={contacts.length} />{user.role === 'admin' && <div className="rounded-2xl bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Новый контакт</div><select value={draft.kind} onChange={(e) => setDraft((p) => ({ ...p, kind: e.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-950"><option value="client">Клиент</option><option value="employee">Сотрудник</option></select><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Имя" className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" /><input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Телефон" className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" />{draft.kind === 'employee' && <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Должность" className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" />}<button onClick={createContact} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Добавить</button></div>}{groups.map(([kind, title]) => <Group key={kind} title={title} items={contacts.filter((c) => c.kind === kind)} pick={pick} />)}</div>; }
function Group({ title, items, pick }) { if (!items.length) return null; return <div><div className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/35">{title}</div><div className="grid gap-2">{items.map((c) => <button key={c.id} onClick={() => pick(c)} className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-left"><Avatar contact={c} /><div className="min-w-0 flex-1"><b className="block truncate text-sm text-lime-50">{c.name}</b><span className="block truncate text-xs text-emerald-50/45">{c.subtitle || c.phone || badge(c.kind)}</span></div><span className={cx('rounded-full border px-2 py-1 text-[9px] font-black', colors(c.kind))}>{badge(c.kind)}</span></button>)}</div></div>; }
function NewChat({ contacts, state, setState, create }) { return <div className="mt-3 rounded-2xl bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Новая беседа</div><select value={state.contactId} onChange={(e) => setState((p) => ({ ...p, contactId: e.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-xs font-black text-emerald-950"><option value="">Выбрать контакт</option>{contacts.map((c) => <option key={c.id} value={c.id}>{badge(c.kind)} · {c.name}</option>)}</select><textarea value={state.text} onChange={(e) => setState((p) => ({ ...p, text: e.target.value }))} rows={4} placeholder="Первое сообщение" className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-3 text-xs font-bold text-emerald-950" /><button onClick={create} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-3 text-xs font-black text-emerald-950">Начать беседу</button></div>; }
function RequestForm({ state, setState, events, create }) { const type = requestTypes.find(([id]) => id === state.type); return <div className="mt-3 rounded-2xl bg-lime-200/10 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Обращение</div><select value={state.type} onChange={(e) => setState((p) => ({ ...p, type: e.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-950">{requestTypes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>{['reschedule', 'cancel'].includes(state.type) && <select value={state.appointmentId} onChange={(e) => setState((p) => ({ ...p, appointmentId: e.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950"><option value="">Выбрать сеанс</option>{events.map((e) => <option key={e.id} value={e.id}>{e.date} · {e.time} · {e.service}</option>)}</select>}{state.type === 'reschedule' && <div className="mt-2 grid grid-cols-2 gap-2"><input type="date" value={state.requestedDate} onChange={(e) => setState((p) => ({ ...p, requestedDate: e.target.value }))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" /><input type="time" value={state.requestedTime} onChange={(e) => setState((p) => ({ ...p, requestedTime: e.target.value }))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" /></div>}<textarea value={state.text} onChange={(e) => setState((p) => ({ ...p, text: e.target.value }))} rows={3} placeholder={type?.[1] || 'Сообщение'} className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" /><button onClick={create} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Создать обращение</button></div>; }
function Chat({ active, user, reply, setReply, send, setStatus, back }) { return <><div className="border-b border-white/10 px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><button onClick={back} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white md:hidden">‹ Диалоги</button><Avatar contact={active.contact} /><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/60">{badge(active.contact.kind)} · {statusText(active.status)}</div><h3 className="truncate text-lg font-black text-lime-50">{active.contact.name}</h3><p className="truncate text-xs text-emerald-50/55">{active.contact.subtitle || 'переписка'}</p></div></div>{['admin', 'therapist'].includes(user.role) && <div className="flex gap-1"><button onClick={() => setStatus('open')} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white">Открыт</button><button onClick={() => setStatus('pending')} className="rounded-full bg-blue-600 px-3 py-2 text-[10px] font-black text-white">В работе</button><button onClick={() => setStatus('resolved')} className="rounded-full bg-lime-200 px-3 py-2 text-[10px] font-black text-emerald-950">Закрыть</button></div>}</div></div><div className="min-h-0 flex-1 overflow-y-auto px-4 py-3"><div className="grid gap-2">{active.messages.map((m) => <Bubble key={m.id} message={m} self={m.role === user.role} />)}</div></div><div className="border-t border-white/10 p-3"><div className="flex gap-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} className="min-w-0 flex-1 resize-none rounded-2xl bg-white px-3 py-3 text-sm font-bold text-emerald-950" placeholder="Написать сообщение..." /><button onClick={send} className="rounded-2xl bg-lime-200 px-4 text-xs font-black text-emerald-950">Отправить</button></div><div className="mt-2 text-[10px] font-bold text-emerald-50/35">Enter — отправить, Shift+Enter — новая строка.</div></div></>; }
function Bubble({ message, self }) { const system = message.role === 'system'; return <div className={cx('max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-lg', system ? 'mx-auto bg-white/8 text-center text-xs font-bold text-emerald-50/50' : self ? 'ml-auto bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}><div className="mb-1 text-[10px] font-black uppercase tracking-[.1em] opacity-55">{system ? time(message.at) : `${message.name} · ${time(message.at)}`}</div><div className="whitespace-pre-line leading-5">{message.text}</div></div>; }
function Avatar({ contact }) { return <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xs font-black', colors(contact.kind))}>{String(contact.name || '?').slice(0, 1).toUpperCase()}</span>; }
function HeaderCount({ title, count }) { return <div className="flex items-center justify-between"><b className="text-sm text-lime-100">{title}</b><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-emerald-50/60">{count}</span></div>; }
function EmptyState({ text }) { return <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs font-bold text-emerald-50/45">{text}</div>; }

import { useEffect, useMemo, useState } from 'react';

const THREADS_KEY = 'lakizaMessengerThreads';
const EVENTS_KEY = 'lakizaAdminSchedulerEvents';
const STAFF_KEY = 'lakizaAdminSchedulerStaff';
const CLIENTS_KEY = 'lakizaClientProfiles';
const DEMO_CLIENTS_KEY = 'lakizaDemoClients';

const fallbackStaff = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', active: true },
];

const requestTypes = [
  { id: 'question', label: 'Общий вопрос', target: 'admin' },
  { id: 'reschedule', label: 'Перенос сеанса', target: 'admin' },
  { id: 'cancel', label: 'Отмена сеанса', target: 'admin' },
  { id: 'therapist', label: 'Лично массажисту', target: 'therapist' },
];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function now() { return new Date().toISOString(); }
function cx(...items) { return items.filter(Boolean).join(' '); }
function digits(value) { return String(value || '').replace(/\D/g, ''); }
function phoneKey(value) { const d = digits(value); return d.startsWith('7') || d.startsWith('8') ? d.slice(1) : d; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || `id-${Date.now()}`; }
function fullName(user) { return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь'; }
function currentClientId(user) { return phoneKey(user?.phone || user?.login) || slug(user?.login || 'client'); }
function time(value) { return value ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'сейчас'; }
function cut(value, size = 96) { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > size ? `${text.slice(0, size)}…` : text; }
function staffName(staff, id) { return staff.find((item) => item.id === id)?.name || 'Массажист'; }
function userStaffId(user, staff) {
  const name = fullName(user).toLowerCase();
  return user?.staffId || user?.therapistId || staff.find((item) => name && item.name.toLowerCase().includes(name))?.id || staff[0]?.id || 'kristina';
}
function assignedStaffId(user, staff, clients, demoClients, events) {
  const phone = phoneKey(user?.phone || user?.login);
  const profile = clients.find((item) => phoneKey(item.phone) === phone);
  const demo = demoClients.find((item) => phoneKey(item.phone || item.login) === phone);
  const event = events.find((item) => phoneKey(item.phone) === phone && item.staffId);
  return profile?.assignedStaffId || demo?.assignedStaffId || event?.staffId || staff[0]?.id || 'kristina';
}
function makeMsg(role, name, text) { return { id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, name, text, at: now() }; }
function roleLabel(kind) { return kind === 'employee' ? 'сотрудник' : kind === 'client' ? 'клиент' : 'админ'; }
function statusText(status) { return { open: 'открыт', pending: 'в работе', resolved: 'закрыт' }[status] || status || 'открыт'; }
function typeText(type) { return { support: 'админ', therapist: 'массажист', question: 'вопрос', reschedule: 'перенос', cancel: 'отмена', direct: 'беседа' }[type] || type || 'чат'; }
function tone(kind, active = false) {
  if (active) return 'border-lime-200 bg-lime-200 text-emerald-950 shadow-lime-950/20';
  if (kind === 'employee') return 'border-sky-300/20 bg-sky-400/12 text-sky-50';
  if (kind === 'client') return 'border-lime-200/20 bg-lime-200/10 text-lime-50';
  return 'border-white/10 bg-white/10 text-emerald-50';
}
function add(map, contact) { if (contact?.id && !map.has(contact.id)) map.set(contact.id, contact); }
function eventMatchesUser(event, user) { return phoneKey(event?.phone) && phoneKey(event.phone) === phoneKey(user?.phone || user?.login); }

function buildContacts(user, staff, clients, demoClients, events, threads) {
  const map = new Map();
  const assigned = assignedStaffId(user, staff, clients, demoClients, events);
  const staffId = userStaffId(user, staff);

  if (user.role === 'client') {
    add(map, { id: 'admin', kind: 'admin', name: 'Администратор', subtitle: 'запись, перенос, отмена, оплата' });
    add(map, { id: `staff:${assigned}`, kind: 'employee', name: staffName(staff, assigned), subtitle: 'закреплённый массажист', staffId: assigned });
    return [...map.values()];
  }

  if (user.role === 'admin') {
    staff.forEach((item) => add(map, { id: `staff:${item.id}`, kind: 'employee', name: item.name, subtitle: item.title || 'сотрудник', staffId: item.id, phone: item.phone || '' }));
    clients.forEach((item) => { const id = phoneKey(item.phone) || slug(item.id || item.name); add(map, { id: `client:${id}`, kind: 'client', name: item.name || 'Клиент', subtitle: item.phone || item.email || 'карточка клиента', clientId: id, phone: item.phone || '', staffId: item.assignedStaffId || '' }); });
    demoClients.forEach((item) => { const id = phoneKey(item.phone || item.login) || slug(item.login || item.name); add(map, { id: `client:${id}`, kind: 'client', name: [item.name, item.surname].filter(Boolean).join(' ') || item.login || 'Клиент', subtitle: item.phone || item.email || 'зарегистрирован', clientId: id, phone: item.phone || '', staffId: item.assignedStaffId || '' }); });
    events.forEach((item) => { const id = phoneKey(item.phone) || slug(item.client || item.clientName); add(map, { id: `client:${id}`, kind: 'client', name: item.client || item.clientName || 'Клиент', subtitle: item.phone || `${item.date || ''} ${item.time || ''}`.trim() || 'из записи', clientId: id, phone: item.phone || '', staffId: item.staffId || '' }); });
    threads.forEach((thread) => {
      if (thread.clientId) add(map, { id: `client:${thread.clientId}`, kind: 'client', name: thread.clientName || thread.title || 'Клиент', subtitle: thread.staffName ? `закреплён: ${thread.staffName}` : 'из переписки', clientId: thread.clientId, staffId: thread.staffId || '' });
      if (thread.staffId && !thread.clientId) add(map, { id: `staff:${thread.staffId}`, kind: 'employee', name: thread.staffName || staffName(staff, thread.staffId), subtitle: 'сотрудник', staffId: thread.staffId });
    });
    return [...map.values()].sort((a, b) => `${a.kind}-${a.name}`.localeCompare(`${b.kind}-${b.name}`, 'ru'));
  }

  add(map, { id: 'admin', kind: 'admin', name: 'Администратор', subtitle: 'служебные вопросы' });
  events.filter((item) => item.staffId === staffId).forEach((item) => { const id = phoneKey(item.phone) || slug(item.client || item.clientName); add(map, { id: `client:${id}`, kind: 'client', name: item.client || item.clientName || 'Клиент', subtitle: item.phone || 'мой клиент', clientId: id, phone: item.phone || '', staffId }); });
  threads.filter((item) => item.staffId === staffId && item.clientId).forEach((item) => add(map, { id: `client:${item.clientId}`, kind: 'client', name: item.clientName || item.title || 'Клиент', subtitle: 'мой клиент', clientId: item.clientId, staffId }));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

function contactKey(thread, user) {
  if (user.role === 'client') return thread.type === 'therapist' && thread.staffId ? `staff:${thread.staffId}` : 'admin';
  if (user.role === 'therapist') return thread.clientId ? `client:${thread.clientId}` : 'admin';
  if (thread.clientId) return `client:${thread.clientId}`;
  if (thread.staffId) return `staff:${thread.staffId}`;
  return thread.contactId || `thread:${thread.id}`;
}
function roleThreads(threads, user, staff) {
  if (user.role === 'admin') return threads;
  if (user.role === 'therapist') { const id = userStaffId(user, staff); return threads.filter((item) => item.staffId === id && item.type !== 'support'); }
  const id = currentClientId(user);
  return threads.filter((item) => item.clientId === id || item.id === `support-${id}` || String(item.id).startsWith(`therapist-${id}-`));
}
function buildDialogs(threads, contacts, user) {
  const contactMap = new Map(contacts.map((item) => [item.id, item]));
  const groups = new Map();
  threads.forEach((thread) => { const key = contactKey(thread, user); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(thread); });
  return [...groups.entries()].map(([id, group]) => {
    const messages = group.flatMap((thread) => (thread.messages || []).map((message) => ({ ...message, threadId: thread.id, threadType: thread.type, subject: thread.subject }))).sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const sorted = [...group].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const lastThread = sorted[0];
    const contact = contactMap.get(id) || { id, kind: id.startsWith('staff:') ? 'employee' : 'client', name: lastThread?.clientName || lastThread?.staffName || lastThread?.title || 'Контакт', subtitle: lastThread?.subject || '' };
    const status = group.some((thread) => thread.status === 'pending') ? 'pending' : group.every((thread) => thread.status === 'resolved') ? 'resolved' : 'open';
    return { id, contact, threads: group, primaryThreadId: lastThread?.id, messages, lastMessage: messages[messages.length - 1], updatedAt: lastThread?.updatedAt || messages[messages.length - 1]?.at || '', status };
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
function ensureStarterThreads(threads, user, staff, clients, demoClients, events) {
  const next = [...threads];
  const has = (id) => next.some((item) => item.id === id);
  if (user.role === 'client') {
    const id = currentClientId(user);
    const assigned = assignedStaffId(user, staff, clients, demoClients, events);
    if (!has(`support-${id}`)) next.push({ id: `support-${id}`, type: 'support', title: 'Администратор', subject: 'Общие вопросы', clientId: id, clientName: fullName(user), status: 'open', updatedAt: now(), messages: [makeMsg('admin', 'Администратор', 'Здесь можно написать по записи, переносу, отмене или оплате.')] });
    if (!has(`therapist-${id}-${assigned}`)) next.push({ id: `therapist-${id}-${assigned}`, type: 'therapist', title: staffName(staff, assigned), subject: 'Закреплённый массажист', clientId: id, clientName: fullName(user), staffId: assigned, staffName: staffName(staff, assigned), status: 'open', updatedAt: now(), messages: [makeMsg('therapist', staffName(staff, assigned), 'Напишите сюда вопросы по самочувствию, пожеланиям и подготовке к сеансу.')] });
  }
  if (user.role === 'admin' && next.length === 0) {
    next.push({ id: 'demo-chat-olga', type: 'question', title: 'Ольга', subject: 'Уточнение по записи', clientId: 'demo-olga', clientName: 'Ольга', staffId: 'kristina', staffName: staffName(staff, 'kristina'), status: 'open', updatedAt: now(), messages: [makeMsg('client', 'Ольга', 'Здравствуйте. Можно уточнить, сколько длится первый сеанс?')] });
  }
  return next;
}

export default function MessageHubV3({ user }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [mode, setMode] = useState('dialogs');
  const [mobile, setMobile] = useState('list');
  const [query, setQuery] = useState('');
  const [threads, setThreads] = useState(() => read(THREADS_KEY, []));
  const [reply, setReply] = useState('');
  const [compose, setCompose] = useState({ contactId: '', text: '', requestType: 'direct', appointmentId: '', requestedDate: '', requestedTime: '' });
  const [tick, setTick] = useState(0);
  const [permission, setPermission] = useState(() => (typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'));

  const staff = useMemo(() => read(STAFF_KEY, fallbackStaff).filter((item) => item.active !== false), [open, tick]);
  const clients = useMemo(() => read(CLIENTS_KEY, []), [open, tick]);
  const demoClients = useMemo(() => read(DEMO_CLIENTS_KEY, []), [open, tick]);
  const events = useMemo(() => read(EVENTS_KEY, []), [open, tick]);
  const contacts = useMemo(() => buildContacts(user, staff, clients, demoClients, events, threads), [user, staff, clients, demoClients, events, threads]);
  const dialogs = useMemo(() => buildDialogs(roleThreads(threads, user, staff), contacts, user), [threads, user, staff, contacts]);
  const active = dialogs.find((item) => item.id === activeId) || dialogs[0] || null;
  const filteredContacts = contacts.filter((item) => `${item.name} ${item.subtitle} ${item.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  const filteredDialogs = dialogs.filter((item) => `${item.contact.name} ${item.contact.subtitle} ${item.lastMessage?.text || ''}`.toLowerCase().includes(query.toLowerCase()));
  const unread = dialogs.filter((item) => item.status !== 'resolved' && item.lastMessage?.role !== user.role).length;
  const currentEvents = events.filter((item) => eventMatchesUser(item, user));

  useEffect(() => {
    const next = ensureStarterThreads(threads, user, staff, clients, demoClients, events);
    if (next.length !== threads.length) { setThreads(next); save(THREADS_KEY, next); }
  }, []);
  useEffect(() => { if (!activeId && dialogs[0]) setActiveId(dialogs[0].id); }, [activeId, dialogs]);

  const persist = (next) => { setThreads(next); save(THREADS_KEY, next); setTick((value) => value + 1); };
  const askPermission = async () => {
    if (!('Notification' in window)) return setPermission('unsupported');
    if (Notification.permission === 'denied') return setPermission('denied');
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') new Notification('Лакиза', { body: 'Уведомления по сообщениям включены.' });
  };
  const threadFromContact = (contact, message, type = 'direct', subject = 'Новая беседа') => {
    const isClient = contact.kind === 'client';
    const isEmployee = contact.kind === 'employee';
    return { id: `thread-${contact.id}-${Date.now()}`.replace(/:/g, '-'), type, title: contact.name, subject, clientId: isClient ? contact.clientId || contact.id.replace('client:', '') : user.role === 'client' ? currentClientId(user) : '', clientName: isClient ? contact.name : user.role === 'client' ? fullName(user) : '', staffId: isEmployee ? contact.staffId || contact.id.replace('staff:', '') : contact.staffId || (user.role === 'therapist' ? userStaffId(user, staff) : ''), staffName: isEmployee ? contact.name : contact.staffId ? staffName(staff, contact.staffId) : '', status: type === 'direct' ? 'open' : 'pending', updatedAt: now(), messages: [message] };
  };
  const append = (dialog, message, patch = {}) => {
    persist(threads.map((thread) => thread.id === dialog.primaryThreadId ? { ...thread, ...patch, status: patch.status || (thread.status === 'resolved' ? 'open' : thread.status), updatedAt: now(), messages: [...(thread.messages || []), message] } : thread));
  };
  const startWithContact = (contact, text, type = 'direct', subject = 'Новая беседа') => {
    const message = makeMsg(user.role, fullName(user), text);
    const old = dialogs.find((item) => item.id === contact.id);
    if (old) { append(old, message, { status: type === 'direct' ? 'open' : 'pending', subject }); setActiveId(old.id); }
    else { persist([threadFromContact(contact, message, type, subject), ...threads]); setActiveId(contact.id); }
    setCompose({ contactId: '', text: '', requestType: 'direct', appointmentId: '', requestedDate: '', requestedTime: '' });
    setMode('dialogs');
    setMobile('chat');
  };
  const sendCompose = () => {
    const contact = contacts.find((item) => item.id === compose.contactId);
    if (!contact || !compose.text.trim()) return;
    const request = requestTypes.find((item) => item.id === compose.requestType);
    const event = events.find((item) => item.id === compose.appointmentId);
    const parts = [request && request.id !== 'direct' ? request.label : '', event ? `Сеанс: ${event.date} · ${event.time} · ${event.service || 'услуга'}` : '', request?.id === 'reschedule' && compose.requestedDate ? `Желаемое время: ${compose.requestedDate} · ${compose.requestedTime || 'уточнить'}` : '', compose.text.trim()].filter(Boolean);
    startWithContact(contact, parts.join('\n'), request?.id || 'direct', request?.label || 'Новая беседа');
  };
  const sendReply = () => { if (!active || !reply.trim()) return; append(active, makeMsg(user.role, fullName(user), reply.trim())); setReply(''); };
  const setStatus = (status) => { if (!active) return; append(active, makeMsg('system', 'Система', `Статус: ${statusText(status)}.`), { status }); };
  const selectContact = (contact) => { setCompose((value) => ({ ...value, contactId: contact.id })); setMode('compose'); setMobile('list'); };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-[95] grid h-14 w-14 place-items-center rounded-full border border-lime-200/30 bg-lime-200 text-2xl font-black text-emerald-950 shadow-2xl shadow-black/45 md:bottom-6 md:right-6" aria-label="Сообщения">✉{unread > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">{unread}</span>}</button>
    {open && <div className="fixed bottom-20 right-2 z-[96] flex h-[84vh] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#05110b]/96 text-white shadow-2xl shadow-black/60 backdrop-blur-xl md:bottom-6 md:right-24 md:h-[790px] md:max-h-[calc(100vh-3rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[.03] px-4 py-3"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-lime-300/65">сообщения</div><h2 className="text-2xl font-black tracking-[-.05em] text-lime-50">Кому написать?</h2></div><div className="flex items-center gap-2"><button onClick={askPermission} className="hidden rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-emerald-50 md:block">{permission === 'granted' ? 'Уведомления включены' : 'Уведомления'}</button><button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Закрыть</button></div></div>
      <div className="grid grid-cols-3 gap-1 border-b border-white/10 p-2 md:hidden"><MobileTab id="list" value={mobile} set={setMobile} label="Диалоги" /><button onClick={() => { setMode('contacts'); setMobile('list'); }} className="rounded-xl bg-white/10 px-2 py-2 text-[10px] font-black text-white">Контакты</button><button onClick={() => { setMode('compose'); setMobile('list'); }} className="rounded-xl bg-lime-200 px-2 py-2 text-[10px] font-black text-emerald-950">Написать</button></div>
      <div className="grid min-h-0 flex-1 md:grid-cols-[390px_1fr]">
        <aside className={cx('min-h-0 overflow-y-auto border-b border-white/10 p-3 md:block md:border-b-0 md:border-r', mobile === 'chat' ? 'hidden' : 'block')}>
          <QuickStart contacts={contacts} selectContact={selectContact} setMode={setMode} user={user} />
          <div className="mt-3 hidden grid-cols-3 gap-1 rounded-2xl bg-white/8 p-1 md:grid"><PanelTab id="dialogs" value={mode} set={setMode} label="Диалоги" /><PanelTab id="contacts" value={mode} set={setMode} label="Контакты" /><PanelTab id="compose" value={mode} set={setMode} label="Написать" /></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск контакта или диалога" className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" />
          {mode === 'dialogs' && <Dialogs items={filteredDialogs} activeId={active?.id} pick={(id) => { setActiveId(id); setMobile('chat'); }} />}
          {mode === 'contacts' && <Contacts contacts={filteredContacts} selectContact={selectContact} />}
          {mode === 'compose' && <Compose contacts={filteredContacts} state={compose} setState={setCompose} send={sendCompose} events={currentEvents} user={user} />}
        </aside>
        <section className={cx('min-h-0 flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(190,255,120,.08),transparent_36%)] md:flex', mobile === 'chat' ? 'flex' : 'hidden')}>{active ? <Chat dialog={active} user={user} reply={reply} setReply={setReply} send={sendReply} setStatus={setStatus} back={() => setMobile('list')} /> : <EmptyChat setMode={setMode} />}</section>
      </div>
    </div>}
  </>;
}

function QuickStart({ contacts, selectContact, setMode, user }) {
  const admins = contacts.filter((item) => item.kind === 'admin').slice(0, 1);
  const employees = contacts.filter((item) => item.kind === 'employee').slice(0, user.role === 'admin' ? 3 : 1);
  const clients = contacts.filter((item) => item.kind === 'client').slice(0, 3);
  return <div className="rounded-2xl border border-lime-200/15 bg-lime-200/10 p-3"><div className="mb-2 flex items-center justify-between"><b className="text-sm text-lime-100">Быстро написать</b><button onClick={() => setMode('compose')} className="rounded-full bg-lime-200 px-3 py-1.5 text-[10px] font-black text-emerald-950">Новая беседа</button></div><div className="grid gap-2">{[...admins, ...employees, ...clients].map((contact) => <button key={contact.id} onClick={() => selectContact(contact)} className="flex items-center gap-2 rounded-xl bg-black/20 p-2 text-left"><Avatar contact={contact} /><div className="min-w-0"><b className="block truncate text-sm text-lime-50">{contact.name}</b><span className="block truncate text-[11px] text-emerald-50/50">{roleLabel(contact.kind)} · {contact.subtitle}</span></div></button>)}</div></div>;
}
function Dialogs({ items, activeId, pick }) { return <div className="mt-3 grid gap-2"><SectionTitle title="Диалоги" count={items.length} />{items.length === 0 && <Empty text="Диалогов пока нет. Нажмите «Написать» и выберите контакт." />}{items.map((item) => <button key={item.id} onClick={() => pick(item.id)} className={cx('rounded-2xl border p-3 text-left transition active:scale-[.99]', tone(item.contact.kind, activeId === item.id))}><div className="flex gap-2"><Avatar contact={item.contact} active={activeId === item.id} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><b className="truncate text-sm">{item.contact.name}</b><span className="rounded-full bg-black/15 px-2 py-1 text-[8px] font-black">{roleLabel(item.contact.kind)}</span></div><div className="truncate text-xs opacity-65">{item.contact.subtitle || typeText(item.threads[item.threads.length - 1]?.type)}</div><div className="mt-1 truncate text-[11px] opacity-60">{item.lastMessage ? `${item.lastMessage.name}: ${cut(item.lastMessage.text)}` : 'Нет сообщений'}</div><div className="mt-1 flex justify-between text-[10px] font-black opacity-50"><span>{statusText(item.status)}</span><span>{time(item.updatedAt)}</span></div></div></div></button>)}</div>; }
function Contacts({ contacts, selectContact }) { const groups = [['employee', 'Сотрудники'], ['client', 'Клиенты'], ['admin', 'Служебные']]; return <div className="mt-3 grid gap-3"><SectionTitle title="Контакты" count={contacts.length} />{groups.map(([kind, title]) => <ContactGroup key={kind} title={title} contacts={contacts.filter((item) => item.kind === kind)} selectContact={selectContact} />)}</div>; }
function ContactGroup({ title, contacts, selectContact }) { if (!contacts.length) return null; return <div><div className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/35">{title}</div><div className="grid gap-2">{contacts.map((contact) => <button key={contact.id} onClick={() => selectContact(contact)} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 p-3 text-left transition hover:bg-white/[.13]"><Avatar contact={contact} /><div className="min-w-0 flex-1"><b className="block truncate text-sm text-lime-50">{contact.name}</b><span className="block truncate text-xs text-emerald-50/45">{contact.subtitle || contact.phone || roleLabel(contact.kind)}</span></div><span className={cx('rounded-full border px-2 py-1 text-[9px] font-black', tone(contact.kind))}>{roleLabel(contact.kind)}</span></button>)}</div></div>; }
function Compose({ contacts, state, setState, send, events, user }) { const selected = contacts.find((item) => item.id === state.contactId); const isRequest = state.requestType !== 'direct'; return <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">Новая беседа</div><label className="mt-2 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">Получатель</span><select value={state.contactId} onChange={(event) => setState((prev) => ({ ...prev, contactId: event.target.value }))} className="w-full rounded-xl bg-white px-3 py-3 text-xs font-black text-emerald-950"><option value="">Выбрать, кому написать</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{roleLabel(contact.kind)} · {contact.name}</option>)}</select></label>{selected && <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/20 p-2"><Avatar contact={selected} /><div><b className="text-sm text-lime-50">{selected.name}</b><div className="text-[11px] text-emerald-50/45">{selected.subtitle}</div></div></div>}<label className="mt-2 block"><span className="mb-1 block text-[10px] font-black uppercase tracking-[.14em] text-emerald-50/45">Тип сообщения</span><select value={state.requestType} onChange={(event) => setState((prev) => ({ ...prev, requestType: event.target.value }))} className="w-full rounded-xl bg-white px-3 py-3 text-xs font-black text-emerald-950"><option value="direct">Обычное сообщение</option>{user.role === 'client' && requestTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{isRequest && ['reschedule', 'cancel'].includes(state.requestType) && <select value={state.appointmentId} onChange={(event) => setState((prev) => ({ ...prev, appointmentId: event.target.value }))} className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-xs font-bold text-emerald-950"><option value="">Выбрать сеанс</option>{events.map((event) => <option key={event.id} value={event.id}>{event.date} · {event.time} · {event.service}</option>)}</select>}{state.requestType === 'reschedule' && <div className="mt-2 grid grid-cols-2 gap-2"><input type="date" value={state.requestedDate} onChange={(event) => setState((prev) => ({ ...prev, requestedDate: event.target.value }))} className="rounded-xl bg-white px-3 py-3 text-xs font-bold text-emerald-950" /><input type="time" value={state.requestedTime} onChange={(event) => setState((prev) => ({ ...prev, requestedTime: event.target.value }))} className="rounded-xl bg-white px-3 py-3 text-xs font-bold text-emerald-950" /></div>}<textarea value={state.text} onChange={(event) => setState((prev) => ({ ...prev, text: event.target.value }))} rows={5} placeholder="Введите сообщение. Например: нужно уточнить время, перенести сеанс или написать клиенту." className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" /><button onClick={send} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-3 text-sm font-black text-emerald-950">Отправить сообщение</button></div>; }
function Chat({ dialog, user, reply, setReply, send, setStatus, back }) { return <><div className="border-b border-white/10 px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><button onClick={back} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white md:hidden">‹ Диалоги</button><Avatar contact={dialog.contact} /><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/60">{roleLabel(dialog.contact.kind)} · {statusText(dialog.status)}</div><h3 className="truncate text-xl font-black text-lime-50">{dialog.contact.name}</h3><p className="truncate text-xs text-emerald-50/55">{dialog.contact.subtitle || 'переписка'}</p></div></div>{['admin', 'therapist'].includes(user.role) && <div className="flex gap-1"><button onClick={() => setStatus('open')} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white">Открыт</button><button onClick={() => setStatus('pending')} className="rounded-full bg-blue-600 px-3 py-2 text-[10px] font-black text-white">В работе</button><button onClick={() => setStatus('resolved')} className="rounded-full bg-lime-200 px-3 py-2 text-[10px] font-black text-emerald-950">Закрыть</button></div>}</div></div><div className="min-h-0 flex-1 overflow-y-auto px-4 py-4"><div className="mx-auto grid max-w-3xl gap-2">{dialog.messages.map((message) => <Bubble key={message.id} message={message} self={message.role === user.role} />)}</div></div><div className="border-t border-white/10 bg-black/10 p-3"><div className="mx-auto flex max-w-3xl gap-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} className="min-w-0 flex-1 resize-none rounded-2xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none" placeholder="Написать сообщение..." /><button onClick={send} className="rounded-2xl bg-lime-200 px-4 text-xs font-black text-emerald-950">Отправить</button></div><div className="mx-auto mt-2 max-w-3xl text-[10px] font-bold text-emerald-50/35">Enter — отправить, Shift+Enter — новая строка.</div></div></>; }
function Bubble({ message, self }) { const system = message.role === 'system'; return <div className={cx('max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-lg', system ? 'mx-auto bg-white/8 text-center text-xs font-bold text-emerald-50/50' : self ? 'ml-auto bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}><div className="mb-1 text-[10px] font-black uppercase tracking-[.1em] opacity-55">{system ? time(message.at) : `${message.name} · ${time(message.at)}`}</div><div className="whitespace-pre-line leading-5">{message.text}</div></div>; }
function EmptyChat({ setMode }) { return <div className="grid flex-1 place-items-center p-6 text-center"><div className="max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-6"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-200 text-2xl text-emerald-950">✉</div><h3 className="mt-4 text-2xl font-black text-lime-50">Выберите диалог</h3><p className="mt-2 text-sm leading-6 text-emerald-50/55">Или нажмите «Написать», выберите клиента, сотрудника или администратора и отправьте первое сообщение.</p><button onClick={() => setMode('compose')} className="mt-4 rounded-full bg-lime-200 px-5 py-3 text-sm font-black text-emerald-950">Написать сообщение</button></div></div>; }
function Avatar({ contact, active = false }) { return <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full border text-xs font-black', tone(contact.kind, active))}>{String(contact.name || '?').slice(0, 1).toUpperCase()}</span>; }
function SectionTitle({ title, count }) { return <div className="flex items-center justify-between"><b className="text-sm text-lime-100">{title}</b><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-emerald-50/60">{count}</span></div>; }
function Empty({ text }) { return <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs font-bold text-emerald-50/45">{text}</div>; }
function PanelTab({ id, value, set, label }) { return <button onClick={() => set(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', value === id ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65')}>{label}</button>; }
function MobileTab({ id, value, set, label }) { return <button onClick={() => set(id)} className={cx('rounded-xl px-2 py-2 text-[10px] font-black', value === id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{label}</button>; }

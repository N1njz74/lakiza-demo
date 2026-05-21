import { useEffect, useMemo, useState } from 'react';

const STORAGE_THREADS = 'lakizaMessengerThreads';
const STORAGE_EVENTS = 'lakizaAdminSchedulerEvents';
const STORAGE_STAFF = 'lakizaAdminSchedulerStaff';
const STORAGE_CLIENTS = 'lakizaClientProfiles';
const STORAGE_DEMO_CLIENTS = 'lakizaDemoClients';

const DEFAULT_STAFF = [
  { id: 'kristina', name: 'Кристина Лакиза', title: 'Директор / старший массажист', active: true },
  { id: 'vera', name: 'Вера Соколова', title: 'Массажист', active: true },
  { id: 'alina', name: 'Алина Миронова', title: 'Массажист', active: true },
  { id: 'natalia', name: 'Наталья Орлова', title: 'Массажист', active: true },
];

const REQUEST_TYPES = [
  { id: 'question', label: 'Общий вопрос', target: 'admin', hint: 'вопрос администратору' },
  { id: 'reschedule', label: 'Перенос сеанса', target: 'admin', hint: 'запрос новой даты/времени' },
  { id: 'cancel', label: 'Отмена сеанса', target: 'admin', hint: 'отмена через администратора' },
  { id: 'therapist', label: 'Лично массажисту', target: 'therapist', hint: 'сообщение закреплённому специалисту' },
];

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function nowIso() {
  return new Date().toISOString();
}

function formatDateTime(value) {
  if (!value) return 'сейчас';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function cx(...items) {
  return items.filter(Boolean).join(' ');
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function phoneKey(value) {
  const raw = digits(value);
  if (raw.startsWith('7')) return raw.slice(1);
  if (raw.startsWith('8')) return raw.slice(1);
  return raw;
}

function userName(user) {
  return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь';
}

function clientId(user) {
  return phoneKey(user?.phone || user?.login) || String(user?.login || 'client').toLowerCase();
}

function staffName(staff, id) {
  return staff.find((person) => person.id === id)?.name || 'закреплённый массажист';
}

function eventMatchesUser(event, user) {
  const currentPhone = phoneKey(user?.phone || user?.login);
  const eventPhone = phoneKey(event?.phone);
  if (currentPhone && eventPhone && currentPhone === eventPhone) return true;
  return event?.client === userName(user);
}

function getAssignedStaffId(user, staff, clients, demoClients, events) {
  const id = clientId(user);
  const phone = phoneKey(user?.phone || user?.login);
  const profile = clients.find((item) => phoneKey(item.phone) === phone || item.id === `client-${id}`);
  if (profile?.assignedStaffId) return profile.assignedStaffId;

  const demoClient = demoClients.find((item) => phoneKey(item.phone) === phone || item.login === user?.login);
  if (demoClient?.assignedStaffId) return demoClient.assignedStaffId;

  const futureEvent = events.find((event) => eventMatchesUser(event, user) && event.staffId);
  if (futureEvent?.staffId) return futureEvent.staffId;

  return staff.find((person) => person.active !== false)?.id || 'kristina';
}

function getTherapistStaffId(user, staff) {
  if (user?.staffId) return user.staffId;
  if (user?.therapistId) return user.therapistId;
  const lower = userName(user).toLowerCase();
  const matched = staff.find((person) => lower && person.name.toLowerCase().includes(lower));
  return matched?.id || staff.find((person) => person.active !== false)?.id || 'kristina';
}

function baseMessage(authorRole, authorName, text) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authorRole,
    authorName,
    text,
    at: nowIso(),
  };
}

function ensureThreads(threads, user, staff, clients, demoClients, events) {
  const next = [...threads];
  const has = (id) => next.some((thread) => thread.id === id);

  if (user.role === 'client') {
    const id = clientId(user);
    const assignedId = getAssignedStaffId(user, staff, clients, demoClients, events);
    const clientName = userName(user);
    const supportId = `support-${id}`;
    const therapistThreadId = `therapist-${id}-${assignedId}`;

    if (!has(supportId)) {
      next.push({
        id: supportId,
        type: 'support',
        title: 'Администратор',
        subject: 'Общие вопросы по записи',
        clientId: id,
        clientName,
        staffId: null,
        staffName: '',
        status: 'open',
        updatedAt: nowIso(),
        messages: [baseMessage('admin', 'Администратор', 'Напишите сюда вопрос по записи, оплате, переносу или отмене.')],
      });
    }

    if (!has(therapistThreadId)) {
      next.push({
        id: therapistThreadId,
        type: 'therapist',
        title: staffName(staff, assignedId),
        subject: 'Личная связь с закреплённым массажистом',
        clientId: id,
        clientName,
        staffId: assignedId,
        staffName: staffName(staff, assignedId),
        status: 'open',
        updatedAt: nowIso(),
        messages: [baseMessage('therapist', staffName(staff, assignedId), 'Здесь можно уточнить самочувствие, пожелания и детали перед сеансом.')],
      });
    }
  }

  if (user.role === 'admin' && next.length === 0) {
    next.push({
      id: 'demo-support-olga',
      type: 'question',
      title: 'Ольга · общий вопрос',
      subject: 'Уточнение по записи',
      clientId: 'demo-olga',
      clientName: 'Ольга',
      staffId: 'kristina',
      staffName: staffName(staff, 'kristina'),
      status: 'open',
      updatedAt: nowIso(),
      messages: [baseMessage('client', 'Ольга', 'Здравствуйте. Можно уточнить, сколько длится первый сеанс?')],
    });
    next.push({
      id: 'demo-reschedule-natalia',
      type: 'reschedule',
      title: 'Наталья · перенос',
      subject: 'Запрос переноса сеанса',
      clientId: 'demo-natalia',
      clientName: 'Наталья',
      staffId: 'vera',
      staffName: staffName(staff, 'vera'),
      status: 'pending',
      updatedAt: nowIso(),
      appointmentId: 'demo-event',
      requestedDate: '',
      requestedTime: '',
      messages: [baseMessage('client', 'Наталья', 'Прошу перенести сеанс с пятницы на понедельник после 18:00.')],
    });
  }

  if (user.role === 'therapist') {
    const therapistId = getTherapistStaffId(user, staff);
    const hasTherapistThread = next.some((thread) => thread.staffId === therapistId && thread.type === 'therapist');
    if (!hasTherapistThread) {
      next.push({
        id: `demo-therapist-${therapistId}`,
        type: 'therapist',
        title: 'Марина · вопрос к массажисту',
        subject: 'Самочувствие перед сеансом',
        clientId: 'demo-marina',
        clientName: 'Марина',
        staffId: therapistId,
        staffName: staffName(staff, therapistId),
        status: 'open',
        updatedAt: nowIso(),
        messages: [baseMessage('client', 'Марина', 'После прошлого сеанса стало легче, но осталась тяжесть в шее. На следующем можно уделить ей больше времени?')],
      });
    }
  }

  return next;
}

function filterThreads(threads, user, staff) {
  if (user.role === 'admin') return threads;
  if (user.role === 'therapist') {
    const therapistId = getTherapistStaffId(user, staff);
    return threads.filter((thread) => thread.staffId === therapistId && thread.type !== 'support');
  }
  const id = clientId(user);
  return threads.filter((thread) => thread.clientId === id);
}

function statusLabel(status) {
  return { open: 'открыт', pending: 'в работе', resolved: 'закрыт' }[status] || status;
}

function typeLabel(type) {
  return {
    support: 'админ',
    therapist: 'массажист',
    question: 'вопрос',
    reschedule: 'перенос',
    cancel: 'отмена',
  }[type] || type;
}

export default function MessageHub({ user }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [activeId, setActiveId] = useState('');
  const [threads, setThreads] = useState(() => readJson(STORAGE_THREADS, []));
  const [draft, setDraft] = useState({ type: 'question', appointmentId: '', requestedDate: '', requestedTime: '', text: '' });

  const staff = useMemo(() => readJson(STORAGE_STAFF, DEFAULT_STAFF).filter((person) => person.active !== false), [open]);
  const clients = useMemo(() => readJson(STORAGE_CLIENTS, []), [open]);
  const demoClients = useMemo(() => readJson(STORAGE_DEMO_CLIENTS, []), [open]);
  const events = useMemo(() => readJson(STORAGE_EVENTS, []), [open]);

  useEffect(() => {
    const next = ensureThreads(threads, user, staff, clients, demoClients, events);
    if (next.length !== threads.length) {
      setThreads(next);
      saveJson(STORAGE_THREADS, next);
    }
  }, []);

  const visibleThreads = useMemo(() => filterThreads(threads, user, staff).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))), [threads, user, staff]);
  const activeThread = visibleThreads.find((thread) => thread.id === activeId) || visibleThreads[0] || null;
  const myEvents = useMemo(() => events.filter((event) => eventMatchesUser(event, user)).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [events, user]);
  const unreadCount = visibleThreads.filter((thread) => thread.status !== 'resolved' && thread.messages?.at(-1)?.authorRole !== user.role).length;
  const selectedType = REQUEST_TYPES.find((item) => item.id === draft.type) || REQUEST_TYPES[0];
  const assignedStaffId = user.role === 'client' ? getAssignedStaffId(user, staff, clients, demoClients, events) : getTherapistStaffId(user, staff);

  useEffect(() => {
    if (!activeId && visibleThreads[0]) setActiveId(visibleThreads[0].id);
    if (activeId && visibleThreads.length && !visibleThreads.some((thread) => thread.id === activeId)) setActiveId(visibleThreads[0].id);
  }, [visibleThreads, activeId]);

  const persist = (next) => {
    setThreads(next);
    saveJson(STORAGE_THREADS, next);
  };

  const sendReply = () => {
    const text = reply.trim();
    if (!text || !activeThread) return;
    const message = baseMessage(user.role, userName(user), text);
    const next = threads.map((thread) => thread.id === activeThread.id ? { ...thread, status: thread.status === 'resolved' ? 'open' : thread.status, updatedAt: nowIso(), messages: [...(thread.messages || []), message] } : thread);
    persist(next);
    setReply('');
  };

  const setThreadStatus = (status) => {
    if (!activeThread) return;
    const message = baseMessage('system', 'Система', `Статус обращения: ${statusLabel(status)}.`);
    const next = threads.map((thread) => thread.id === activeThread.id ? { ...thread, status, updatedAt: nowIso(), messages: [...(thread.messages || []), message] } : thread);
    persist(next);
  };

  const createRequest = () => {
    if (user.role !== 'client') return;
    const selectedEvent = myEvents.find((event) => event.id === draft.appointmentId);
    const targetStaffId = selectedType.target === 'therapist' ? assignedStaffId : selectedEvent?.staffId || assignedStaffId;
    const clientName = userName(user);
    const lines = [
      selectedType.label,
      selectedEvent ? `Сеанс: ${selectedEvent.date} · ${selectedEvent.time} · ${selectedEvent.service || 'услуга'}` : '',
      draft.type === 'reschedule' && draft.requestedDate ? `Желаемое время: ${draft.requestedDate} · ${draft.requestedTime || 'время уточнить'}` : '',
      draft.text.trim(),
    ].filter(Boolean);

    if (lines.length <= 1 && ['reschedule', 'cancel'].includes(draft.type) && !selectedEvent) return;
    if (lines.length <= 1 && !draft.text.trim()) return;

    const id = `request-${Date.now()}`;
    const thread = {
      id,
      type: draft.type,
      title: selectedType.target === 'therapist' ? `${clientName} · массажисту` : `${clientName} · ${selectedType.label.toLowerCase()}`,
      subject: selectedType.label,
      clientId: clientId(user),
      clientName,
      staffId: targetStaffId,
      staffName: staffName(staff, targetStaffId),
      status: 'pending',
      updatedAt: nowIso(),
      appointmentId: selectedEvent?.id || '',
      requestedDate: draft.requestedDate,
      requestedTime: draft.requestedTime,
      messages: [baseMessage('client', clientName, lines.join('\n'))],
    };

    const next = [thread, ...threads];
    persist(next);
    setActiveId(id);
    setDraft({ type: 'question', appointmentId: '', requestedDate: '', requestedTime: '', text: '' });
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[95] grid h-14 w-14 place-items-center rounded-full border border-lime-200/30 bg-lime-200 text-2xl font-black text-emerald-950 shadow-2xl shadow-black/45 transition hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        aria-label="Открыть сообщения"
      >
        <span>✉</span>
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">{unreadCount}</span>}
      </button>

      {open && (
        <div className="fixed bottom-20 right-2 z-[96] flex h-[82vh] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#06140d]/96 shadow-2xl shadow-black/60 backdrop-blur-xl md:bottom-6 md:right-24 md:h-[760px] md:max-h-[calc(100vh-3rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300/65">сообщения</div>
              <h2 className="text-xl font-black tracking-[-.04em] text-lime-50">Центр обращений</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Закрыть</button>
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-[330px_1fr]">
            <aside className="min-h-0 overflow-y-auto border-b border-white/10 p-3 md:border-b-0 md:border-r">
              {user.role === 'client' && (
                <ClientRequestForm
                  draft={draft}
                  setDraft={setDraft}
                  requestTypes={REQUEST_TYPES}
                  myEvents={myEvents}
                  selectedType={selectedType}
                  createRequest={createRequest}
                  assignedStaffName={staffName(staff, assignedStaffId)}
                />
              )}

              <div className="mb-2 mt-3 flex items-center justify-between">
                <b className="text-sm text-lime-100">Диалоги</b>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-emerald-50/60">{visibleThreads.length}</span>
              </div>

              <div className="grid gap-2">
                {visibleThreads.length === 0 && <EmptyState text="Диалогов пока нет." />}
                {visibleThreads.map((thread) => (
                  <ThreadButton key={thread.id} thread={thread} active={activeThread?.id === thread.id} onClick={() => setActiveId(thread.id)} />
                ))}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col">
              {activeThread ? (
                <>
                  <div className="border-b border-white/10 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300/60">{typeLabel(activeThread.type)} · {statusLabel(activeThread.status)}</div>
                        <h3 className="text-lg font-black text-lime-50">{activeThread.subject}</h3>
                        <p className="text-xs text-emerald-50/55">Клиент: {activeThread.clientName || '—'}{activeThread.staffName ? ` · Массажист: ${activeThread.staffName}` : ''}</p>
                      </div>
                      {(user.role === 'admin' || user.role === 'therapist') && (
                        <div className="flex flex-wrap gap-1">
                          <button type="button" onClick={() => setThreadStatus('open')} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black text-white">Открыт</button>
                          <button type="button" onClick={() => setThreadStatus('pending')} className="rounded-full bg-blue-600 px-3 py-2 text-[10px] font-black text-white">В работе</button>
                          <button type="button" onClick={() => setThreadStatus('resolved')} className="rounded-full bg-lime-200 px-3 py-2 text-[10px] font-black text-emerald-950">Закрыть</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                    <div className="grid gap-2">
                      {(activeThread.messages || []).map((message) => <MessageBubble key={message.id} message={message} self={message.authorRole === user.role} />)}
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-3">
                    <div className="flex gap-2">
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendReply();
                          }
                        }}
                        rows={2}
                        className="min-w-0 flex-1 resize-none rounded-2xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                        placeholder="Написать сообщение..."
                      />
                      <button type="button" onClick={sendReply} className="rounded-2xl bg-lime-200 px-4 text-xs font-black text-emerald-950">Отправить</button>
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-50/35">Enter — отправить, Shift+Enter — новая строка.</div>
                  </div>
                </>
              ) : (
                <div className="grid flex-1 place-items-center p-6 text-center text-sm font-bold text-emerald-50/50">Выберите диалог или создайте обращение.</div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function ClientRequestForm({ draft, setDraft, requestTypes, myEvents, selectedType, createRequest, assignedStaffName }) {
  const needsAppointment = ['reschedule', 'cancel'].includes(draft.type);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-[1.1rem] border border-lime-200/15 bg-lime-200/10 p-3">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-lime-200/60">новое обращение</div>
      <select value={draft.type} onChange={(event) => set('type', event.target.value)} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-950">
        {requestTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <div className="mt-2 text-[10px] font-bold text-emerald-50/55">{selectedType.hint}{selectedType.target === 'therapist' ? ` · ${assignedStaffName}` : ''}</div>

      {needsAppointment && (
        <select value={draft.appointmentId} onChange={(event) => set('appointmentId', event.target.value)} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950">
          <option value="">Выбрать сеанс</option>
          {myEvents.map((event) => <option key={event.id} value={event.id}>{event.date} · {event.time} · {event.service}</option>)}
        </select>
      )}

      {draft.type === 'reschedule' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input type="date" value={draft.requestedDate} onChange={(event) => set('requestedDate', event.target.value)} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" />
          <input type="time" value={draft.requestedTime} onChange={(event) => set('requestedTime', event.target.value)} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950" />
        </div>
      )}

      <textarea value={draft.text} onChange={(event) => set('text', event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" placeholder="Коротко опишите вопрос или причину" />
      <button type="button" onClick={createRequest} className="mt-2 w-full rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Создать обращение</button>
    </div>
  );
}

function ThreadButton({ thread, active, onClick }) {
  const last = thread.messages?.at(-1);
  return (
    <button type="button" onClick={onClick} className={cx('rounded-2xl p-3 text-left transition active:scale-[.99]', active ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50 hover:bg-white/[.14]')}>
      <div className="flex items-start justify-between gap-2">
        <b className="min-w-0 truncate text-sm">{thread.title}</b>
        <span className={cx('shrink-0 rounded-full px-2 py-1 text-[9px] font-black', active ? 'bg-emerald-950/10 text-emerald-950' : 'bg-black/25 text-lime-100')}>{typeLabel(thread.type)}</span>
      </div>
      <div className={cx('mt-1 truncate text-xs font-bold', active ? 'text-emerald-950/65' : 'text-emerald-50/55')}>{thread.subject}</div>
      <div className={cx('mt-2 line-clamp-2 text-[11px]', active ? 'text-emerald-950/55' : 'text-emerald-50/38')}>{last?.text || 'Сообщений нет'}</div>
      <div className={cx('mt-2 flex items-center justify-between text-[10px] font-black', active ? 'text-emerald-950/50' : 'text-emerald-50/35')}><span>{statusLabel(thread.status)}</span><span>{formatDateTime(thread.updatedAt)}</span></div>
    </button>
  );
}

function MessageBubble({ message, self }) {
  const isSystem = message.authorRole === 'system';
  return (
    <div className={cx('max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-lg', isSystem ? 'mx-auto bg-white/8 text-center text-xs font-bold text-emerald-50/50' : self ? 'ml-auto bg-lime-200 text-emerald-950' : 'bg-white/10 text-emerald-50')}>
      {!isSystem && <div className="mb-1 text-[10px] font-black uppercase tracking-[.1em] opacity-55">{message.authorName} · {formatDateTime(message.at)}</div>}
      <div className="whitespace-pre-line leading-5">{message.text}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs font-bold text-emerald-50/45">{text}</div>;
}

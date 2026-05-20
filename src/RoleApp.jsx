import { useMemo, useState } from 'react';

const STORE_USERS = 'lakizaDemoClients';
const STORE_APPOINTMENTS = 'lakizaDemoRoleAppointments';

const ROLE_LABELS = {
  client: 'Клиент',
  therapist: 'Массажист',
  admin: 'Администратор',
};

const SERVICES = ['Классический массаж', 'Спина и шея', 'Антистресс', 'Курс 4 сеанса', 'Курс 10 сеансов'];
const TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function cx(...items) {
  return items.filter(Boolean).join(' ');
}

export default function RoleApp({ user, logout, onUserUpdate, build }) {
  const [users, setUsers] = useState(() => readJson(STORE_USERS, []));
  const [appointments, setAppointments] = useState(() => readJson(STORE_APPOINTMENTS, []));
  const [section, setSection] = useState('main');

  const therapists = useMemo(() => {
    const localTherapists = users.filter((item) => item.role === 'therapist');
    const hasMaster = localTherapists.some((item) => item.login === 'master');
    return hasMaster ? localTherapists : [{ login: 'master', name: 'Массажист', role: 'therapist' }, ...localTherapists];
  }, [users]);

  const persistUsers = (next) => {
    setUsers(next);
    saveJson(STORE_USERS, next);
  };

  const persistAppointments = (next) => {
    setAppointments(next);
    saveJson(STORE_APPOINTMENTS, next);
  };

  const updateUserRole = (login, role) => {
    const next = users.map((item) => item.login === login ? { ...item, role } : item);
    persistUsers(next);
    if (user.login === login) onUserUpdate({ ...user, role });
  };

  return (
    <main className="min-h-screen bg-[#06110b] text-white selection:bg-lime-200 selection:text-emerald-950">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(190,255,120,.22),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(37,99,235,.2),transparent_30%),linear-gradient(180deg,#06110b_0%,#0b2114_52%,#06110b_100%)]" />
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 md:px-8 md:pt-5">
        <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-[#07140e]/90 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-4">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => setSection('main')} className="min-w-0 text-left">
              <div className="truncate text-sm font-black tracking-[.22em] text-lime-100">ЛАКИЗА</div>
              <div className="text-xs font-bold text-emerald-100/55">{ROLE_LABELS[user.role]} · {user.name}</div>
            </button>
            <nav className="hidden items-center gap-2 md:flex">
              {navItems(user.role).map((item) => (
                <button key={item.id} type="button" onClick={() => setSection(item.id)} className={cx('rounded-full px-4 py-2 text-sm font-black', section === item.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-lime-50')}>
                  {item.label}
                </button>
              ))}
            </nav>
            <button type="button" onClick={logout} className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-lime-50 md:px-4">Выйти</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 md:hidden">
            {navItems(user.role).slice(0, 3).map((item) => (
              <button key={item.id} type="button" onClick={() => setSection(item.id)} className={cx('rounded-2xl px-2 py-2 text-xs font-black', section === item.id ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>
                {item.short || item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-36 md:px-8 md:pt-40">
        <div className="mb-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-emerald-950">{build}</div>
        {user.role === 'client' && <ClientArea user={user} section={section} setSection={setSection} therapists={therapists} appointments={appointments} saveAppointments={persistAppointments} />}
        {user.role === 'therapist' && <TherapistArea user={user} section={section} appointments={appointments} saveAppointments={persistAppointments} />}
        {user.role === 'admin' && <AdminArea section={section} users={users} appointments={appointments} updateUserRole={updateUserRole} />}
      </section>
    </main>
  );
}

function navItems(role) {
  if (role === 'admin') return [{ id: 'main', label: 'Панель' }, { id: 'users', label: 'Пользователи' }, { id: 'appointments', label: 'Записи' }];
  if (role === 'therapist') return [{ id: 'main', label: 'Сегодня' }, { id: 'appointments', label: 'Все записи' }, { id: 'profile', label: 'Профиль' }];
  return [{ id: 'main', label: 'Главная' }, { id: 'book', label: 'Записаться', short: 'Запись' }, { id: 'appointments', label: 'Мои записи', short: 'Мои' }];
}

function ClientArea({ user, section, setSection, therapists, appointments, saveAppointments }) {
  const mine = appointments.filter((item) => item.clientLogin === user.login);
  if (section === 'book') return <BookingForm user={user} therapists={therapists} saveAppointments={saveAppointments} appointments={appointments} onDone={() => setSection('appointments')} />;
  if (section === 'appointments') return <List title="Мои записи" items={mine} empty="Записей пока нет." />;
  return <Hero title="Кабинет клиента" text="Записывайся на массаж, смотри свои будущие визиты и историю. Чужие записи здесь не отображаются." action="Записаться" onAction={() => setSection('book')} />;
}

function TherapistArea({ user, section, appointments, saveAppointments }) {
  const mine = appointments.filter((item) => item.therapistLogin === user.login || item.therapistLogin === 'master');
  const shown = section === 'main' ? mine.filter((item) => item.date === today()) : mine;
  const setStatus = (id, status) => saveAppointments(appointments.map((item) => item.id === id ? { ...item, status } : item));
  if (section === 'profile') return <Hero title="Кабинет массажиста" text="Здесь будет профиль специалиста: график, услуги, перерывы, заметки по клиентам." />;
  return <List title={section === 'main' ? 'Записи на сегодня' : 'Все мои записи'} items={shown} empty="Записей нет." actions={(item) => <StatusButtons item={item} setStatus={setStatus} />} />;
}

function AdminArea({ section, users, appointments, updateUserRole }) {
  if (section === 'users') {
    return (
      <Panel title="Пользователи" note="Администратор назначает роли">
        <div className="grid gap-3">
          {users.length === 0 && <Empty text="Зарегистрированных клиентов пока нет." />}
          {users.map((item) => (
            <div key={item.login} className="rounded-3xl bg-white/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><b className="text-xl text-lime-100">{item.name}</b><div className="text-sm text-emerald-50/60">{item.login} · {ROLE_LABELS[item.role]}</div></div>
                <div className="grid grid-cols-3 gap-2">
                  {['client', 'therapist', 'admin'].map((role) => <button key={role} type="button" onClick={() => updateUserRole(item.login, role)} className={cx('rounded-full px-3 py-2 text-xs font-black', item.role === role ? 'bg-lime-200 text-emerald-950' : 'bg-white/10 text-white')}>{ROLE_LABELS[role]}</button>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }
  if (section === 'appointments') return <List title="Все записи" items={appointments} empty="Записей пока нет." />;
  return <Hero title="Панель администратора" text="Админ видит всех пользователей, все записи и может назначать клиента массажистом или администратором." />;
}

function BookingForm({ user, therapists, appointments, saveAppointments, onDone }) {
  const [form, setForm] = useState({ service: SERVICES[0], therapistLogin: therapists[0]?.login || 'master', date: today(), time: TIMES[0], comment: '' });
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const therapist = therapists.find((item) => item.login === form.therapistLogin) || therapists[0];
  const submit = () => {
    const next = {
      id: `appt-${Date.now()}`,
      clientLogin: user.login,
      clientName: user.name,
      therapistLogin: form.therapistLogin,
      therapistName: therapist?.name || 'Массажист',
      service: form.service,
      date: form.date,
      time: form.time,
      comment: form.comment,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    saveAppointments([next, ...appointments]);
    onDone();
  };
  return (
    <Panel title="Новая запись" note="клиентская форма">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Услуга" value={form.service} onChange={(v) => setField('service', v)} options={SERVICES.map((x) => [x, x])} />
        <Select label="Массажист" value={form.therapistLogin} onChange={(v) => setField('therapistLogin', v)} options={therapists.map((x) => [x.login, x.name])} />
        <Input label="Дата" type="date" value={form.date} onChange={(v) => setField('date', v)} />
        <Select label="Время" value={form.time} onChange={(v) => setField('time', v)} options={TIMES.map((x) => [x, x])} />
        <div className="md:col-span-2"><Input label="Комментарий" value={form.comment} onChange={(v) => setField('comment', v)} placeholder="Пожелания, жалобы, зона массажа" /></div>
      </div>
      <button type="button" onClick={submit} className="mt-5 w-full rounded-full bg-lime-200 px-6 py-4 text-lg font-black text-emerald-950">Создать запись</button>
    </Panel>
  );
}

function List({ title, items, empty, actions }) {
  return (
    <Panel title={title} note={`${items.length} шт.`}>
      <div className="grid gap-3">
        {items.length === 0 && <Empty text={empty} />}
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <b className="text-xl text-lime-100">{item.date} · {item.time}</b>
                <div className="mt-1 text-emerald-50/75">{item.service}</div>
                <div className="text-sm text-emerald-50/50">Клиент: {item.clientName} · Мастер: {item.therapistName}</div>
                <div className="text-xs font-black uppercase tracking-[.14em] text-blue-200/80">{item.status}</div>
              </div>
              {actions?.(item)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StatusButtons({ item, setStatus }) {
  return <div className="grid grid-cols-3 gap-2"><button onClick={() => setStatus(item.id, 'confirmed')} className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">Подтвердить</button><button onClick={() => setStatus(item.id, 'done')} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white">Готово</button><button onClick={() => setStatus(item.id, 'cancelled')} className="rounded-full bg-red-500/20 px-3 py-2 text-xs font-black text-red-100">Отмена</button></div>;
}

function Hero({ title, text, action, onAction }) {
  return <div className="rounded-[2.5rem] border border-white/10 bg-white/[.07] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10"><div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-lime-200">role based ui</div><h1 className="text-5xl font-black leading-[.92] tracking-[-.07em] text-lime-50 md:text-7xl">{title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-50/70">{text}</p>{action && <button type="button" onClick={onAction} className="mt-8 rounded-full bg-lime-200 px-7 py-4 text-lg font-black text-emerald-950">{action}</button>}</div>;
}

function Panel({ title, note, children }) {
  return <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6"><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.18em] text-lime-300/70">{note}</div><h1 className="mt-1 text-4xl font-black tracking-[-.06em] text-lime-50">{title}</h1></div>{children}</div>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" /></label>;
}

function Select({ label, value, onChange, options }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-[.14em] text-lime-200/60">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 font-bold text-emerald-950 outline-none">{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>;
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center font-bold text-emerald-50/55">{text}</div>;
}

import AdminPro from './AdminPro.jsx';

function name(user) {
  return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь';
}

export default function RoleApp({ user, logout, build }) {
  if (user.role === 'admin') {
    return <Shell user={user} logout={logout} build={build}><AdminPro /></Shell>;
  }

  return (
    <Shell user={user} logout={logout} build={build}>
      <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/80 p-5 shadow-2xl shadow-black/30">
        <div className="mb-2 text-xs font-black uppercase tracking-[.18em] text-lime-300/70">рабочий кабинет</div>
        <h1 className="text-4xl font-black tracking-[-.06em] text-lime-50">{user.role === 'therapist' ? 'Кабинет массажиста' : 'Кабинет клиента'}</h1>
        <p className="mt-4 text-emerald-50/70">Следующим шагом разнесём клиентский и массажистский кабинет так же подробно, как административный.</p>
      </div>
    </Shell>
  );
}

function Shell({ user, logout, build, children }) {
  return (
    <main className="min-h-screen bg-[#06110b] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(190,255,120,.22),transparent_34%),linear-gradient(180deg,#06110b,#0b2114,#06110b)]" />
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-white/10 bg-[#07140e]/90 p-3 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black tracking-[.22em] text-lime-100">ЛАКИЗА</div>
              <div className="text-xs font-bold text-emerald-100/55">{name(user)} · {user.role}</div>
            </div>
            <button type="button" onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Выйти</button>
          </div>
        </div>
      </header>
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8">
        <div className="mb-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-emerald-950">{build}</div>
        {children}
      </section>
    </main>
  );
}

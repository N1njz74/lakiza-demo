import AdminPro from './AdminPro.jsx';

function name(user) {
  return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.login || 'Пользователь';
}

function roleLabel(role) {
  return { admin: 'Администратор', therapist: 'Массажист', client: 'Клиент' }[role] || role;
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
        <div className="mx-auto max-w-7xl rounded-[1.45rem] border border-white/10 bg-[#07140e]/92 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[.18em] text-lime-300/75">массажный кабинет «Лакиза»</div>
              <div className="mt-0.5 truncate text-xl font-black tracking-[.18em] text-lime-100 md:text-2xl">ЛАКИЗА</div>
              <div className="truncate text-xs font-bold text-emerald-100/55">{roleLabel(user.role)} · {name(user)}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="rounded-full border border-lime-200/20 bg-black/25 px-2 py-0.5 text-[9px] font-black text-lime-300/75">{build}</span>
              <button type="button" onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Выйти</button>
            </div>
          </div>
        </div>
      </header>
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
        {children}
      </section>
    </main>
  );
}

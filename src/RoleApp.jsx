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
    <main className="min-h-screen overflow-x-hidden bg-[#06110b] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(190,255,120,.22),transparent_34%),linear-gradient(180deg,#06110b,#0b2114,#06110b)]" />
      <header className="fixed left-0 right-0 top-0 z-50 px-2 pt-2 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.1rem] border border-white/10 bg-[#07140e]/94 px-3 py-2 shadow-2xl shadow-black/30 backdrop-blur-xl md:px-5 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="truncate text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">массажный кабинет</div>
                <span className="hidden rounded-full border border-lime-200/15 bg-black/20 px-1.5 py-0.5 text-[8px] font-black text-lime-300/55 sm:inline">{build}</span>
              </div>
              <div className="mt-0.5 truncate text-lg font-black leading-none tracking-[.14em] text-lime-100 md:text-xl">«ЛАКИЗА»</div>
              <div className="truncate text-[11px] font-bold text-emerald-100/55">{roleLabel(user.role)} · {name(user)}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full border border-lime-200/15 bg-black/20 px-1.5 py-0.5 text-[8px] font-black text-lime-300/55 sm:hidden">{build}</span>
              <button type="button" onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-lime-50">Выйти</button>
            </div>
          </div>
        </div>
      </header>
      <section className="relative mx-auto max-w-7xl overflow-x-hidden px-2 pb-24 pt-[92px] md:px-8 md:pt-28">
        {children}
      </section>
    </main>
  );
}
